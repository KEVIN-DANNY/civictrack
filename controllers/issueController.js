const Issue = require('../models/Issue');
const User = require('../models/User');
const AuthorityStats = require('../models/AuthorityStats');
const { recalculateScore } = require('../utils/scoreCalculator');

const getIssues = async (req, res) => {
  try {
    const { ward, category, status, search } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = {};

    if (ward && ward !== 'all') {
      filter.ward = ward;
    }
    if (category && category !== 'all') {
      filter.category = category;
    }
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { 'location.address': searchRegex }
      ];
    }

    const totalCount = await Issue.countDocuments(filter);
    const issues = await Issue.find(filter)
      .populate('reportedBy', 'name')
      .populate('assignedTo', 'name')
      .sort({ upvoteCount: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.json({
      success: true,
      issues,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit) || 1
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Server error while fetching issues.' });
  }
};

const getIssueById = async (req, res) => {
  try {
    const { id } = req.params;
    const issue = await Issue.findById(id)
      .populate('reportedBy', 'name ward')
      .populate('assignedTo', 'name')
      .populate('comments.user', 'name');

    if (!issue) {
      return res.status(404).json({ success: false, error: 'Issue not found.' });
    }

    return res.json({ success: true, issue });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Server error while fetching issue detail.' });
  }
};

const createIssue = async (req, res) => {
  try {
    const { title, description, category, ward, address, lat, lng } = req.body;

    if (!title || !description || !category || !ward || !address) {
      return res.status(400).json({ success: false, error: 'Title, description, category, ward, and address are required.' });
    }

    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();

    if (trimmedTitle.length < 10 || trimmedTitle.length > 100) {
      return res.status(400).json({ success: false, error: 'Title must be between 10 and 100 characters long.' });
    }

    if (trimmedDesc.length < 20 || trimmedDesc.length > 1000) {
      return res.status(400).json({ success: false, error: 'Description must be between 20 and 1000 characters long.' });
    }

    // Reject all-caps or all-number descriptions
    if (/^[A-Z\s\W\d]+$/.test(trimmedDesc) && !/[a-z]/.test(trimmedDesc)) {
      return res.status(400).json({ success: false, error: 'Description cannot be written in ALL CAPS.' });
    }
    if (/^\d+$/.test(trimmedDesc.replace(/\s+/g, ''))) {
      return res.status(400).json({ success: false, error: 'Description cannot consist entirely of numbers.' });
    }

    const validCategories = ['roads', 'water', 'electricity', 'sanitation', 'illegal_construction', 'drainage', 'other'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ success: false, error: 'Invalid category specified.' });
    }

    // Auto-assign to authority of matching ward
    const authority = await User.findOne({ role: 'authority', ward: ward.trim() });

    const photoPath = req.file ? `/uploads/${req.file.filename}` : null;

    const issue = new Issue({
      title: trimmedTitle,
      description: trimmedDesc,
      category,
      ward: ward.trim(),
      location: {
        address: address.trim(),
        lat: lat ? parseFloat(lat) : undefined,
        lng: lng ? parseFloat(lng) : undefined
      },
      photo: photoPath,
      reportedBy: req.session.user.id,
      assignedTo: authority ? authority._id : null,
      status: 'pending',
      escalationLevel: 0,
      upvotes: [],
      upvoteCount: 0,
      comments: [],
      statusHistory: [{
        status: 'pending',
        changedBy: req.session.user.id,
        changedAt: new Date(),
        note: 'Issue reported'
      }],
      createdAt: new Date()
    });

    await issue.save();

    // After saving, increment AuthorityStats.totalAssigned for that authority
    if (authority) {
      await recalculateScore(authority._id);
    }

    return res.status(201).json({ success: true, issue });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Server error while creating issue.' });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const validStatuses = ['pending', 'acknowledged', 'in_progress', 'resolved', 'escalated'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Valid status is required.' });
    }

    const issue = await Issue.findById(id);
    if (!issue) {
      return res.status(404).json({ success: false, error: 'Issue not found.' });
    }

    // Validate that the authority's ward matches the issue's ward
    if (req.session.user.ward !== issue.ward) {
      return res.status(403).json({ success: false, error: 'You are only authorized to manage issues in your assigned ward (' + req.session.user.ward + ').' });
    }

    issue.status = status;
    issue.statusHistory.push({
      status,
      changedBy: req.session.user.id,
      changedAt: new Date(),
      note: note ? note.trim() : `Status updated to ${status}`
    });

    // If status is 'acknowledged' and acknowledgedAt is null → set acknowledgedAt
    if (status === 'acknowledged' && !issue.acknowledgedAt) {
      issue.acknowledgedAt = new Date();
    }

    // Also acknowledge if status is in_progress or resolved directly and acknowledgedAt was null
    if ((status === 'in_progress' || status === 'resolved') && !issue.acknowledgedAt) {
      issue.acknowledgedAt = new Date();
    }

    // If status is 'resolved' → set resolvedAt
    if (status === 'resolved') {
      issue.resolvedAt = new Date();
    }

    // If assignedTo is not set, set it to the current authority
    if (!issue.assignedTo) {
      issue.assignedTo = req.session.user.id;
    }

    await issue.save();

    // Call recalculateScore(req.session.user.id) after every update
    await recalculateScore(req.session.user.id);

    return res.json({ success: true, issue });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Server error while updating status.' });
  }
};

