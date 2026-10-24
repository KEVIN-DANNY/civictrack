const AuthorityStats = require('../models/AuthorityStats');
const Issue = require('../models/Issue');
const User = require('../models/User');

const getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await AuthorityStats.find()
      .populate('authorityId', 'name department ward email')
      .sort({ accountabilityScore: -1 });

    return res.json({ success: true, leaderboard });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Server error while fetching leaderboard.' });
  }
};

const getAuthorityStats = async (req, res) => {
  try {
    const { id } = req.params;

    const stats = await AuthorityStats.findOne({ authorityId: id })
      .populate('authorityId', 'name department ward email');

    if (!stats) {
      return res.status(404).json({ success: false, error: 'Authority stats not found.' });
    }

    const recentResolved = await Issue.find({
      assignedTo: id,
      status: 'resolved'
    })
      .sort({ resolvedAt: -1 })
      .limit(5);

    return res.json({
      success: true,
      stats,
      recentResolved
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Server error while fetching authority stats.' });
  }
};

const getAuthorityIssues = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.query;

    if (req.session.user.id !== id) {
      return res.status(403).json({ success: false, error: 'Access denied: You can only view issues assigned to your own account.' });
    }

    const filter = { assignedTo: id };
    if (status && status !== 'all') {
      filter.status = status;
    }

    const issues = await Issue.find(filter)
      .populate('reportedBy', 'name phone ward')
      .sort({ createdAt: -1 });

    return res.json({ success: true, issues });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Server error while fetching authority issues.' });
  }
};

module.exports = {
  getLeaderboard,
  getAuthorityStats,
  getAuthorityIssues
};
