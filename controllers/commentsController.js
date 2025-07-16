const pool = require('../db/database');

exports.addComment = async (req, res) => {
  const { task_id } = req.params;
  const { content, user_id } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO comments (content, task_id, user_id)
       VALUES ($1, $2, $3) RETURNING *`,
      [content, task_id, user_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
