import express from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../config/database.js';
import { optionalAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Submit quiz answer
router.post('/submit',
  optionalAuth,
  [
    body('questionId').isInt(),
    body('userAnswer').notEmpty(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Only logged-in users can submit quizzes
      if (!req.user) {
        return res.status(401).json({ error: 'Please login to submit quiz answers and track your progress' });
      }

      const userId = req.user.userId;
      const { questionId, userAnswer } = req.body;

      // Get question with correct answer
      const questionResult = await query(
        'SELECT * FROM quiz_questions WHERE id = $1',
        [questionId]
      );

      if (questionResult.rows.length === 0) {
        return res.status(404).json({ error: 'Question not found' });
      }

      const question = questionResult.rows[0];

      // Check if answer is correct
      const isCorrect = userAnswer.toLowerCase().trim() === question.correct_answer.toLowerCase().trim();
      const pointsEarned = isCorrect ? question.points : 0;

      // Get attempt number
      const attemptCountResult = await query(
        'SELECT COUNT(*) as count FROM quiz_attempts WHERE user_id = $1 AND quiz_question_id = $2',
        [userId, questionId]
      );

      const attemptNumber = parseInt(attemptCountResult.rows[0].count) + 1;

      // Save attempt
      const attemptResult = await query(
        `INSERT INTO quiz_attempts (user_id, quiz_question_id, user_answer, is_correct, points_earned, attempt_number)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [userId, questionId, userAnswer, isCorrect, pointsEarned, attemptNumber]
      );

      res.json({
        isCorrect,
        pointsEarned,
        explanation: question.explanation,
        correctAnswer: question.correct_answer,
        attempt: attemptResult.rows[0]
      });
    } catch (error) {
      console.error('Submit quiz error:', error);
      res.status(500).json({ error: 'Failed to submit answer' });
    }
  }
);

// Get user's quiz statistics
router.get('/stats', optionalAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Please login to view your quiz statistics' });
    }
    
    const userId = req.user.userId;

    const stats = await query(
      `SELECT 
        COUNT(*) as total_attempts,
        COUNT(CASE WHEN is_correct THEN 1 END) as correct_answers,
        SUM(points_earned) as total_points,
        ROUND(AVG(CASE WHEN is_correct THEN 100 ELSE 0 END), 2) as accuracy_percentage
       FROM quiz_attempts
       WHERE user_id = $1`,
      [userId]
    );

    res.json({ stats: stats.rows[0] });
  } catch (error) {
    console.error('Get quiz stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get user's attempts for a specific lesson
router.get('/lesson/:lessonId', optionalAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.json({ attempts: [] });
    }
    
    const userId = req.user.userId;
    const { lessonId } = req.params;

    const attempts = await query(
      `SELECT qa.*, qq.question_text, qq.question_type
       FROM quiz_attempts qa
       JOIN quiz_questions qq ON qa.quiz_question_id = qq.id
       WHERE qa.user_id = $1 AND qq.lesson_id = $2
       ORDER BY qa.attempted_at DESC`,
      [userId, lessonId]
    );

    res.json({ attempts: attempts.rows });
  } catch (error) {
    console.error('Get lesson attempts error:', error);
    res.status(500).json({ error: 'Failed to fetch attempts' });
  }
});

export default router;
