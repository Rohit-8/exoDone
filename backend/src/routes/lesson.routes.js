import express from 'express';
import { query } from '../config/database.js';
import { optionalAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Get lesson by slug
router.get('/:slug', optionalAuth, async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user?.userId;

    // Get lesson details
    const lessonResult = await query(
      `SELECT l.*, t.name as topic_name, t.slug as topic_slug, 
        c.name as category_name, c.slug as category_slug
       FROM lessons l
       JOIN topics t ON l.topic_id = t.id
       JOIN categories c ON t.category_id = c.id
       WHERE l.slug = $1`,
      [slug]
    );

    if (lessonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const lesson = lessonResult.rows[0];

    // Get code examples
    const codeExamplesResult = await query(
      'SELECT * FROM code_examples WHERE lesson_id = $1 ORDER BY order_index ASC',
      [lesson.id]
    );

    // Get quiz questions (without correct answers initially)
    const quizResult = await query(
      `SELECT id, question_text, question_type, options, difficulty, points, order_index
       FROM quiz_questions 
       WHERE lesson_id = $1 
       ORDER BY order_index ASC`,
      [lesson.id]
    );

    // Get user progress if authenticated
    if (userId) {
      const progressResult = await query(
        'SELECT * FROM user_progress WHERE user_id = $1 AND lesson_id = $2',
        [userId, lesson.id]
      );

      lesson.userProgress = progressResult.rows[0] || null;
    }

    // Get previous and next lessons
    const navigationResult = await query(
      `SELECT id, title, slug, order_index 
       FROM lessons 
       WHERE topic_id = $1 AND (order_index = $2 - 1 OR order_index = $2 + 1)
       ORDER BY order_index ASC`,
      [lesson.topic_id, lesson.order_index]
    );

    const navigation = {
      previous: navigationResult.rows.find(l => l.order_index < lesson.order_index) || null,
      next: navigationResult.rows.find(l => l.order_index > lesson.order_index) || null
    };

    res.json({
      lesson,
      codeExamples: codeExamplesResult.rows,
      quizQuestions: quizResult.rows,
      navigation
    });
  } catch (error) {
    console.error('Get lesson error:', error);
    res.status(500).json({ error: 'Failed to fetch lesson' });
  }
});

// Search lessons
router.get('/search', optionalAuth, async (req, res) => {
  try {
    const { q, difficulty, category } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    let searchQuery = `
      SELECT l.*, t.name as topic_name, t.slug as topic_slug,
        c.name as category_name, c.slug as category_slug,
        ts_rank(to_tsvector('english', l.title || ' ' || l.summary || ' ' || l.content), 
                plainto_tsquery('english', $1)) as rank
      FROM lessons l
      JOIN topics t ON l.topic_id = t.id
      JOIN categories c ON t.category_id = c.id
      WHERE to_tsvector('english', l.title || ' ' || l.summary || ' ' || l.content) 
            @@ plainto_tsquery('english', $1)
    `;

    const params = [q];
    let paramIndex = 2;

    if (difficulty) {
      searchQuery += ` AND l.difficulty_level = $${paramIndex}`;
      params.push(difficulty);
      paramIndex++;
    }

    if (category) {
      searchQuery += ` AND c.slug = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    searchQuery += ' ORDER BY rank DESC LIMIT 20';

    const result = await query(searchQuery, params);
    res.json({ results: result.rows });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
