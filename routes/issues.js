const express = require('express');
const router = express.Router();
const issueController = require('../controllers/issueController');
const { requireAuth, requireCitizen, requireAuthority } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

// Public route to list issues
router.get('/', issueController.getIssues);

// Public route to get issue by id
router.get('/:id', issueController.getIssueById);

// Protected: citizen only - report new issue with optional photo
router.post('/', requireCitizen, upload.single('photo'), issueController.createIssue);

// Protected: authority only - update issue status
router.put('/:id/status', requireAuthority, issueController.updateStatus);

// Protected: citizen only - toggle upvote
router.post('/:id/upvote', requireCitizen, issueController.toggleUpvote);

// Protected: citizen or authority - add comment
router.post('/:id/comment', requireAuth, issueController.addComment);

// Protected: admin or reporting citizen (pending only)
router.delete('/:id', requireAuth, issueController.deleteIssue);

module.exports = router;
