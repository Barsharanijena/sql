const express = require('express');
const taskController = require('../controllers/taskController');

const router = express.Router();

// PUT SPECIFIC ROUTES FIRST (before :id routes)
router.get('/latest-comments', taskController.getTasksWithLatestComment);

// THEN PUT PARAMETERIZED ROUTES
router.post('/', taskController.createTask);
router.get('/:id', taskController.getTaskDetails);
router.delete('/:id', taskController.deleteTask);
router.post('/:id/tags', taskController.addTagsToTask);

module.exports = router;