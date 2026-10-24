const cron = require('node-cron');
const Issue = require('../models/Issue');
const { recalculateScore } = require('./scoreCalculator');

async function runEscalationCheck() {
  console.log(`[Cron] [${new Date().toISOString()}] Running escalation check for unresolved civic issues...`);
  try {
    // Find all unresolved issues
    const issues = await Issue.find({ status: { $ne: 'resolved' } });
    const now = Date.now();
    let escalatedCount = 0;
    const affectedAuthorities = new Set();

    for (const issue of issues) {
      const createdAt = new Date(issue.createdAt).getTime();
      const hoursAgo = (now - createdAt) / (1000 * 60 * 60);
      let updated = false;

      // Critical breach: past 96 hours and at level 1
      if (hoursAgo >= 96 && issue.escalationLevel === 1) {
        issue.escalationLevel = 2;
        issue.status = 'escalated';
        issue.statusHistory.push({
          status: 'escalated',
          changedAt: new Date(),
          note: 'Auto-escalated: 96hr critical breach'
        });
        updated = true;
        escalatedCount++;
        console.log(`[Escalation] Critical breach (96h+): Issue "${issue.title}" (ID: ${issue._id}) escalated to Level 2`);
      }
      // Standard breach: past 48 hours and at level 0
      else if (hoursAgo >= 48 && issue.escalationLevel === 0 && issue.status !== 'escalated') {
        issue.escalationLevel = 1;
        issue.status = 'escalated';
        issue.statusHistory.push({
          status: 'escalated',
          changedAt: new Date(),
          note: 'Auto-escalated: 48hr breach'
        });
        updated = true;
        escalatedCount++;
        console.log(`[Escalation] Breach (48h+): Issue "${issue.title}" (ID: ${issue._id}) escalated to Level 1`);
      }

      if (updated) {
        await issue.save();
        if (issue.assignedTo) {
          affectedAuthorities.add(issue.assignedTo.toString());
        }
      }
    }

    // Recalculate score for all affected authorities
    for (const authorityId of affectedAuthorities) {
      await recalculateScore(authorityId);
    }

    console.log(`[Cron] Escalation check complete. Total issues escalated this cycle: ${escalatedCount}`);
    return escalatedCount;
  } catch (error) {
    console.error('[Cron Error] Error running escalation check:', error.message);
    return 0;
  }
}

function startEscalationJob() {
  // Cron schedule: every 6 hours ('0 */6 * * *')
  cron.schedule('0 */6 * * *', () => {
    runEscalationCheck();
  });
  console.log('[Cron] Escalation cron job scheduled to run every 6 hours (0 */6 * * *)');
}

module.exports = {
  startEscalationJob,
  runEscalationCheck
};
