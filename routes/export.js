const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Issue = require('../models/Issue');
const { requireCitizen } = require('../middleware/authMiddleware');
const { generateRtiXml } = require('../utils/xmlGenerator');

router.get('/rti/:userId', requireCitizen, async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.session.user.id !== userId) {
      return res.status(403).json({ success: false, error: 'Access denied: You can only export your own RTI grievance records.' });
    }

    const citizen = await User.findById(userId);
    if (!citizen) {
      return res.status(404).json({ success: false, error: 'Citizen account not found.' });
    }

    const issues = await Issue.find({ reportedBy: userId }).sort({ createdAt: -1 });

    const xmlData = generateRtiXml(citizen, issues);

    res.setHeader('Content-Type', 'application/xml');
    
    // Default attachment disposition as required, allow inline if requested via query
    const dispositionType = req.query.inline === 'true' ? 'inline' : 'attachment';
    res.setHeader('Content-Disposition', `${dispositionType}; filename="RTI_Report_${userId}.xml"`);

    return res.send(xmlData);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Server error generating RTI XML export.' });
  }
});

module.exports = router;
