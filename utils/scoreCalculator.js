const Issue = require('../models/Issue');
const AuthorityStats = require('../models/AuthorityStats');
const User = require('../models/User');

async function recalculateScore(authorityId) {
  if (!authorityId) return 0;

  const issues = await Issue.find({ assignedTo: authorityId });
  const user = await User.findById(authorityId);

  if (issues.length === 0) {
    await AuthorityStats.findOneAndUpdate(
      { authorityId },
      {
        authorityName: user ? user.name : 'Unknown Authority',
        ward: user ? user.ward : '',
        department: user ? user.department : '',
        totalAssigned: 0,
        totalResolved: 0,
        totalEscalated: 0,
        avgResolutionHours: 0,
        quickResponseCount: 0,
        accountabilityScore: 0,
        scoreBreakdown: {
          resolutionRate: 0,
          speedScore: 0,
          responseRate: 0,
          escalationPenalty: 0
        },
        lastUpdated: new Date()
      },
      { upsert: true, returnDocument: 'after' }
    );
    return 0;
  }

  const total = issues.length;
  const resolved = issues.filter(i => i.status === 'resolved').length;
  const escalated = issues.filter(i => i.escalationLevel > 0).length;

  const quickResponse = issues.filter(i => {
    if (!i.acknowledgedAt) return false;
    const hours = (new Date(i.acknowledgedAt) - new Date(i.createdAt)) / (1000 * 60 * 60);
    return hours <= 24;
  }).length;

  const resolvedIssues = issues.filter(
    i => i.status === 'resolved' && i.resolvedAt
  );

  const avgHours = resolvedIssues.length > 0
    ? resolvedIssues.reduce((sum, i) => {
        return sum + (new Date(i.resolvedAt) - new Date(i.createdAt)) / (1000 * 60 * 60);
      }, 0) / resolvedIssues.length
    : 168; // default 7 days if nothing resolved

  const resolutionRate   = (resolved / total) * 100;
  const speedScore       = Math.max(0, 100 - (avgHours / 24) * 10);
  const responseRate     = (quickResponse / total) * 100;
  const escalationPenalty = (escalated / total) * 100;

  const score = (resolutionRate    * 0.40)
              + (speedScore        * 0.30)
              + (responseRate      * 0.20)
              - (escalationPenalty * 0.10);

  const finalScore = Math.min(100, Math.max(0, Math.round(score)));

  await AuthorityStats.findOneAndUpdate(
    { authorityId },
    {
      authorityName: user ? user.name : undefined,
      ward: user ? user.ward : undefined,
      department: user ? user.department : undefined,
      totalAssigned: total,
      totalResolved: resolved,
      totalEscalated: escalated,
      avgResolutionHours: Math.round(avgHours),
      quickResponseCount: quickResponse,
      accountabilityScore: finalScore,
      scoreBreakdown: {
        resolutionRate: Math.round(resolutionRate),
        speedScore: Math.round(speedScore),
        responseRate: Math.round(responseRate),
        escalationPenalty: Math.round(escalationPenalty)
      },
      lastUpdated: new Date()
    },
    { upsert: true, returnDocument: 'after' }
  );

  return finalScore;
}

module.exports = {
  recalculateScore
};
