const nodemailer = require('nodemailer');
const fs = require('fs');

/**
 * Create email transporter
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

/**
 * Send email with attachment
 */
const sendEmail = async (to, subject, htmlContent, attachments = []) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Supply Chain Network" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent,
      attachments
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email sent: %s', info.messageId);
    return {
      success: true,
      messageId: info.messageId,
      response: info.response
    };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Send report email
 */
const sendReportEmail = async (to, reportData, attachmentPaths = []) => {
  try {
    const htmlContent = generateReportEmailHTML(reportData);
    
    const attachments = attachmentPaths.map(filePath => ({
      filename: filePath.split('/').pop(),
      path: filePath
    }));

    const result = await sendEmail(to, 'Supply Chain Network Analysis Report', htmlContent, attachments);
    
    return result;
  } catch (error) {
    console.error('Error sending report email:', error);
    throw error;
  }
};

/**
 * Generate HTML content for report email
 */
const generateReportEmailHTML = (data) => {
  const healthColor = data.healthScore >= 80 ? '#5cb85c' : 
                      data.healthScore >= 60 ? '#f0ad4e' : 
                      data.healthScore >= 40 ? '#ff9800' : '#d9534f';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
        }
        .header p {
          margin: 10px 0 0 0;
          opacity: 0.9;
        }
        .health-score {
          background: white;
          border: 2px solid ${healthColor};
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          text-align: center;
        }
        .health-score h2 {
          margin: 0 0 10px 0;
          color: ${healthColor};
          font-size: 48px;
        }
        .health-score p {
          margin: 0;
          font-size: 18px;
          color: #666;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin-bottom: 30px;
        }
        .stat-card {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 6px;
          border-left: 4px solid #428bca;
        }
        .stat-card h3 {
          margin: 0 0 5px 0;
          font-size: 14px;
          color: #666;
          text-transform: uppercase;
        }
        .stat-card p {
          margin: 0;
          font-size: 24px;
          font-weight: bold;
          color: #333;
        }
        .section {
          background: white;
          border: 1px solid #ddd;
          border-radius: 6px;
          padding: 20px;
          margin-bottom: 20px;
        }
        .section h2 {
          margin: 0 0 15px 0;
          color: #333;
          font-size: 20px;
          border-bottom: 2px solid #428bca;
          padding-bottom: 10px;
        }
        .alert {
          padding: 12px 15px;
          border-radius: 4px;
          margin-bottom: 10px;
        }
        .alert-critical { background: #f8d7da; border-left: 4px solid #d9534f; }
        .alert-high { background: #fff3cd; border-left: 4px solid #f0ad4e; }
        .alert-medium { background: #d1ecf1; border-left: 4px solid #5bc0de; }
        .alert-low { background: #d4edda; border-left: 4px solid #5cb85c; }
        .alert h4 {
          margin: 0 0 5px 0;
          font-size: 14px;
        }
        .alert p {
          margin: 0;
          font-size: 13px;
          color: #666;
        }
        .footer {
          text-align: center;
          padding: 20px;
          color: #666;
          font-size: 12px;
          border-top: 1px solid #ddd;
          margin-top: 30px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        th, td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        th {
          background: #f8f9fa;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🌐 Supply Chain Network Analysis</h1>
        <p>Generated on ${new Date().toLocaleString()}</p>
      </div>

      ${data.healthScore !== undefined ? `
      <div class="health-score">
        <h2>${data.healthScore}/100</h2>
        <p>Network Health Status: <strong>${data.healthStatus || 'N/A'}</strong></p>
      </div>
      ` : ''}

      ${data.networkStats ? `
      <div class="stats-grid">
        <div class="stat-card">
          <h3>Total Nodes</h3>
          <p>${data.networkStats.totalNodes || 0}</p>
        </div>
        <div class="stat-card">
          <h3>Total Routes</h3>
          <p>${data.networkStats.totalEdges || 0}</p>
        </div>
        <div class="stat-card">
          <h3>Network Density</h3>
          <p>${(data.networkStats.density || 0).toFixed(4)}</p>
        </div>
        <div class="stat-card">
          <h3>Avg Degree</h3>
          <p>${(data.networkStats.averageDegree || 0).toFixed(2)}</p>
        </div>
      </div>
      ` : ''}

      ${data.criticalNodes && data.criticalNodes.length > 0 ? `
      <div class="section">
        <h2>⚠️ Critical Nodes (${data.criticalNodes.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Node ID</th>
              <th>Criticality Score</th>
              <th>Degree</th>
              <th>Betweenness</th>
            </tr>
          </thead>
          <tbody>
            ${data.criticalNodes.slice(0, 5).map(node => `
              <tr>
                <td><strong>${node.nodeId}</strong></td>
                <td>${node.criticalityScore.toFixed(4)}</td>
                <td>${node.degreeScore}</td>
                <td>${node.betweennessScore.toFixed(4)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${data.criticalNodes.length > 5 ? `<p style="margin-top: 10px; color: #666; font-size: 13px;">... and ${data.criticalNodes.length - 5} more. See attached report for details.</p>` : ''}
      </div>
      ` : ''}

      ${data.bottlenecks && data.bottlenecks.length > 0 ? `
      <div class="section">
        <h2>🚧 Bottleneck Nodes (${data.bottlenecks.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Node ID</th>
              <th>Betweenness</th>
              <th>Total Degree</th>
            </tr>
          </thead>
          <tbody>
            ${data.bottlenecks.slice(0, 5).map(node => `
              <tr>
                <td><strong>${node.nodeId}</strong></td>
                <td>${node.betweennessScore.toFixed(4)}</td>
                <td>${node.totalDegree}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${data.bottlenecks.length > 5 ? `<p style="margin-top: 10px; color: #666; font-size: 13px;">... and ${data.bottlenecks.length - 5} more. See attached report for details.</p>` : ''}
      </div>
      ` : ''}

      ${data.recommendations && data.recommendations.length > 0 ? `
      <div class="section">
        <h2>💡 Recommendations</h2>
        ${data.recommendations.map(rec => {
          const alertClass = rec.priority === 'critical' ? 'alert-critical' :
                            rec.priority === 'high' ? 'alert-high' :
                            rec.priority === 'medium' ? 'alert-medium' : 'alert-low';
          return `
            <div class="alert ${alertClass}">
              <h4>${rec.priority.toUpperCase()}: ${rec.issue}</h4>
              <p>${rec.description}</p>
              <p><strong>Action:</strong> ${rec.action}</p>
            </div>
          `;
        }).join('')}
      </div>
      ` : ''}

      <div class="footer">
        <p>This is an automated report from your Supply Chain Network Analysis System.</p>
        <p>For detailed analysis, please refer to the attached PDF/Excel reports.</p>
      </div>
    </body>
    </html>
  `;
};

/**
 * Verify email configuration
 */
const verifyEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email server is ready to send messages');
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error.message);
    return false;
  }
};

module.exports = {
  sendEmail,
  sendReportEmail,
  verifyEmailConfig
};
