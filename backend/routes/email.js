const express = require('express');
const router = express.Router();
const cron = require('node-cron');
const Node = require('../models/Node');
const Route = require('../models/Route');
const User = require('../models/User');
const { optionalAuth, protect } = require('../middleware/auth');
const { calculateAllMetrics } = require('../utils/networkAnalysis');
const { generatePDFReport, generateExcelReport, deleteReport } = require('../utils/reportGenerator');
const { sendReportEmail, verifyEmailConfig } = require('../utils/emailService');

// Store active cron jobs
const cronJobs = new Map();

// Store alert monitoring jobs
const alertMonitorJobs = new Map();

// @route   POST /api/email/send-report
// @desc    Send report via email
// @access  Public
router.post('/send-report', optionalAuth, async (req, res) => {
  try {
    const { email, includeExcel = true, includePDF = true } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Please provide an email address' });
    }

    const filter = req.user ? { user: req.user._id } : { user: null };
    
    const nodes = await Node.find(filter);
    const routes = await Route.find(filter);

    if (nodes.length === 0) {
      return res.status(400).json({ message: 'No nodes found. Please upload data first.' });
    }

    // Calculate metrics
    const metrics = calculateAllMetrics(nodes, routes);

    // Calculate health score
    const activeNodes = nodes.filter(n => n.status === 'active').length;
    const activeRoutes = routes.filter(r => r.status === 'active').length;
    const highRiskRoutes = routes.filter(r => r.riskLevel === 'high' || r.riskLevel === 'critical').length;

    const healthScore = Math.max(0, Math.min(100, 
      (activeNodes / nodes.length) * 40 +
      (activeRoutes / (routes.length || 1)) * 30 +
      (1 - (metrics.bottlenecks.length / (nodes.length || 1))) * 20 +
      (1 - (highRiskRoutes / (routes.length || 1))) * 10
    ));

    let healthStatus = 'Excellent';
    if (healthScore < 80) healthStatus = 'Good';
    if (healthScore < 60) healthStatus = 'Fair';
    if (healthScore < 40) healthStatus = 'Poor';
    if (healthScore < 20) healthStatus = 'Critical';

    const recommendations = generateRecommendations(healthScore, metrics, nodes, routes);

    const reportData = {
      networkStats: metrics.networkStats,
      nodeMetrics: metrics.nodeMetrics,
      criticalNodes: metrics.criticalNodes,
      bottlenecks: metrics.bottlenecks,
      healthScore: Math.round(healthScore),
      healthStatus,
      recommendations
    };

    // Generate reports
    const attachmentPaths = [];
    const timestamp = Date.now();

    if (includePDF) {
      const pdfFilename = `supply-chain-report-${timestamp}.pdf`;
      const pdfPath = await generatePDFReport(reportData, pdfFilename);
      attachmentPaths.push(pdfPath);
    }

    if (includeExcel) {
      const excelFilename = `supply-chain-report-${timestamp}.xlsx`;
      const excelPath = await generateExcelReport(reportData, excelFilename);
      attachmentPaths.push(excelPath);
    }

    // Send email
    const emailResult = await sendReportEmail(email, reportData, attachmentPaths);

    // Clean up generated files after sending
    setTimeout(() => {
      attachmentPaths.forEach(filePath => deleteReport(filePath));
    }, 5000); // Delete after 5 seconds

    res.json({
      message: 'Report sent successfully',
      email,
      messageId: emailResult.messageId,
      attachments: attachmentPaths.map(p => p.split('/').pop())
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      message: 'Error sending report', 
      error: error.message,
      hint: 'Make sure EMAIL_HOST, EMAIL_USER, and EMAIL_PASSWORD are configured in .env'
    });
  }
});

