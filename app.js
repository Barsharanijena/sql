const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
// Test user routes first
const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);
// Add this line too
const taskRoutes = require('./routes/tasks');
app.use('/api/tasks', taskRoutes);
const commentRoutes = require('./routes/comments');
app.use('/api/comments', commentRoutes);

const tagRoutes = require('./routes/tags');
app.use('/api/tags', tagRoutes);
// Simple test route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Task Tracker Pro API is running',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
});