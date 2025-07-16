const express = require('express');
const pool = require('../db/database');

const router = express.Router();

// POST /api/comments - Add comment to task
router.post('/', async (req, res) => {
  try {
    const { content, task_id, user_id } = req.body;
    
    if (!content || !task_id || !user_id) {
      return res.status(400).json({ error: 'Content, task_id, and user_id are required' });
    }

    const query = `
      INSERT INTO comments (content, task_id, user_id) 
      VALUES ($1, $2, $3) 
      RETURNING id, content, created_at, task_id, user_id
    `;
    
    const result = await pool.query(query, [content, task_id, user_id]);
    
    res.status(201).json({
      message: 'Comment added successfully',
      comment: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Invalid task_id or user_id' });
    }
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

module.exports = router;