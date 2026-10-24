function escapeXml(unsafe) {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateRtiXml(citizen, issues) {
  const generatedOn = new Date().toISOString();
  const citizenName = escapeXml(citizen.name);
  const citizenWard = escapeXml(citizen.ward);
  const citizenPhone = escapeXml(citizen.phone);
  const total = issues.length;

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<?xml-stylesheet type="text/xsl" href="/rti-template.xsl"?>\n`;
  xml += `<RTIReport>\n`;
  xml += `  <GeneratedOn>${generatedOn}</GeneratedOn>\n`;
  xml += `  <Citizen>\n`;
  xml += `    <Name>${citizenName}</Name>\n`;
  xml += `    <Ward>${citizenWard}</Ward>\n`;
  xml += `    <Phone>${citizenPhone}</Phone>\n`;
  xml += `  </Citizen>\n`;
  xml += `  <Issues total="${total}">\n`;

  for (const issue of issues) {
    const issueId = escapeXml(issue._id);
    const title = escapeXml(issue.title);
    const category = escapeXml(issue.category);
    const description = escapeXml(issue.description);
    const ward = escapeXml(issue.ward);
    const location = escapeXml(issue.location && issue.location.address ? issue.location.address : '');
    const status = escapeXml(issue.status);
    const level = issue.escalationLevel || 0;
    const reportedOn = issue.createdAt ? new Date(issue.createdAt).toISOString() : '';
    const resolvedOn = (issue.status === 'resolved' && issue.resolvedAt)
      ? new Date(issue.resolvedAt).toISOString()
      : 'Pending';
    const upvotes = issue.upvoteCount || 0;

    xml += `    <Issue>\n`;
    xml += `      <IssueId>${issueId}</IssueId>\n`;
    xml += `      <Title>${title}</Title>\n`;
    xml += `      <Category>${category}</Category>\n`;
    xml += `      <Description>${description}</Description>\n`;
    xml += `      <Ward>${ward}</Ward>\n`;
    xml += `      <Location>${location}</Location>\n`;
    xml += `      <Status>${status}</Status>\n`;
    xml += `      <EscalationLevel>${level}</EscalationLevel>\n`;
    xml += `      <ReportedOn>${reportedOn}</ReportedOn>\n`;
    xml += `      <ResolvedOn>${resolvedOn}</ResolvedOn>\n`;
    xml += `      <Upvotes>${upvotes}</Upvotes>\n`;
    xml += `      <StatusHistory>\n`;

    if (issue.statusHistory && issue.statusHistory.length > 0) {
      for (const entry of issue.statusHistory) {
        xml += `        <Entry>\n`;
        xml += `          <Status>${escapeXml(entry.status)}</Status>\n`;
        xml += `          <ChangedAt>${entry.changedAt ? new Date(entry.changedAt).toISOString() : ''}</ChangedAt>\n`;
        xml += `          <Note>${escapeXml(entry.note || '')}</Note>\n`;
        xml += `        </Entry>\n`;
      }
    }

    xml += `      </StatusHistory>\n`;
    xml += `    </Issue>\n`;
  }

  xml += `  </Issues>\n`;
  xml += `</RTIReport>`;

  return xml;
}

module.exports = {
  generateRtiXml
};
