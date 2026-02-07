import express from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../config/database.js';
import { optionalAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes use optional authentication
router.use(optionalAuth);

// Get user's overall progress
router.get('/overview', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Please login to view your progress' });
    }
    
    const userId = req.user.userId;

    // Get progress by category
    const categoryProgress = await query(
      `SELECT 
        c.name as category_name,
        c.slug as category_slug,
        COUNT(DISTINCT l.id) as total_lessons,
        COUNT(DISTINCT CASE WHEN up.status = 'completed' THEN l.id END) as completed_lessons,
        COALESCE(AVG(CASE WHEN up.status = 'completed' THEN 100 ELSE up.progress_percentage END), 0) as progress_percentage
       FROM categories c
       JOIN topics t ON c.id = t.category_id
       JOIN lessons l ON t.id = l.topic_id
       LEFT JOIN user_progress up ON l.id = up.lesson_id AND up.user_id = $1
       GROUP BY c.id, c.name, c.slug
       ORDER BY c.order_index ASC`,
      [userId]
    );

    // Get recent activity
    const recentActivity = await query(
      `SELECT up.*, l.title as lesson_title, l.slug as lesson_slug,
        t.name as topic_name, c.name as category_name
       FROM user_progress up
       JOIN lessons l ON up.lesson_id = l.id
       JOIN topics t ON l.topic_id = t.id
       JOIN categories c ON t.category_id = c.id
       WHERE up.user_id = $1
       ORDER BY up.last_accessed DESC
       LIMIT 10`,
      [userId]
    );

    res.json({
      categoryProgress: categoryProgress.rows,
      recentActivity: recentActivity.rows
    });
  } catch (error) {
    console.error('Get progress overview error:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// Update lesson progress
router.post('/lesson/:lessonId',
  [
    body('status').isIn(['not_started', 'in_progress', 'completed']),
    body('progressPercentage').optional().isInt({ min: 0, max: 100 }),
    body('timeSpent').optional().isInt({ min: 0 }),
    body('notes').optional().isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.user) {
        return res.status(401).json({ error: 'Please login to track your progress' });
      }

      const userId = req.user.userId;
      const { lessonId } = req.params;
      const { status, progressPercentage, timeSpent, notes } = req.body;

      // Check if progress exists
      const existingProgress = await query(
        'SELECT id, status, progress_percentage, time_spent FROM user_progress WHERE user_id = $1 AND lesson_id = $2',
        [userId, lessonId]
      );

      let result;

      if (existingProgress.rows.length === 0) {
        // Create new progress
        result = await query(
          `INSERT INTO user_progress (user_id, lesson_id, status, progress_percentage, time_spent, notes, started_at, completed_at, last_accessed)
           VALUES ($1, $2, $3, $4, $5, $6, 
             CASE WHEN $3 = 'in_progress' THEN CURRENT_TIMESTAMP ELSE NULL END,
             CASE WHEN $3 = 'completed' THEN CURRENT_TIMESTAMP ELSE NULL END,
             CURRENT_TIMESTAMP)
           RETURNING *`,
          [userId, lessonId, status, progressPercentage || 0, timeSpent || 0, notes || null]
        );
      } else {
        // Update existing progress
        const currentProgress = existingProgress.rows[0];
        const newTimeSpent = (currentProgress.time_spent || 0) + (timeSpent || 0);
        
        result = await query(
          `UPDATE user_progress 
           SET status = $1, 
               progress_percentage = $2, 
               time_spent = $3,
               notes = COALESCE($4, notes),
               completed_at = CASE 
                 WHEN $1 = 'completed' AND status != 'completed' THEN CURRENT_TIMESTAMP 
                 WHEN $1 != 'completed' THEN NULL
                 ELSE completed_at 
               END,
               last_accessed = CURRENT_TIMESTAMP
           WHERE user_id = $5 AND lesson_id = $6
           RETURNING *`,
          [status, progressPercentage || currentProgress.progress_percentage, newTimeSpent, notes, userId, lessonId]
        );
      }

      res.json({
        message: 'Progress updated successfully',
        progress: result.rows[0]
      });
    } catch (error) {
      console.error('Update progress error:', error);
      res.status(500).json({ error: 'Failed to update progress' });
    }
  }
);

// Get progress for specific lesson
router.get('/lesson/:lessonId', async (req, res) => {
  try {
    if (!req.user) {
      return res.json({ progress: null });
    }
    
    const userId = req.user.userId;
    const { lessonId } = req.params;

    const result = await query(
      'SELECT * FROM user_progress WHERE user_id = $1 AND lesson_id = $2',
      [userId, lessonId]
    );

    if (result.rows.length === 0) {
      return res.json({ progress: null });
    }

    res.json({ progress: result.rows[0] });
  } catch (error) {
    console.error('Get lesson progress error:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

export default router;
