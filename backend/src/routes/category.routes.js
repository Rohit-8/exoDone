import express from 'express';
import { query } from '../config/database.js';
import { optionalAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Get all categories
router.get('/', optionalAuth, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM categories ORDER BY order_index ASC'
    );

    res.json({ categories: result.rows });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get category by slug with topics
router.get('/:slug', optionalAuth, async (req, res) => {
  try {
    const { slug } = req.params;

    const categoryResult = await query(
      'SELECT * FROM categories WHERE slug = $1',
      [slug]
    );

    if (categoryResult.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const category = categoryResult.rows[0];

    // Get topics for this category
    const topicsResult = await query(
      `SELECT t.*, 
        COUNT(DISTINCT l.id) as lesson_count,
        COALESCE(AVG(l.estimated_time), 0) as avg_time
       FROM topics t
       LEFT JOIN lessons l ON t.id = l.topic_id
       WHERE t.category_id = $1
       GROUP BY t.id
       ORDER BY t.order_index ASC`,
      [category.id]
    );

    category.topics = topicsResult.rows;

    res.json({ category });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

export default router;
