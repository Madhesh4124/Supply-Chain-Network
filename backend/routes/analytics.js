const express = require('express');
const router = express.Router();
const Node = require('../models/Node');
const Route = require('../models/Route');
const { optionalAuth } = require('../middleware/auth');
const {
  calculateAllMetrics,
  simulateDisruption,
  findAlternativePaths,
  buildGraph
} = require('../utils/networkAnalysis');

// @route   GET /api/analytics/metrics
// @desc    Calculate and return all SNA metrics
// @access  Public
router.get('/metrics', optionalAuth, async (req, res) => {
  try {
    const filter = req.user ? { user: req.user._id } : { user: null };
    
    const nodes = await Node.find(filter);
    const routes = await Route.find(filter);

    if (nodes.length === 0) {
      return res.status(400).json({ message: 'No nodes found. Please upload data first.' });
    }

    // Calculate all metrics
    const metrics = calculateAllMetrics(nodes, routes);

    // Update nodes in database with calculated metrics
    const updatePromises = Object.entries(metrics.nodeMetrics).map(([nodeId, nodeMetric]) => {
      return Node.findOneAndUpdate(
        { nodeId, ...filter },
        {
          'metrics.degreeCentrality': nodeMetric.degreeCentrality,
          'metrics.betweennessCentrality': nodeMetric.betweennessCentrality,
          'metrics.closenessCentrality': nodeMetric.closenessCentrality,
          'metrics.clusteringCoefficient': nodeMetric.clusteringCoefficient,
          'metrics.isBottleneck': nodeMetric.isBottleneck,
          'metrics.isCritical': nodeMetric.isCritical
        }
      );
    });

    await Promise.all(updatePromises);

    res.json({
      message: 'Metrics calculated successfully',
      nodeMetrics: metrics.nodeMetrics,
      networkStats: metrics.networkStats,
      bottlenecks: metrics.bottlenecks,
      criticalNodes: metrics.criticalNodes
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error calculating metrics', error: error.message });
  }
});

// @route   GET /api/analytics/bottlenecks
// @desc    Get bottleneck nodes
// @access  Public
router.get('/bottlenecks', optionalAuth, async (req, res) => {
  try {
    const filter = req.user ? { user: req.user._id } : { user: null };
    
    const nodes = await Node.find(filter);
    const routes = await Route.find(filter);

    if (nodes.length === 0) {
      return res.status(400).json({ message: 'No nodes found' });
    }

    const metrics = calculateAllMetrics(nodes, routes);

    res.json({
      count: metrics.bottlenecks.length,
      bottlenecks: metrics.bottlenecks
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error identifying bottlenecks', error: error.message });
  }
});

// @route   GET /api/analytics/critical-nodes
// @desc    Get critical nodes
// @access  Public
router.get('/critical-nodes', optionalAuth, async (req, res) => {
  try {
    const filter = req.user ? { user: req.user._id } : { user: null };
    
    const nodes = await Node.find(filter);
    const routes = await Route.find(filter);

    if (nodes.length === 0) {
      return res.status(400).json({ message: 'No nodes found' });
    }

    const metrics = calculateAllMetrics(nodes, routes);

    res.json({
      count: metrics.criticalNodes.length,
      criticalNodes: metrics.criticalNodes
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error identifying critical nodes', error: error.message });
  }
});

// @route   POST /api/analytics/simulate-disruption
// @desc    Simulate node or route failure
// @access  Public
router.post('/simulate-disruption', optionalAuth, async (req, res) => {
  try {
    const { nodeId, edgeSource, edgeTarget } = req.body;
    const filter = req.user ? { user: req.user._id } : { user: null };

    if (!nodeId && (!edgeSource || !edgeTarget)) {
      return res.status(400).json({ 
        message: 'Please provide either nodeId or both edgeSource and edgeTarget' 
      });
    }

    const nodes = await Node.find(filter);
    const routes = await Route.find(filter);

    if (nodes.length === 0) {
      return res.status(400).json({ message: 'No nodes found' });
    }

    const metrics = calculateAllMetrics(nodes, routes);
    const graph = metrics.graph;

    // Simulate disruption
    const disruption = simulateDisruption(graph, nodeId, edgeSource, edgeTarget);

    // Find alternative paths if edge disruption
    let alternativePaths = [];
    if (edgeSource && edgeTarget) {
      alternativePaths = findAlternativePaths(graph, edgeSource, edgeTarget, 5);
    }

    res.json({
      message: 'Disruption simulated successfully',
      disruptionType: nodeId ? 'node' : 'edge',
      disruptedElement: nodeId || `${edgeSource} -> ${edgeTarget}`,
      impact: {
        affectedNodes: disruption.affectedNodes,
        networkSizeBefore: graph.order,
        networkSizeAfter: disruption.networkSize,
        edgesBefore: graph.size,
        edgesAfter: disruption.networkEdges,
        nodesDisconnected: disruption.affectedNodes.length
      },
      alternativePaths: alternativePaths.length > 0 ? alternativePaths : 'No alternative paths found',
      recommendation: alternativePaths.length > 0 
        ? `${alternativePaths.length} alternative route(s) available` 
        : 'Critical disruption - no alternative routes available'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error simulating disruption', error: error.message });
  }
});

// @route   POST /api/analytics/find-paths
// @desc    Find alternative paths between two nodes
// @access  Public
router.post('/find-paths', optionalAuth, async (req, res) => {
  try {
    const { source, target, maxPaths = 5 } = req.body;
    const filter = req.user ? { user: req.user._id } : { user: null };

    if (!source || !target) {
      return res.status(400).json({ message: 'Please provide source and target nodes' });
    }

    const nodes = await Node.find(filter);
    const routes = await Route.find(filter);

    if (nodes.length === 0) {
      return res.status(400).json({ message: 'No nodes found' });
    }

    const metrics = calculateAllMetrics(nodes, routes);
    const graph = metrics.graph;

    if (!graph.hasNode(source) || !graph.hasNode(target)) {
      return res.status(404).json({ message: 'Source or target node not found in network' });
    }

    const paths = findAlternativePaths(graph, source, target, maxPaths);

    // Calculate path metrics
    const pathsWithMetrics = paths.map(path => {
      let totalDistance = 0;
      let totalCost = 0;
      let totalTime = 0;

      for (let i = 0; i < path.length - 1; i++) {
        const edgeData = graph.getEdgeAttributes(path[i], path[i + 1]);
        totalDistance += edgeData.distance || 0;
        totalCost += edgeData.cost || 0;
        totalTime += edgeData.time || 0;
      }

      return {
        path,
        hops: path.length - 1,
        totalDistance,
        totalCost,
        totalTime
      };
    });

    // Sort by cost
    pathsWithMetrics.sort((a, b) => a.totalCost - b.totalCost);

    res.json({
      source,
      target,
      pathsFound: pathsWithMetrics.length,
      paths: pathsWithMetrics
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error finding paths', error: error.message });
  }
});

// @route   GET /api/analytics/network-health
// @desc    Get overall network health assessment
// @access  Public
router.get('/network-health', optionalAuth, async (req, res) => {
  try {
    const filter = req.user ? { user: req.user._id } : { user: null };
    
    const nodes = await Node.find(filter);
    const routes = await Route.find(filter);

    if (nodes.length === 0) {
      return res.status(400).json({ message: 'No nodes found' });
    }

    const metrics = calculateAllMetrics(nodes, routes);

    // Calculate health score
    const activeNodes = nodes.filter(n => n.status === 'active').length;
    const activeRoutes = routes.filter(r => r.status === 'active').length;
    const disruptedNodes = nodes.filter(n => n.status === 'disrupted').length;
    const disruptedRoutes = routes.filter(r => r.status === 'disrupted').length;
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

    res.json({
      healthScore: Math.round(healthScore),
      healthStatus,
      summary: {
        totalNodes: nodes.length,
        activeNodes,
        disruptedNodes,
        totalRoutes: routes.length,
        activeRoutes,
        disruptedRoutes,
        highRiskRoutes,
        bottlenecks: metrics.bottlenecks.length,
        criticalNodes: metrics.criticalNodes.length
      },
      networkStats: metrics.networkStats,
      recommendations: generateRecommendations(healthScore, metrics, nodes, routes)
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error assessing network health', error: error.message });
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
