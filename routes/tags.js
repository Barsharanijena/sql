const express = require('express');
const pool = require('../db/database');
const router = express.Router();

// GET /api/tags/:id/tasks - Get tasks by tag
router.get('/:id/tasks', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        t.id,
        t.title,
        t.description,
        t.status,
        t.created_at,
        u.name as user_name,
        tag.name as tag_name,
        COUNT(c.id) as comment_count
      FROM tasks t
      JOIN users u ON t.user_id = u.id
      JOIN task_tags tt ON t.id = tt.task_id
      JOIN tags tag ON tt.tag_id = tag.id
      LEFT JOIN comments c ON t.id = c.task_id
      WHERE tag.id = $1
      GROUP BY t.id, t.title, t.description, t.status, t.created_at, u.name, tag.name
      ORDER BY t.created_at DESC
    `;
    
    const result = await pool.query(query, [id]);
    
    res.json({
      tag_id: id,
      tasks: result.rows
    });
  } catch (error) {
    console.error('Error fetching tasks by tag:', error);
    res.status(500).json({ error: 'Failed to fetch tasks by tag' });
  }
});
// GET /api/tags - Get all tags
router.get('/', async (req, res) => {
  try {
    const query = 'SELECT id, name, created_at FROM tags ORDER BY name';
    const result = await pool.query(query);
    
    res.json({ tags: result.rows });
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

module.exports = router;