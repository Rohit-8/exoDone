import express from 'express';
import { query } from '../config/database.js';
import { optionalAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Helper: generate slug from name
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

// Create a new topic (accessible to anyone — no auth required)
router.post('/', async (req, res) => {
  try {
    const { category_id, name, description, difficulty_level, estimated_time } = req.body;

    // Validation
    if (!category_id || !name) {
      return res.status(400).json({ error: 'category_id and name are required' });
    }

    const validDifficulties = ['beginner', 'intermediate', 'advanced', 'expert'];
    if (difficulty_level && !validDifficulties.includes(difficulty_level)) {
      return res.status(400).json({ error: `difficulty_level must be one of: ${validDifficulties.join(', ')}` });
    }

    // Check category exists
    const categoryCheck = await query('SELECT id FROM categories WHERE id = $1', [category_id]);
    if (categoryCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Generate slug and ensure uniqueness
    let slug = slugify(name);
    const slugCheck = await query('SELECT id FROM topics WHERE slug = $1', [slug]);
    if (slugCheck.rows.length > 0) {
      slug = `${slug}-${Date.now()}`;
    }

    // Get next order_index
    const orderResult = await query(
      'SELECT COALESCE(MAX(order_index), 0) + 1 as next_order FROM topics WHERE category_id = $1',
      [category_id]
    );
    const orderIndex = orderResult.rows[0].next_order;

    const result = await query(
      `INSERT INTO topics (category_id, name, slug, description, difficulty_level, estimated_time, order_index)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [category_id, name.trim(), slug, description || null, difficulty_level || 'beginner', estimated_time || null, orderIndex]
    );

    res.status(201).json({ topic: result.rows[0], message: 'Topic created successfully' });
  } catch (error) {
    console.error('Create topic error:', error);
    res.status(500).json({ error: 'Failed to create topic' });
  }
});

// Get all topics
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, difficulty } = req.query;
    const userId = req.user?.userId;
    
    let queryText = `
      SELECT t.*, c.name as category_name, c.slug as category_slug,
        COUNT(DISTINCT l.id) as lesson_count
      FROM topics t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN lessons l ON t.id = l.topic_id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (category) {
      queryText += ` AND c.slug = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (difficulty) {
      queryText += ` AND t.difficulty_level = $${paramIndex}`;
      params.push(difficulty);
      paramIndex++;
    }

    queryText += ' GROUP BY t.id, c.name, c.slug ORDER BY t.order_index ASC';

    const result = await query(queryText, params);
    
    // Fetch lessons for each topic
    const topicsWithLessons = await Promise.all(
      result.rows.map(async (topic) => {
        let lessonsQuery = `
          SELECT l.id, l.title, l.slug, l.summary, l.difficulty_level, l.estimated_time, l.order_index
          FROM lessons l
          WHERE l.topic_id = $1
          ORDER BY l.order_index ASC
        `;
        const lessonsResult = await query(lessonsQuery, [topic.id]);
        
        // Get progress for each lesson if user is authenticated
        if (userId) {
          const lessonsWithProgress = await Promise.all(
            lessonsResult.rows.map(async (lesson) => {
              const progressResult = await query(
                'SELECT status, progress_percentage FROM user_progress WHERE user_id = $1 AND lesson_id = $2',
                [userId, lesson.id]
              );
              return {
                ...lesson,
                userProgress: progressResult.rows[0] || null
              };
            })
          );
          return { ...topic, lessons: lessonsWithProgress };
        }
        
        return { ...topic, lessons: lessonsResult.rows };
      })
    );
    
    res.json({ topics: topicsWithLessons });
  } catch (error) {
    console.error('Get topics error:', error);
    res.status(500).json({ error: 'Failed to fetch topics' });
  }
});

// Get topic by slug with lessons
router.get('/:slug', optionalAuth, async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user?.userId;

    const topicResult = await query(
      `SELECT t.*, c.name as category_name, c.slug as category_slug
       FROM topics t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.slug = $1`,
      [slug]
    );

    if (topicResult.rows.length === 0) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    const topic = topicResult.rows[0];

    // Get lessons for this topic with progress if user is authenticated
    let lessonsQuery = `
      SELECT l.*,
        COUNT(DISTINCT ce.id) as code_example_count,
        COUNT(DISTINCT qq.id) as quiz_count
    `;

    if (userId) {
      lessonsQuery += `, up.status as user_status, up.progress_percentage`;
    }

    lessonsQuery += `
      FROM lessons l
      LEFT JOIN code_examples ce ON l.id = ce.lesson_id
      LEFT JOIN quiz_questions qq ON l.id = qq.lesson_id
    `;

    if (userId) {
      lessonsQuery += `
        LEFT JOIN user_progress up ON l.id = up.lesson_id AND up.user_id = $2
      `;
    }

    lessonsQuery += `
      WHERE l.topic_id = $1
      GROUP BY l.id
    `;

    if (userId) {
      lessonsQuery += `, up.status, up.progress_percentage`;
    }

    lessonsQuery += ` ORDER BY l.order_index ASC`;

    const params = userId ? [topic.id, userId] : [topic.id];
    const lessonsResult = await query(lessonsQuery, params);

    topic.lessons = lessonsResult.rows;

    res.json({ topic });
  } catch (error) {
    console.error('Get topic error:', error);
    res.status(500).json({ error: 'Failed to fetch topic' });
  }
});

export default router;
