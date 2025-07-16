const pool = require('../db/database');
const userController = {
  // CREATE USER
  async createUser(req, res) {
    try {
      const { name, email } = req.body;
      
      if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
      }

      const query = `
        INSERT INTO users (name, email) 
        VALUES ($1, $2) 
        RETURNING id, name, email, created_at
      `;
      
      const result = await pool.query(query, [name, email]);
      
      res.status(201).json({
        message: 'User created successfully',
        user: result.rows[0]
      });
    } catch (error) {
      console.error('Error creating user:', error);
      if (error.code === '23505') { // Unique constraint violation
        return res.status(409).json({ error: 'Email already exists' });
      }
      res.status(500).json({ error: 'Failed to create user' });
    }
  },

  // GET USER'S TASKS WITH COMMENT COUNT (Advanced JOIN + Aggregation)
  async getUserTasks(req, res) {
    try {
      const { id } = req.params;
      
      const query = `
        SELECT 
          t.id,
          t.title,
          t.description,
          t.status,
          t.created_at,
          COUNT(c.id) as comment_count,
          array_agg(DISTINCT tag.name) FILTER (WHERE tag.name IS NOT NULL) as tags
        FROM tasks t
        LEFT JOIN comments c ON t.id = c.task_id
        LEFT JOIN task_tags tt ON t.id = tt.task_id
        LEFT JOIN tags tag ON tt.tag_id = tag.id
        WHERE t.user_id = $1
        GROUP BY t.id, t.title, t.description, t.status, t.created_at
        ORDER BY t.created_at DESC
      `;
      
      const result = await pool.query(query, [id]);
      
      res.json({
        user_id: id,
        tasks: result.rows
      });
    } catch (error) {
      console.error('Error fetching user tasks:', error);
      res.status(500).json({ error: 'Failed to fetch user tasks' });
    }
  },

  // GET ALL USERS (Simple query)
  async getAllUsers(req, res) {
    try {
      const query = 'SELECT id, name, email, created_at FROM users ORDER BY created_at DESC';
      const result = await pool.query(query);
      
      res.json({ users: result.rows });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }
};

module.exports = userController;