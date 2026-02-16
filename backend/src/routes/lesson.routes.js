import express from 'express';
import { query } from '../config/database.js';
import { optionalAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Helper: generate slug from title
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

// Create a new lesson/session (accessible to anyone — no auth required)
router.post('/', async (req, res) => {
  try {
    const { topic_id, title, content, summary, difficulty_level, estimated_time, key_points } = req.body;

    // Validation
    if (!topic_id || !title || !content) {
      return res.status(400).json({ error: 'topic_id, title, and content are required' });
    }

    const validDifficulties = ['beginner', 'intermediate', 'advanced', 'expert'];
    if (difficulty_level && !validDifficulties.includes(difficulty_level)) {
      return res.status(400).json({ error: `difficulty_level must be one of: ${validDifficulties.join(', ')}` });
    }

    // Check topic exists
    const topicCheck = await query('SELECT id, difficulty_level FROM topics WHERE id = $1', [topic_id]);
    if (topicCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Topic not found' });
    }

    // Generate slug and ensure uniqueness within topic
    let slug = slugify(title);
    const slugCheck = await query('SELECT id FROM lessons WHERE topic_id = $1 AND slug = $2', [topic_id, slug]);
    if (slugCheck.rows.length > 0) {
      slug = `${slug}-${Date.now()}`;
    }

    // Get next order_index
    const orderResult = await query(
      'SELECT COALESCE(MAX(order_index), 0) + 1 as next_order FROM lessons WHERE topic_id = $1',
      [topic_id]
    );
    const orderIndex = orderResult.rows[0].next_order;

    const result = await query(
      `INSERT INTO lessons (topic_id, title, slug, content, summary, difficulty_level, estimated_time, order_index, key_points)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        topic_id,
        title.trim(),
        slug,
        content,
        summary || null,
        difficulty_level || topicCheck.rows[0].difficulty_level || 'beginner',
        estimated_time || null,
        orderIndex,
        key_points || null
      ]
    );

    res.status(201).json({ lesson: result.rows[0], message: 'Lesson created successfully' });
  } catch (error) {
    console.error('Create lesson error:', error);
    res.status(500).json({ error: 'Failed to create lesson' });
  }
});

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