// @route   POST /api/email/schedule
// @desc    Schedule automated email reports
// @access  Private
router.post('/schedule', protect, async (req, res) => {
  try {
    const { frequency, email, includeExcel = true, includePDF = true } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Please provide an email address' });
    }

    if (!['daily', 'weekly', 'monthly'].includes(frequency)) {
      return res.status(400).json({ 
        message: 'Invalid frequency. Choose: daily, weekly, or monthly' 
      });
    }

    // Define cron schedules
    const cronSchedules = {
      daily: '0 9 * * *',      // Every day at 9 AM
      weekly: '0 9 * * 1',     // Every Monday at 9 AM
      monthly: '0 9 1 * *'     // 1st of every month at 9 AM
    };

    const cronExpression = cronSchedules[frequency];
    const jobId = `${req.user._id}-${frequency}`;

    // Cancel existing job if any
    if (cronJobs.has(jobId)) {
      cronJobs.get(jobId).stop();
      cronJobs.delete(jobId);
    }

    // Create new cron job
    const job = cron.schedule(cronExpression, async () => {
      try {
        console.log(`Running scheduled ${frequency} report for ${email}`);
        
        const nodes = await Node.find({ user: req.user._id });
        const routes = await Route.find({ user: req.user._id });

        if (nodes.length === 0) {
          console.log('No nodes found, skipping scheduled report');
          return;
        }

        const metrics = calculateAllMetrics(nodes, routes);
        const activeNodes = nodes.filter(n => n.status === 'active').length;
        const activeRoutes = routes.filter(r => r.status === 'active').length;
        const highRiskRoutes = routes.filter(r => r.riskLevel === 'high' || r.riskLevel === 'critical').length;

        const healthScore = Math.max(0, Math.min(100, 
          (activeNodes / nodes.length) * 40 +
          (activeRoutes / (routes.length || 1)) * 30 +
          (1 - (metrics.bottlenecks.length / (nodes.length || 1))) * 20 +
          (1 - (highRiskRoutes / (routes.length || 1))) * 10
        ));

        let healthStatus = 'Excellent';
        if (healthScore < 80) healthStatus = 'Good';
        if (healthScore < 60) healthStatus = 'Fair';
        if (healthScore < 40) healthStatus = 'Poor';
        if (healthScore < 20) healthStatus = 'Critical';

        const recommendations = generateRecommendations(healthScore, metrics, nodes, routes);

        const reportData = {
          networkStats: metrics.networkStats,
          nodeMetrics: metrics.nodeMetrics,
          criticalNodes: metrics.criticalNodes,
          bottlenecks: metrics.bottlenecks,
          healthScore: Math.round(healthScore),
          healthStatus,
          recommendations
        };

        const attachmentPaths = [];
        const timestamp = Date.now();

        if (includePDF) {
          const pdfFilename = `scheduled-report-${timestamp}.pdf`;
          const pdfPath = await generatePDFReport(reportData, pdfFilename);
          attachmentPaths.push(pdfPath);
        }

        if (includeExcel) {
          const excelFilename = `scheduled-report-${timestamp}.xlsx`;
          const excelPath = await generateExcelReport(reportData, excelFilename);
          attachmentPaths.push(excelPath);
        }

        await sendReportEmail(email, reportData, attachmentPaths);

        // Clean up
        setTimeout(() => {
          attachmentPaths.forEach(filePath => deleteReport(filePath));
        }, 5000);

        console.log(`Scheduled ${frequency} report sent successfully to ${email}`);
      } catch (error) {
        console.error('Error in scheduled report:', error);
      }
    });

    cronJobs.set(jobId, job);

    // Update user preferences
    await User.findByIdAndUpdate(req.user._id, {
      'emailNotifications.enabled': true,
      'emailNotifications.frequency': frequency
    });

    res.json({
      message: `${frequency.charAt(0).toUpperCase() + frequency.slice(1)} email reports scheduled successfully`,
      frequency,
      email,
      schedule: cronExpression,
      nextRun: getNextRunTime(cronExpression)
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error scheduling email reports', error: error.message });
  }
});

// @route   DELETE /api/email/schedule
// @desc    Cancel scheduled email reports
// @access  Private
router.delete('/schedule', protect, async (req, res) => {
  try {
    const { frequency } = req.body;

    if (!frequency) {
      return res.status(400).json({ message: 'Please specify frequency to cancel' });
    }

    const jobId = `${req.user._id}-${frequency}`;

    if (cronJobs.has(jobId)) {
      cronJobs.get(jobId).stop();
      cronJobs.delete(jobId);

      // Update user preferences
      await User.findByIdAndUpdate(req.user._id, {
        'emailNotifications.enabled': false
      });

      res.json({ message: `${frequency} email schedule cancelled successfully` });
    } else {
      res.status(404).json({ message: 'No active schedule found for this frequency' });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error cancelling schedule', error: error.message });
  }
});

// Helper function to get node name by nodeId
const getNodeName = (nodeId, nodes) => {
  const node = nodes.find(n => n.nodeId === nodeId);
  return node ? node.name : nodeId;
};

// Helper function to format route with names
const formatRoute = (route, nodes) => {
  const sourceName = getNodeName(route.source, nodes);
  const targetName = getNodeName(route.target, nodes);
  return `${sourceName} → ${targetName}`;
};

// @route   POST /api/email/send-alert
// @desc    Send risk alert to registered user
// @access  Private
router.post('/send-alert', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user || !user.email) {
      return res.status(400).json({ message: 'User email not found' });
    }

    const nodes = await Node.find({ user: req.user._id });
    const routes = await Route.find({ user: req.user._id });

    if (nodes.length === 0) {
      return res.status(400).json({ message: 'No nodes found. Please upload data first.' });
    }

    // Calculate metrics
    const metrics = calculateAllMetrics(nodes, routes);
    const highRiskRoutes = routes.filter(r => r.riskLevel === 'high' || r.riskLevel === 'critical');
    const disruptedNodes = nodes.filter(n => n.status === 'disrupted');
    const disruptedRoutes = routes.filter(r => r.status === 'disrupted');

    // Check if there are any alerts to send
    if (highRiskRoutes.length === 0 && disruptedNodes.length === 0 && 
        disruptedRoutes.length === 0 && metrics.bottlenecks.length === 0) {
      return res.json({ 
        message: 'No alerts to send. Network is healthy.',
        alertsSent: false 
      });
    }

    // Build alert email
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const alertHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .alert-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .critical-box { background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .warning-box { background: #fff3cd; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .content { background: white; padding: 30px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          h2 { color: #667eea; margin-top: 0; }
          .metric { display: inline-block; margin: 10px 15px; }
          .metric-value { font-size: 24px; font-weight: bold; color: #dc3545; }
          .metric-label { font-size: 12px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #f8f9fa; font-weight: bold; }
          .btn { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Supply Chain Risk Alert</h1>
            <p>Critical issues detected in your network</p>
          </div>
          
          <div class="content">
            <p>Hello ${user.name},</p>
            <p>We've detected potential risks in your supply chain network that require immediate attention:</p>
            
            ${disruptedNodes.length > 0 ? `
              <div class="critical-box">
                <h3>🚨 Critical: Disrupted Nodes</h3>
                <p><strong>${disruptedNodes.length} node(s)</strong> are currently disrupted:</p>
                <ul>
                  ${disruptedNodes.slice(0, 5).map(n => `<li><strong>${n.name}</strong> (${n.nodeId}) - ${n.type}</li>`).join('')}
                  ${disruptedNodes.length > 5 ? `<li>...and ${disruptedNodes.length - 5} more</li>` : ''}
                </ul>
                <p><strong>Action Required:</strong> Immediate intervention needed to restore operations or activate backup routes.</p>
              </div>
            ` : ''}
            
            ${disruptedRoutes.length > 0 ? `
              <div class="critical-box">
                <h3>🚨 Critical: Disrupted Routes</h3>
                <p><strong>${disruptedRoutes.length} route(s)</strong> are currently disrupted:</p>
                <ul>
                  ${disruptedRoutes.slice(0, 5).map(r => `<li>${formatRoute(r, nodes)} (${r.transportMode})</li>`).join('')}
                  ${disruptedRoutes.length > 5 ? `<li>...and ${disruptedRoutes.length - 5} more</li>` : ''}
                </ul>
                <p><strong>Action Required:</strong> Find alternative routes or restore disrupted connections.</p>
              </div>
            ` : ''}
            
            ${highRiskRoutes.length > 0 ? `
              <div class="warning-box">
                <h3>⚠️ Warning: High-Risk Routes</h3>
                <p><strong>${highRiskRoutes.length} route(s)</strong> with high or critical risk levels:</p>
                <table>
                  <tr>
                    <th>Route</th>
                    <th>Risk Level</th>
                    <th>Status</th>
                  </tr>
                  ${highRiskRoutes.slice(0, 5).map(r => `
                    <tr>
                      <td>${formatRoute(r, nodes)}</td>
                      <td style="color: ${r.riskLevel === 'critical' ? '#dc3545' : '#ff9800'}; font-weight: bold;">${r.riskLevel.toUpperCase()}</td>
                      <td>${r.status}</td>
                    </tr>
                  `).join('')}
                  ${highRiskRoutes.length > 5 ? `<tr><td colspan="3">...and ${highRiskRoutes.length - 5} more</td></tr>` : ''}
                </table>
                <p><strong>Recommended Action:</strong> Establish alternative routes and contingency plans for these high-risk connections.</p>
              </div>
            ` : ''}
            
            ${metrics.bottlenecks.length > 0 ? `
              <div class="alert-box">
                <h3>🚧 Bottleneck Nodes Detected</h3>
                <p><strong>${metrics.bottlenecks.length} bottleneck node(s)</strong> identified that could disrupt supply chain flow:</p>
                <ul>
                  ${metrics.bottlenecks.slice(0, 5).map(b => `<li><strong>${getNodeName(b.nodeId, nodes)}</strong> (${b.nodeId}) - Score: ${(b.normalizedScore * 100).toFixed(1)}</li>`).join('')}
                  ${metrics.bottlenecks.length > 5 ? `<li>...and ${metrics.bottlenecks.length - 5} more</li>` : ''}
                </ul>
                <p><strong>Recommended Action:</strong> Consider adding redundant routes or increasing capacity at these nodes.</p>
              </div>
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}" class="btn">View Full Dashboard</a>
            </div>
            
            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666;">
              This is an automated alert from your Supply Chain Network Analysis system. 
              Please review your dashboard for detailed information and take appropriate action.
            </p>
          </div>
          
          <div class="footer">
            <p>Supply Chain Network Analysis Platform</p>
            <p>This email was sent to ${user.email}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Supply Chain Alerts" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `⚠️ Supply Chain Risk Alert - Action Required`,
      html: alertHtml,
    });

    res.json({
      message: 'Risk alert sent successfully',
      email: user.email,
      alertsSent: true,
      summary: {
        disruptedNodes: disruptedNodes.length,
        disruptedRoutes: disruptedRoutes.length,
        highRiskRoutes: highRiskRoutes.length,
        bottlenecks: metrics.bottlenecks.length
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      message: 'Error sending alert', 
      error: error.message 
    });
  }
});

// @route   GET /api/email/verify
// @desc    Verify email configuration
// @access  Public
router.get('/verify', async (req, res) => {
  try {
    const isValid = await verifyEmailConfig();
    
    if (isValid) {
      res.json({ 
        message: 'Email configuration is valid',
        status: 'ready',
        host: process.env.EMAIL_HOST,
        user: process.env.EMAIL_USER
      });
    } else {
      res.status(500).json({ 
        message: 'Email configuration is invalid',
        status: 'error',
        hint: 'Check EMAIL_HOST, EMAIL_PORT, EMAIL_USER, and EMAIL_PASSWORD in .env'
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      message: 'Error verifying email configuration', 
      error: error.message 
    });
  }
});

// Helper function to get next run time
const getNextRunTime = (cronExpression) => {
  // Simple estimation - in production, use a library like cron-parser
  const now = new Date();
  const parts = cronExpression.split(' ');
  
  if (parts[4] === '*') { // Daily
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(parseInt(parts[1]), parseInt(parts[0]), 0, 0);
    return tomorrow.toISOString();
  } else if (parts[4] === '1') { // Weekly (Monday)
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7 || 7));
    nextMonday.setHours(parseInt(parts[1]), parseInt(parts[0]), 0, 0);
    return nextMonday.toISOString();
  } else { // Monthly
    const nextMonth = new Date(now);
    nextMonth.setMonth(now.getMonth() + 1);
    nextMonth.setDate(1);
    nextMonth.setHours(parseInt(parts[1]), parseInt(parts[0]), 0, 0);
    return nextMonth.toISOString();
  }
};

// Helper function to generate recommendations
const generateRecommendations = (healthScore, metrics, nodes, routes) => {
  const recommendations = [];

  if (metrics.bottlenecks.length > 0) {
    recommendations.push({
      priority: 'high',
      issue: 'Bottleneck nodes detected',
      description: `${metrics.bottlenecks.length} bottleneck node(s) identified that could disrupt supply chain flow`,
      action: 'Consider adding redundant routes or increasing capacity at these nodes'
    });
  }

  if (metrics.criticalNodes.length > 0) {
    recommendations.push({
      priority: 'high',
      issue: 'Critical nodes identified',
      description: `${metrics.criticalNodes.length} critical node(s) with high connectivity`,
      action: 'Implement backup plans and monitoring for these critical nodes'
    });
  }

  const highRiskRoutes = routes.filter(r => r.riskLevel === 'high' || r.riskLevel === 'critical');
  if (highRiskRoutes.length > 0) {
    recommendations.push({
      priority: 'medium',
      issue: 'High-risk routes detected',
      description: `${highRiskRoutes.length} route(s) with high risk levels`,
      action: 'Establish alternative routes and contingency plans'
    });
  }

  const disruptedNodes = nodes.filter(n => n.status === 'disrupted');
  if (disruptedNodes.length > 0) {
    recommendations.push({
      priority: 'critical',
      issue: 'Disrupted nodes',
      description: `${disruptedNodes.length} node(s) currently disrupted`,
      action: 'Immediate action required to restore operations or activate backup routes'
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      priority: 'info',
      issue: 'Network healthy',
      description: 'No major issues detected in the supply chain network',
      action: 'Continue monitoring and maintain current operations'
    });
  }

  return recommendations;
};

// Helper function to send alert email
const sendAlertEmail = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.email) return;

    const nodes = await Node.find({ user: userId });
    const routes = await Route.find({ user: userId });

    if (nodes.length === 0) return;

    const metrics = calculateAllMetrics(nodes, routes);
    const highRiskRoutes = routes.filter(r => r.riskLevel === 'high' || r.riskLevel === 'critical');
    const disruptedNodes = nodes.filter(n => n.status === 'disrupted');
    const disruptedRoutes = routes.filter(r => r.status === 'disrupted');

    // Only send if there are actual alerts
    if (highRiskRoutes.length === 0 && disruptedNodes.length === 0 && 
        disruptedRoutes.length === 0 && metrics.bottlenecks.length === 0) {
      return;
    }

    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const alertHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .alert-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .critical-box { background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .warning-box { background: #fff3cd; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .content { background: white; padding: 30px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          h2 { color: #667eea; margin-top: 0; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #f8f9fa; font-weight: bold; }
          .btn { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Automated Supply Chain Risk Alert</h1>
            <p>Critical issues detected in your network</p>
          </div>
          
          <div class="content">
            <p>Hello ${user.name},</p>
            <p>Our automated monitoring system has detected potential risks in your supply chain network:</p>
            
            ${disruptedNodes.length > 0 ? `
              <div class="critical-box">
                <h3>🚨 Critical: Disrupted Nodes</h3>
                <p><strong>${disruptedNodes.length} node(s)</strong> are currently disrupted:</p>
                <ul>
                  ${disruptedNodes.slice(0, 5).map(n => `<li><strong>${n.name}</strong> (${n.nodeId}) - ${n.type}</li>`).join('')}
                  ${disruptedNodes.length > 5 ? `<li>...and ${disruptedNodes.length - 5} more</li>` : ''}
                </ul>
                <p><strong>Action Required:</strong> Immediate intervention needed to restore operations.</p>
              </div>
            ` : ''}
            
            ${disruptedRoutes.length > 0 ? `
              <div class="critical-box">
                <h3>🚨 Critical: Disrupted Routes</h3>
                <p><strong>${disruptedRoutes.length} route(s)</strong> are currently disrupted:</p>
                <ul>
                  ${disruptedRoutes.slice(0, 5).map(r => `<li>${formatRoute(r, nodes)}</li>`).join('')}
                  ${disruptedRoutes.length > 5 ? `<li>...and ${disruptedRoutes.length - 5} more</li>` : ''}
                </ul>
              </div>
            ` : ''}
            
            ${highRiskRoutes.length > 0 ? `
              <div class="warning-box">
                <h3>⚠️ Warning: High-Risk Routes</h3>
                <p><strong>${highRiskRoutes.length} route(s)</strong> with high or critical risk levels</p>
                <table>
                  <tr><th>Route</th><th>Risk Level</th><th>Status</th></tr>
                  ${highRiskRoutes.slice(0, 5).map(r => `
                    <tr>
                      <td>${formatRoute(r, nodes)}</td>
                      <td style="color: ${r.riskLevel === 'critical' ? '#dc3545' : '#ff9800'}; font-weight: bold;">${r.riskLevel.toUpperCase()}</td>
                      <td>${r.status}</td>
                    </tr>
                  `).join('')}
                </table>
                <p><strong>Action:</strong> Establish alternative routes and contingency plans.</p>
              </div>
            ` : ''}
            
            ${metrics.bottlenecks.length > 0 ? `
              <div class="alert-box">
                <h3>🚧 Bottleneck Nodes Detected</h3>
                <p><strong>${metrics.bottlenecks.length} bottleneck(s)</strong> that could disrupt supply chain flow</p>
                <ul>
                  ${metrics.bottlenecks.slice(0, 5).map(b => `<li><strong>${getNodeName(b.nodeId, nodes)}</strong> (${b.nodeId})</li>`).join('')}
                </ul>
              </div>
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}" class="btn">View Full Dashboard</a>
            </div>
            
            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
              This is an automated alert from your Supply Chain Network Analysis system. 
              You are receiving this because automatic monitoring is enabled for your account.
            </p>
          </div>
          
          <div class="footer">
            <p>Supply Chain Network Analysis Platform</p>
            <p>Automated Alert System</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"Supply Chain Alerts" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `⚠️ Automated Risk Alert - ${disruptedNodes.length + disruptedRoutes.length + highRiskRoutes.length} Issues Detected`,
      html: alertHtml,
    });

    console.log(`✅ Automated alert sent to ${user.email}`);
  } catch (error) {
    console.error('Error sending automated alert:', error);
  }
};

// @route   POST /api/email/enable-auto-alerts
// @desc    Enable automatic alert monitoring
// @access  Private
router.post('/enable-auto-alerts', protect, async (req, res) => {
  try {
    const { frequency = 'hourly' } = req.body;

    // Define cron schedules for monitoring
    const cronSchedules = {
      '15min': '*/15 * * * *',    // Every 15 minutes
      '30min': '*/30 * * * *',    // Every 30 minutes
      hourly: '0 * * * *',        // Every hour
      '6hours': '0 */6 * * *',    // Every 6 hours
      daily: '0 9 * * *',         // Daily at 9 AM
    };

    if (!cronSchedules[frequency]) {
      return res.status(400).json({ 
        message: 'Invalid frequency. Choose: 15min, 30min, hourly, 6hours, or daily' 
      });
    }

    const cronExpression = cronSchedules[frequency];
    const jobId = `alert-${req.user._id}`;

    // Cancel existing job if any
    if (alertMonitorJobs.has(jobId)) {
      alertMonitorJobs.get(jobId).stop();
      alertMonitorJobs.delete(jobId);
    }

    // Create new monitoring job
    const job = cron.schedule(cronExpression, async () => {
      console.log(`🔍 Running automated alert check for user ${req.user._id}`);
      await sendAlertEmail(req.user._id);
    });

    alertMonitorJobs.set(jobId, job);

    // Update user preferences
    await User.findByIdAndUpdate(req.user._id, {
      'alertNotifications.enabled': true,
      'alertNotifications.frequency': frequency
    });

    res.json({
      message: `Automatic alert monitoring enabled (${frequency})`,
      frequency,
      schedule: cronExpression,
      description: getFrequencyDescription(frequency)
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error enabling auto-alerts', error: error.message });
  }
});

// @route   DELETE /api/email/disable-auto-alerts
// @desc    Disable automatic alert monitoring
// @access  Private
router.delete('/disable-auto-alerts', protect, async (req, res) => {
  try {
    const jobId = `alert-${req.user._id}`;

    if (alertMonitorJobs.has(jobId)) {
      alertMonitorJobs.get(jobId).stop();
      alertMonitorJobs.delete(jobId);

      // Update user preferences
      await User.findByIdAndUpdate(req.user._id, {
        'alertNotifications.enabled': false
      });

      res.json({ message: 'Automatic alert monitoring disabled' });
    } else {
      res.status(404).json({ message: 'No active monitoring found' });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error disabling auto-alerts', error: error.message });
  }
});

// @route   GET /api/email/alert-status
// @desc    Get automatic alert monitoring status
// @access  Private
router.get('/alert-status', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const jobId = `alert-${req.user._id}`;
    const isActive = alertMonitorJobs.has(jobId);

    res.json({
      enabled: user.alertNotifications?.enabled || false,
      frequency: user.alertNotifications?.frequency || 'hourly',
      isActive,
      description: getFrequencyDescription(user.alertNotifications?.frequency || 'hourly')
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error getting alert status', error: error.message });
  }
});

// Helper function for frequency descriptions
const getFrequencyDescription = (frequency) => {
  const descriptions = {
    '15min': 'Checks every 15 minutes',
    '30min': 'Checks every 30 minutes',
    hourly: 'Checks every hour',
    '6hours': 'Checks every 6 hours',
    daily: 'Checks once daily at 9 AM'
  };
  return descriptions[frequency] || 'Unknown frequency';
};

module.exports = router;
