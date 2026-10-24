<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" encoding="UTF-8" indent="yes" doctype-public="-//W3C//DTD HTML 4.01 Transitional//EN"/>

  <xsl:template match="/RTIReport">
    <html>
      <head>
        <title>RTI Civic Dossier - <xsl:value-of select="Citizen/Name"/></title>
        <style type="text/css">
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.5;
            color: #2d3436;
            background-color: #f8f9fa;
            margin: 0;
            padding: 24px;
          }
          .dossier-card {
            max-width: 1000px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.08);
            border: 1px solid #e2e8f0;
            padding: 36px;
          }
          .header-banner {
            border-bottom: 3px double #1a6b3c;
            padding-bottom: 20px;
            margin-bottom: 24px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .title-area h1 {
            color: #1a6b3c;
            font-size: 24px;
            margin: 0 0 4px 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .title-area h2 {
            color: #636e72;
            font-size: 14px;
            font-weight: 500;
            margin: 0;
          }
          .meta-info {
            text-align: right;
            font-size: 12px;
            color: #636e72;
          }
          .citizen-section {
            background-color: #f1f8f3;
            border-left: 4px solid #1a6b3c;
            padding: 16px 20px;
            border-radius: 0 6px 6px 0;
            margin-bottom: 28px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
          }
          .info-group label {
            display: block;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #557060;
            font-weight: 700;
            margin-bottom: 2px;
          }
          .info-group span {
            font-size: 15px;
            font-weight: 600;
            color: #1a3c26;
          }
          .table-header {
            font-size: 16px;
            color: #1a6b3c;
            margin: 0 0 12px 0;
            padding-bottom: 6px;
            border-bottom: 1px solid #cbd5e1;
            display: flex;
            justify-content: space-between;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 28px;
            font-size: 13px;
          }
          th {
            background-color: #f8fafc;
            color: #334155;
            font-weight: 600;
            text-align: left;
            padding: 10px 12px;
            border-bottom: 2px solid #cbd5e1;
            border-top: 1px solid #e2e8f0;
          }
          td {
            padding: 12px;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: top;
          }
          tr:nth-child(even) td {
            background-color: #fcfdfe;
          }
          .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
          }
          .badge-pending { background-color: #e2e8f0; color: #475569; }
          .badge-acknowledged { background-color: #dbeafe; color: #1e40af; }
          .badge-in_progress { background-color: #fef3c7; color: #92400e; }
          .badge-resolved { background-color: #dcfce7; color: #166534; }
          .badge-escalated { background-color: #fee2e2; color: #991b1b; }
          
          .category-tag {
            display: inline-block;
            font-size: 11px;
            color: #64748b;
            background: #f1f5f9;
            padding: 2px 6px;
            border-radius: 4px;
            margin-top: 4px;
          }
          .history-box {
            margin-top: 8px;
            padding: 6px 10px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            font-size: 11px;
          }
          .history-title {
            font-weight: 600;
            color: #475569;
            margin-bottom: 4px;
          }
          .declaration {
            margin-top: 36px;
            padding-top: 20px;
            border-top: 1px dashed #cbd5e1;
            font-size: 11px;
            color: #64748b;
            display: flex;
            justify-content: space-between;
          }
          .sig-box {
            text-align: right;
            padding-top: 30px;
            font-weight: 600;
            color: #334155;
          }
          .print-btn-bar {
            text-align: center;
            margin-bottom: 20px;
          }
          .btn-print {
            background-color: #1a6b3c;
            color: #ffffff;
            border: none;
            padding: 10px 24px;
            font-size: 14px;
            font-weight: 600;
            border-radius: 6px;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .btn-print:hover {
            background-color: #14532d;
          }
          @media print {
            body {
              background: #ffffff;
              padding: 0;
            }
            .dossier-card {
              box-shadow: none;
              border: none;
              padding: 0;
              max-width: 100%;
            }
            .print-btn-bar {
              display: none;
            }
            table {
              page-break-inside: auto;
            }
            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-btn-bar">
          <button class="btn-print" onclick="window.print()">Print Official RTI Dossier</button>
        </div>
        <div class="dossier-card">
          <div class="header-banner">
            <div class="title-area">
              <h1>Right to Information (RTI) Report</h1>
              <h2>Civic Grievance &amp; Accountability Disclosure Document</h2>
            </div>
            <div class="meta-info">
              <strong>Generated:</strong> <xsl:value-of select="GeneratedOn"/><br/>
              <strong>Authority Jurisdiction:</strong> Chennai Corporation
            </div>
          </div>

          <div class="citizen-section">
            <div class="info-group">
              <label>Applicant / Citizen</label>
              <span><xsl:value-of select="Citizen/Name"/></span>
            </div>
            <div class="info-group">
              <label>Assigned Ward</label>
              <span><xsl:value-of select="Citizen/Ward"/></span>
            </div>
            <div class="info-group">
              <label>Phone Number</label>
              <span><xsl:value-of select="Citizen/Phone"/></span>
            </div>
            <div class="info-group">
              <label>Total Filings</label>
              <span><xsl:value-of select="Issues/@total"/> Issues</span>
            </div>
          </div>

          <div class="table-header">
            <span>Official Grievance Log</span>
            <span>Total Record Count: <xsl:value-of select="Issues/@total"/></span>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 12%;">Issue ID</th>
                <th style="width: 25%;">Title &amp; Category</th>
                <th style="width: 25%;">Description &amp; Location</th>
                <th style="width: 13%;">Status &amp; Tier</th>
                <th style="width: 15%;">Timeline</th>
                <th style="width: 10%;">Public Support</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="Issues/Issue">
                <tr>
                  <td>
                    <code><xsl:value-of select="substring(IssueId, string-length(IssueId) - 7)"/></code>
                  </td>
                  <td>
                    <strong><xsl:value-of select="Title"/></strong><br/>
                    <span class="category-tag"><xsl:value-of select="Category"/></span>
                  </td>
                  <td>
                    <p style="margin: 0 0 6px 0;"><xsl:value-of select="Description"/></p>
                    <small style="color: #64748b;">📍 <xsl:value-of select="Location"/> (Ward <xsl:value-of select="Ward"/>)</small>
                  </td>
                  <td>
                    <span class="badge badge-{Status}"><xsl:value-of select="Status"/></span>
                    <xsl:if test="EscalationLevel &gt; 0">
                      <div style="margin-top: 4px;">
                        <span class="badge badge-escalated">Escalated Tier <xsl:value-of select="EscalationLevel"/></span>
                      </div>
                    </xsl:if>
                  </td>
                  <td>
                    <small>
                      <strong>Filed:</strong> <xsl:value-of select="substring(ReportedOn, 1, 10)"/><br/>
                      <strong>Resolved:</strong> <xsl:value-of select="substring(ResolvedOn, 1, 10)"/>
                    </small>
                    <xsl:if test="StatusHistory/Entry">
                      <div class="history-box">
                        <div class="history-title">Audit Trail:</div>
                        <xsl:for-each select="StatusHistory/Entry">
                          <div>
                            • <xsl:value-of select="Status"/>: <xsl:value-of select="Note"/>
                          </div>
                        </xsl:for-each>
                      </div>
                    </xsl:if>
                  </td>
                  <td>
                    <strong>▲ <xsl:value-of select="Upvotes"/></strong> Upvotes
                  </td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>

          <div class="declaration">
            <div>
              <p>Generated by CivicTrack Accountability Engine.<br/>
              Valid under Section 4(1)(b) of the Right to Information Act, 2005.</p>
            </div>
            <div class="sig-box">
              Applicant Signature: _______________________
            </div>
          </div>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
