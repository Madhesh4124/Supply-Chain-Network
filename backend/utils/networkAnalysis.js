const Graph = require('graphology');
const { degreeCentrality, betweennessCentrality } = require('graphology-metrics/centrality');
const { closenessCentrality } = require('graphology-metrics/centrality/closeness');
const { clustering } = require('graphology-metrics/graph');

/**
 * Build a graph from nodes and routes
 */
const buildGraph = (nodes, routes) => {
  const graph = new Graph({ type: 'directed', allowSelfLoops: false });

  // Add nodes
  nodes.forEach(node => {
    graph.addNode(node.nodeId, {
      name: node.name,
      type: node.type,
      latitude: node.latitude,
      longitude: node.longitude,
      capacity: node.capacity,
      region: node.region,
      status: node.status
    });
  });

  // Add edges (routes)
  routes.forEach(route => {
    if (graph.hasNode(route.source) && graph.hasNode(route.target)) {
      try {
        graph.addEdge(route.source, route.target, {
          distance: route.distance,
          cost: route.cost,
          time: route.time,
          status: route.status,
          transportMode: route.transportMode,
          riskLevel: route.riskLevel
        });
      } catch (error) {
        // Edge might already exist, skip
        console.log(`Edge ${route.source} -> ${route.target} already exists`);
      }
    }
  });

  return graph;
};

/**
 * Calculate degree centrality for all nodes
 */
const calculateDegreeCentrality = (graph) => {
  try {
    const centrality = degreeCentrality(graph);
    return centrality;
  } catch (error) {
    console.error('Error calculating degree centrality:', error);
    return {};
  }
};

/**
 * Calculate betweenness centrality for all nodes
 */
const calculateBetweennessCentrality = (graph) => {
  try {
    const centrality = betweennessCentrality(graph);
    return centrality;
  } catch (error) {
    console.error('Error calculating betweenness centrality:', error);
    return {};
  }
};

/**
 * Calculate closeness centrality for all nodes
 */
const calculateClosenessCentrality = (graph) => {
  try {
    const centrality = closenessCentrality(graph);
    return centrality;
  } catch (error) {
    console.error('Error calculating closeness centrality:', error);
    return {};
  }
};

/**
 * Calculate clustering coefficient
 */
const calculateClusteringCoefficient = (graph) => {
  try {
    // Convert to undirected for clustering calculation
    const undirectedGraph = graph.copy();
    undirectedGraph.type = 'undirected';
    
    const clusteringCoeff = clustering(undirectedGraph);
    return clusteringCoeff;
  } catch (error) {
    console.error('Error calculating clustering coefficient:', error);
    return 0;
  }
};

/**
 * Calculate local clustering coefficient for each node
 */
const calculateLocalClustering = (graph) => {
  const localClustering = {};
  
  graph.forEachNode((node) => {
    const neighbors = graph.neighbors(node);
    const k = neighbors.length;
    
    if (k < 2) {
      localClustering[node] = 0;
      return;
    }
    
    let connections = 0;
    for (let i = 0; i < neighbors.length; i++) {
      for (let j = i + 1; j < neighbors.length; j++) {
        if (graph.hasEdge(neighbors[i], neighbors[j]) || 
            graph.hasEdge(neighbors[j], neighbors[i])) {
          connections++;
        }
      }
    }
    
    const maxConnections = (k * (k - 1)) / 2;
    localClustering[node] = maxConnections > 0 ? connections / maxConnections : 0;
  });
  
  return localClustering;
};

/**
 * Identify bottleneck nodes (high betweenness, critical for network flow)
 */
const identifyBottlenecks = (graph, betweennessScores, threshold = 0.05) => {
  const bottlenecks = [];
  const maxBetweenness = Math.max(...Object.values(betweennessScores));
  
  Object.entries(betweennessScores).forEach(([nodeId, score]) => {
    const normalizedScore = maxBetweenness > 0 ? score / maxBetweenness : 0;
    
    if (normalizedScore >= threshold) {
      bottlenecks.push({
        nodeId,
        betweennessScore: score,
        normalizedScore,
        inDegree: graph.inDegree(nodeId),
        outDegree: graph.outDegree(nodeId),
        totalDegree: graph.degree(nodeId)
      });
    }
  });
  
  return bottlenecks.sort((a, b) => b.betweennessScore - a.betweennessScore);
};

/**
 * Identify critical nodes (high degree + high betweenness)
 */
