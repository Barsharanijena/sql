const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

// POST /api/users - Create user
router.post('/', userController.createUser);

// GET /api/users - Get all users
router.get('/', userController.getAllUsers);

// GET /api/users/:id/tasks - Get user's tasks with comment count
router.get('/:id/tasks', userController.getUserTasks);

module.exports = router;