const toggleUpvote = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.user.id;

    const issue = await Issue.findById(id);
    if (!issue) {
      return res.status(404).json({ success: false, error: 'Issue not found.' });
    }

    const upvotedIndex = issue.upvotes.findIndex(u => u.toString() === userId.toString());
    let upvoted = false;

    if (upvotedIndex > -1) {
      // Already upvoted, remove upvote
      issue.upvotes.splice(upvotedIndex, 1);
      issue.upvoteCount = Math.max(0, issue.upvoteCount - 1);
      upvoted = false;
    } else {
      // Add upvote
      issue.upvotes.push(userId);
      issue.upvoteCount = issue.upvoteCount + 1;
      upvoted = true;
    }

    await issue.save();

    return res.json({
      success: true,
      upvoted,
      upvoteCount: issue.upvoteCount
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Server error while toggling upvote.' });
  }
};

const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ success: false, error: 'Comment text cannot be empty.' });
    }

    const issue = await Issue.findById(id);
    if (!issue) {
      return res.status(404).json({ success: false, error: 'Issue not found.' });
    }

    const newComment = {
      user: req.session.user.id,
      userName: req.session.user.name,
      text: text.trim(),
      timestamp: new Date()
    };

    issue.comments.push(newComment);
    await issue.save();

    return res.json({ success: true, comments: issue.comments });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Server error while adding comment.' });
  }
};

const deleteIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const issue = await Issue.findById(id);

    if (!issue) {
      return res.status(404).json({ success: false, error: 'Issue not found.' });
    }

    const isAdmin = req.session.user.role === 'admin';
    const isOwner = req.session.user.role === 'citizen' && issue.reportedBy.toString() === req.session.user.id;
    const isPending = issue.status === 'pending';

    if (!isAdmin && !(isOwner && isPending)) {
      return res.status(403).json({
        success: false,
        error: 'Only administrators or the reporting citizen (if issue is pending) can delete this issue.'
      });
    }

    const assignedAuthorityId = issue.assignedTo;
    await Issue.findByIdAndDelete(id);

    if (assignedAuthorityId) {
      await recalculateScore(assignedAuthorityId);
    }

    return res.json({ success: true, message: 'Issue deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Server error while deleting issue.' });
  }
};

module.exports = {
  getIssues,
  getIssueById,
  createIssue,
  updateStatus,
  toggleUpvote,
  addComment,
  deleteIssue
};