const identifyCriticalNodes = (graph, degreeScores, betweennessScores, threshold = 0.1) => {
  const criticalNodes = [];
  const maxDegree = Math.max(...Object.values(degreeScores));
  const maxBetweenness = Math.max(...Object.values(betweennessScores));
  
  Object.keys(degreeScores).forEach(nodeId => {
    const normalizedDegree = maxDegree > 0 ? degreeScores[nodeId] / maxDegree : 0;
    const normalizedBetweenness = maxBetweenness > 0 ? betweennessScores[nodeId] / maxBetweenness : 0;
    const criticalityScore = (normalizedDegree + normalizedBetweenness) / 2;
    
    if (criticalityScore >= threshold) {
      criticalNodes.push({
        nodeId,
        criticalityScore,
        degreeScore: degreeScores[nodeId],
        betweennessScore: betweennessScores[nodeId],
        inDegree: graph.inDegree(nodeId),
        outDegree: graph.outDegree(nodeId)
      });
    }
  });
  
  return criticalNodes.sort((a, b) => b.criticalityScore - a.criticalityScore);
};

/**
 * Find alternative paths using BFS
 */
const findAlternativePaths = (graph, source, target, maxPaths = 3) => {
  const paths = [];
  
  // Simple BFS to find multiple paths
  const queue = [[source]];
  const visited = new Set();
  
  while (queue.length > 0 && paths.length < maxPaths) {
    const path = queue.shift();
    const current = path[path.length - 1];
    
    if (current === target) {
      paths.push(path);
      continue;
    }
    
    if (path.length > 10) continue; // Prevent infinite loops
    
    const neighbors = graph.outNeighbors(current);
    
    for (const neighbor of neighbors) {
      if (!path.includes(neighbor)) {
        queue.push([...path, neighbor]);
      }
    }
  }
  
  return paths;
};

/**
 * Simulate disruption by removing a node or edge
 */
const simulateDisruption = (graph, nodeId = null, edgeSource = null, edgeTarget = null) => {
  const simulatedGraph = graph.copy();
  
  if (nodeId && simulatedGraph.hasNode(nodeId)) {
    simulatedGraph.dropNode(nodeId);
  } else if (edgeSource && edgeTarget && simulatedGraph.hasEdge(edgeSource, edgeTarget)) {
    simulatedGraph.dropEdge(edgeSource, edgeTarget);
  }
  
  // Recalculate metrics
  const newDegree = calculateDegreeCentrality(simulatedGraph);
  const newBetweenness = calculateBetweennessCentrality(simulatedGraph);
  
  // Identify disconnected components
  const disconnectedNodes = [];
  simulatedGraph.forEachNode((node) => {
    if (simulatedGraph.degree(node) === 0) {
      disconnectedNodes.push(node);
    }
  });
  
  return {
    affectedNodes: disconnectedNodes,
    newMetrics: {
      degree: newDegree,
      betweenness: newBetweenness
    },
    networkSize: simulatedGraph.order,
    networkEdges: simulatedGraph.size
  };
};

/**
 * Calculate all network metrics
 */
const calculateAllMetrics = (nodes, routes) => {
  const graph = buildGraph(nodes, routes);
  
  const degree = calculateDegreeCentrality(graph);
  const betweenness = calculateBetweennessCentrality(graph);
  const closeness = calculateClosenessCentrality(graph);
  const localClustering = calculateLocalClustering(graph);
  const globalClustering = calculateClusteringCoefficient(graph);
  
  const bottlenecks = identifyBottlenecks(graph, betweenness);
  const criticalNodes = identifyCriticalNodes(graph, degree, betweenness);
  
  // Network-level statistics
  const networkStats = {
    totalNodes: graph.order,
    totalEdges: graph.size,
    density: graph.size / (graph.order * (graph.order - 1)),
    averageDegree: graph.order > 0 ? (2 * graph.size) / graph.order : 0,
    globalClusteringCoefficient: globalClustering
  };
  
  // Combine metrics for each node
  const nodeMetrics = {};
  graph.forEachNode((nodeId) => {
    nodeMetrics[nodeId] = {
      degreeCentrality: degree[nodeId] || 0,
      betweennessCentrality: betweenness[nodeId] || 0,
      closenessCentrality: closeness[nodeId] || 0,
      clusteringCoefficient: localClustering[nodeId] || 0,
      inDegree: graph.inDegree(nodeId),
      outDegree: graph.outDegree(nodeId),
      totalDegree: graph.degree(nodeId),
      isBottleneck: bottlenecks.some(b => b.nodeId === nodeId),
      isCritical: criticalNodes.some(c => c.nodeId === nodeId)
    };
  });
  
  return {
    nodeMetrics,
    networkStats,
    bottlenecks,
    criticalNodes,
    graph
  };
};

module.exports = {
  buildGraph,
  calculateDegreeCentrality,
  calculateBetweennessCentrality,
  calculateClosenessCentrality,
  calculateClusteringCoefficient,
  calculateLocalClustering,
  identifyBottlenecks,
  identifyCriticalNodes,
  findAlternativePaths,
  simulateDisruption,
  calculateAllMetrics
};
