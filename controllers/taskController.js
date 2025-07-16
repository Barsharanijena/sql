const pool = require('../db/database');

const taskController = {
  // CREATE TASK
  async createTask(req, res) {
    try {
      const { title, description, status = 'pending', user_id } = req.body;
      
      if (!title || !user_id) {
        return res.status(400).json({ error: 'Title and user_id are required' });
      }

      const query = `
        INSERT INTO tasks (title, description, status, user_id) 
        VALUES ($1, $2, $3, $4) 
        RETURNING id, title, description, status, created_at, user_id
      `;
      
      const result = await pool.query(query, [title, description, status, user_id]);
      
      res.status(201).json({
        message: 'Task created successfully',
        task: result.rows[0]
      });
    } catch (error) {
      console.error('Error creating task:', error);
      if (error.code === '23503') { // Foreign key constraint violation
        return res.status(400).json({ error: 'Invalid user_id' });
      }
      res.status(500).json({ error: 'Failed to create task' });
    }
  },

  // GET TASK DETAILS (Multiple JOINs)
  async getTaskDetails(req, res) {
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
          u.email as user_email,
          array_agg(DISTINCT tag.name) FILTER (WHERE tag.name IS NOT NULL) as tags,
          json_agg(
            json_build_object(
              'id', c.id,
              'content', c.content,
              'created_at', c.created_at,
              'user_name', cu.name
            ) ORDER BY c.created_at DESC
          ) FILTER (WHERE c.id IS NOT NULL) as comments
        FROM tasks t
        JOIN users u ON t.user_id = u.id
        LEFT JOIN task_tags tt ON t.id = tt.task_id
        LEFT JOIN tags tag ON tt.tag_id = tag.id
        LEFT JOIN comments c ON t.id = c.task_id
        LEFT JOIN users cu ON c.user_id = cu.id
        WHERE t.id = $1
        GROUP BY t.id, t.title, t.description, t.status, t.created_at, u.name, u.email
      `;
      
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }
      
      res.json({ task: result.rows[0] });
    } catch (error) {
      console.error('Error fetching task details:', error);
      res.status(500).json({ error: 'Failed to fetch task details' });
    }
  },

  // DELETE TASK (Transaction with CASCADE)
  async deleteTask(req, res) {
    const client = await pool.connect();
    try {
      const { id } = req.params;
      
      await client.query('BEGIN');
      
      // Check if task exists
      const checkQuery = 'SELECT id FROM tasks WHERE id = $1';
      const checkResult = await client.query(checkQuery, [id]);
      
      if (checkResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Task not found' });
      }
      
      // Delete in order (foreign key constraints)
      await client.query('DELETE FROM task_tags WHERE task_id = $1', [id]);
      await client.query('DELETE FROM comments WHERE task_id = $1', [id]);
      await client.query('DELETE FROM tasks WHERE id = $1', [id]);
      
      await client.query('COMMIT');
      
      res.json({ message: 'Task deleted successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error deleting task:', error);
      res.status(500).json({ error: 'Failed to delete task' });
    } finally {
      client.release();
    }
  },

  // GET LATEST COMMENT FOR EACH TASK (Subquery/Window Function)
  async getTasksWithLatestComment(req, res) {
    try {
      const query = `
        SELECT 
          t.id,
          t.title,
          t.status,
          u.name as user_name,
          latest_comments.content as latest_comment,
          latest_comments.created_at as latest_comment_date,
          latest_comments.commenter_name
        FROM tasks t
        JOIN users u ON t.user_id = u.id
        LEFT JOIN (
          SELECT DISTINCT ON (c.task_id) 
            c.task_id,
            c.content,
            c.created_at,
            cu.name as commenter_name
          FROM comments c
          JOIN users cu ON c.user_id = cu.id
          ORDER BY c.task_id, c.created_at DESC
        ) latest_comments ON t.id = latest_comments.task_id
        ORDER BY t.created_at DESC
      `;
      
      const result = await pool.query(query);
      
      res.json({ tasks: result.rows });
    } catch (error) {
      console.error('Error fetching tasks with latest comments:', error);
      res.status(500).json({ error: 'Failed to fetch tasks with latest comments' });
    }
  },

  // ADD TAGS TO TASK
  async addTagsToTask(req, res) {
    const client = await pool.connect();
    try {
      const { id } = req.params;
      const { tags } = req.body; // Array of tag names
      
      if (!Array.isArray(tags) || tags.length === 0) {
        return res.status(400).json({ error: 'Tags array is required' });
      }
      
      await client.query('BEGIN');
      
      // Check if task exists
      const taskCheck = await client.query('SELECT id FROM tasks WHERE id = $1', [id]);
      if (taskCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Task not found' });
      }
      
      // Insert tags if they don't exist and get their IDs
      const tagIds = [];
      for (const tagName of tags) {
        const tagQuery = `
          INSERT INTO tags (name) 
          VALUES ($1) 
          ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
          RETURNING id
        `;
        const tagResult = await client.query(tagQuery, [tagName]);
        tagIds.push(tagResult.rows[0].id);
      }
      
      // Insert task-tag relationships
      for (const tagId of tagIds) {
        const relationQuery = `
          INSERT INTO task_tags (task_id, tag_id) 
          VALUES ($1, $2) 
          ON CONFLICT (task_id, tag_id) DO NOTHING
        `;
        await client.query(relationQuery, [id, tagId]);
      }
      
      await client.query('COMMIT');
      
      res.json({ 
        message: 'Tags added successfully',
        task_id: id,
        tags: tags
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error adding tags to task:', error);
      res.status(500).json({ error: 'Failed to add tags to task' });
    } finally {
      client.release();
    }
  }
};

module.exports = taskController;