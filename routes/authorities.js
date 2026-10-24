const express = require('express');
const router = express.Router();
const authorityController = require('../controllers/authorityController');
const { requireAuthority } = require('../middleware/authMiddleware');

// Public: Get all authority rankings
router.get('/leaderboard', authorityController.getLeaderboard);

// Public: Get specific authority stats & recent 5 resolved issues
router.get('/:id/stats', authorityController.getAuthorityStats);

// Protected: Authority only - get issues assigned to logged in authority
router.get('/:id/issues', requireAuthority, authorityController.getAuthorityIssues);

module.exports = router;
