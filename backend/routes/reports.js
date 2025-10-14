const express = require('express');
const router = express.Router();
const Node = require('../models/Node');
const Route = require('../models/Route');
const { optionalAuth } = require('../middleware/auth');
const { calculateAllMetrics } = require('../utils/networkAnalysis');
const { generatePDFReport, generateExcelReport, deleteReport } = require('../utils/reportGenerator');
const fs = require('fs');
const path = require('path');

// @route   POST /api/reports/generate-pdf
// @desc    Generate PDF report
// @access  Public
router.post('/generate-pdf', optionalAuth, async (req, res) => {
  try {
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

    // Generate PDF
    const filename = `supply-chain-report-${Date.now()}.pdf`;
    const filePath = await generatePDFReport(reportData, filename);

    res.json({
      message: 'PDF report generated successfully',
      filename,
      downloadUrl: `/api/reports/download/${filename}`,
      reportData
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error generating PDF report', error: error.message });
  }
});

// @route   POST /api/reports/generate-excel
// @desc    Generate Excel report
// @access  Public
router.post('/generate-excel', optionalAuth, async (req, res) => {
  try {
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

    // Generate Excel
    const filename = `supply-chain-report-${Date.now()}.xlsx`;
    const filePath = await generateExcelReport(reportData, filename);

    res.json({
      message: 'Excel report generated successfully',
      filename,
      downloadUrl: `/api/reports/download/${filename}`,
      reportData
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error generating Excel report', error: error.message });
  }
});

// @route   GET /api/reports/download/:filename
// @desc    Download generated report
// @access  Public
router.get('/download/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join('backend/reports', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.download(filePath, filename, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
        res.status(500).json({ message: 'Error downloading report' });
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error downloading report', error: error.message });
  }
});

// @route   DELETE /api/reports/:filename
// @desc    Delete a report file
// @access  Public
router.delete('/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join('backend/reports', filename);

    const deleted = deleteReport(filePath);

    if (deleted) {
      res.json({ message: 'Report deleted successfully' });
    } else {
      res.status(404).json({ message: 'Report not found' });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting report', error: error.message });
  }
});

// @route   GET /api/reports/list
// @desc    List all generated reports
// @access  Public
router.get('/list', (req, res) => {
  try {
    const reportsDir = path.join('backend/reports');
    
    if (!fs.existsSync(reportsDir)) {
      return res.json({ reports: [] });
    }

    const files = fs.readdirSync(reportsDir)
      .filter(file => file.endsWith('.pdf') || file.endsWith('.xlsx'))
      .map(file => {
        const filePath = path.join(reportsDir, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          downloadUrl: `/api/reports/download/${file}`
        };
      })
      .sort((a, b) => b.created - a.created);

    res.json({
      count: files.length,
      reports: files
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error listing reports', error: error.message });
  }
});

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

  if (metrics.networkStats.density < 0.1) {
    recommendations.push({
      priority: 'low',
      issue: 'Low network density',
      description: 'Network has relatively few connections between nodes',
      action: 'Consider establishing additional routes to improve resilience'
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

module.exports = router;
