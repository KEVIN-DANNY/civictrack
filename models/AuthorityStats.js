const mongoose = require('mongoose');

const authorityStatsSchema = new mongoose.Schema({
  authorityId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    unique: true, 
    required: true 
  },
  authorityName: String,
  ward: String,
  department: String,
  totalAssigned: { type: Number, default: 0 },
  totalResolved: { type: Number, default: 0 },
  totalEscalated: { type: Number, default: 0 },
  avgResolutionHours: { type: Number, default: 0 },
  quickResponseCount: { type: Number, default: 0 }, // acknowledged within 24hrs
  accountabilityScore: { type: Number, default: 0 }, // 0 to 100
  scoreBreakdown: {
    resolutionRate: { type: Number, default: 0 },
    speedScore: { type: Number, default: 0 },
    responseRate: { type: Number, default: 0 },
    escalationPenalty: { type: Number, default: 0 }
  },
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuthorityStats', authorityStatsSchema);
