const pool = require('../db/database');

exports.addTagsToTask = async (req, res) => {
  const { task_id } = req.params;
  const { tag_ids } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const tag_id of tag_ids) {
      await client.query(
        'INSERT INTO task_tags (task_id, tag_id) VALUES ($1, $2)',
        [task_id, tag_id]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ message: 'Tags added to task' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

exports.getTasksByTag = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT t.*
       FROM tasks t
       JOIN task_tags tt ON t.id = tt.task_id
       WHERE tt.tag_id = $1`,
      [req.params.tag_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
