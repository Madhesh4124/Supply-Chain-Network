import React, { useState, useEffect, useRef } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import { 
  Network, ZoomIn, ZoomOut, Maximize2, RefreshCw, 
  Filter, AlertTriangle, Star, Download 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { nodeAPI, routeAPI, analyticsAPI } from '../services/api';

// Register dagre layout
cytoscape.use(dagre);

const GraphView = () => {
  const [elements, setElements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [filters, setFilters] = useState({
    showCritical: false,
    showBottlenecks: false,
    nodeType: 'all',
    routeStatus: 'all'
  });
  const [metrics, setMetrics] = useState(null);
  const cyRef = useRef(null);

  useEffect(() => {
    fetchGraphData();
  }, []);

  useEffect(() => {
    if (cyRef.current && elements.length > 0) {
      applyFilters();
    }
  }, [filters]);

  const fetchGraphData = async () => {
    setLoading(true);
    try {
      const [nodesRes, routesRes, metricsRes] = await Promise.all([
        nodeAPI.getAll(),
        routeAPI.getAll(),
        analyticsAPI.getMetrics().catch(() => ({ data: null }))
      ]);

      const nodes = nodesRes.data.nodes || [];
      const routes = routesRes.data.routes || [];
      setMetrics(metricsRes.data);

      // Build Cytoscape elements
      const cyNodes = nodes.map(node => ({
        data: {
          id: node.nodeId,
          label: node.name,
          type: node.type,
          status: node.status,
          capacity: node.capacity,
          region: node.region,
          isCritical: node.metrics?.isCritical || false,
          isBottleneck: node.metrics?.isBottleneck || false,
          degreeCentrality: node.metrics?.degreeCentrality || 0,
          betweennessCentrality: node.metrics?.betweennessCentrality || 0
        }
      }));

      // Create a Set of valid node IDs for quick lookup
      const validNodeIds = new Set(nodes.map(n => n.nodeId));

      // Filter routes to only include those with valid source and target nodes
      const validRoutes = routes.filter(route => {
        const hasValidSource = validNodeIds.has(route.source);
        const hasValidTarget = validNodeIds.has(route.target);
        
        if (!hasValidSource || !hasValidTarget) {
          console.warn(`Skipping route ${route.source} → ${route.target}: Missing node(s)`);
          return false;
        }
        return true;
      });

      const cyEdges = validRoutes.map((route, index) => ({
        data: {
          id: `edge-${index}`,
          source: route.source,
          target: route.target,
          distance: route.distance,
          cost: route.cost,
          time: route.time,
          status: route.status,
          transportMode: route.transportMode,
          riskLevel: route.riskLevel
        }
      }));

      // Show warning if some routes were skipped
      if (routes.length > validRoutes.length) {
        const skippedCount = routes.length - validRoutes.length;
        toast.error(
          `${skippedCount} route(s) skipped due to missing nodes. Please check your data.`,
          { duration: 5000 }
        );
      }

      setElements([...cyNodes, ...cyEdges]);
      toast.success('Graph loaded successfully');
    } catch (error) {
      console.error('Error fetching graph data:', error);
      toast.error('Failed to load graph data');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    if (!cyRef.current) return;

    const cy = cyRef.current;

    // Reset all elements
    cy.elements().removeClass('filtered');
    cy.elements().style('display', 'element');

    // Apply filters
    if (filters.showCritical) {
      cy.nodes().forEach(node => {
        if (!node.data('isCritical')) {
          node.addClass('filtered');
          node.style('display', 'none');
        }
      });
    }

    if (filters.showBottlenecks) {
      cy.nodes().forEach(node => {
        if (!node.data('isBottleneck')) {
          node.addClass('filtered');
          node.style('display', 'none');
        }
      });
    }

    if (filters.nodeType !== 'all') {
      cy.nodes().forEach(node => {
        if (node.data('type') !== filters.nodeType && !node.hasClass('filtered')) {
          node.addClass('filtered');
          node.style('display', 'none');
        }
      });
    }

    if (filters.routeStatus !== 'all') {
      cy.edges().forEach(edge => {
        if (edge.data('status') !== filters.routeStatus) {
          edge.style('display', 'none');
        }
      });
    }

    // Hide edges connected to hidden nodes
    cy.edges().forEach(edge => {
      const source = cy.getElementById(edge.data('source'));
      const target = cy.getElementById(edge.data('target'));
      if (source.hasClass('filtered') || target.hasClass('filtered')) {
        edge.style('display', 'none');
      }
    });
  };

  const handleZoomIn = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 1.2);
    }
  };

  const handleZoomOut = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 0.8);
    }
  };

  const handleFit = () => {
    if (cyRef.current) {
      cyRef.current.fit();
    }
  };

  const handleReset = () => {
    setFilters({
      showCritical: false,
      showBottlenecks: false,
      nodeType: 'all',
      routeStatus: 'all'
    });
    if (cyRef.current) {
      cyRef.current.fit();
    }
  };

  const handleExportImage = () => {
    if (cyRef.current) {
      const png = cyRef.current.png({ scale: 2 });
      const link = document.createElement('a');
      link.download = 'supply-chain-graph.png';
      link.href = png;
      link.click();
      toast.success('Graph exported as PNG');
    }
  };

  const cytoscapeStylesheet = [
    {
      selector: 'node',
      style: {
        'background-color': (ele) => {
          if (ele.data('isCritical')) return '#ef4444';
          if (ele.data('isBottleneck')) return '#f59e0b';
          const typeColors = {
            supplier: '#3b82f6',
            warehouse: '#8b5cf6',
            distributor: '#ec4899',
            retailer: '#10b981',
            manufacturer: '#f59e0b'
          };
          return typeColors[ele.data('type')] || '#6b7280';
        },
        'label': 'data(label)',
        'width': (ele) => 20 + (ele.data('degreeCentrality') * 30),
        'height': (ele) => 20 + (ele.data('degreeCentrality') * 30),
        'font-size': '12px',
        'text-valign': 'center',
        'text-halign': 'center',
        'color': '#fff',
        'text-outline-color': '#000',
        'text-outline-width': 2,
        'border-width': (ele) => ele.data('isCritical') ? 4 : 2,
        'border-color': '#fff',
        'border-opacity': 0.8
      }
    },
    {
      selector: 'node:selected',
      style: {
        'border-width': 4,
        'border-color': '#fbbf24',
        'border-opacity': 1
      }
    },
    {
      selector: 'edge',
      style: {
        'width': 2,
        'line-color': (ele) => {
          const riskColors = {
            low: '#10b981',
            medium: '#f59e0b',
            high: '#ef4444',
            critical: '#dc2626'
          };
          return riskColors[ele.data('riskLevel')] || '#9ca3af';
        },
        'target-arrow-color': (ele) => {
          const riskColors = {
            low: '#10b981',
            medium: '#f59e0b',
            high: '#ef4444',
            critical: '#dc2626'
          };
          return riskColors[ele.data('riskLevel')] || '#9ca3af';
        },
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        'opacity': (ele) => ele.data('status') === 'active' ? 0.8 : 0.3,
        'line-style': (ele) => ele.data('status') === 'disrupted' ? 'dashed' : 'solid'
      }
    },
    {
      selector: 'edge:selected',
      style: {
        'width': 4,
        'line-color': '#fbbf24',
        'target-arrow-color': '#fbbf24'
      }
    }
  ];

  const layout = {
    name: 'dagre',
    rankDir: 'LR',
    nodeSep: 100,
    rankSep: 150,
    animate: true,
    animationDuration: 500
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading graph...</p>
        </div>
      </div>
    );
  }

  if (elements.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Network className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Graph Data</h2>
          <p className="text-gray-600 mb-6">Please upload nodes and routes to visualize the network</p>
          <a
            href="/upload"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span>Upload Data</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-md px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Network className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">Network Graph View</h1>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleZoomIn}
              className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={handleFit}
              className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Fit to Screen"
            >
              <Maximize2 className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={handleReset}
              className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Reset Filters"
            >
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={handleExportImage}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              title="Export as PNG"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            onClick={() => setFilters(f => ({ ...f, showCritical: !f.showCritical }))}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border transition-colors ${
              filters.showCritical
                ? 'bg-red-100 border-red-300 text-red-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Star className="w-4 h-4" />
            <span className="text-sm">Critical Only</span>
          </button>

          <button
            onClick={() => setFilters(f => ({ ...f, showBottlenecks: !f.showBottlenecks }))}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border transition-colors ${
              filters.showBottlenecks
                ? 'bg-orange-100 border-orange-300 text-orange-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">Bottlenecks Only</span>
          </button>

          <select
            value={filters.nodeType}
            onChange={(e) => setFilters(f => ({ ...f, nodeType: e.target.value }))}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">All Node Types</option>
            <option value="supplier">Suppliers</option>
            <option value="warehouse">Warehouses</option>
            <option value="distributor">Distributors</option>
            <option value="retailer">Retailers</option>
            <option value="manufacturer">Manufacturers</option>
          </select>

          <select
            value={filters.routeStatus}
            onChange={(e) => setFilters(f => ({ ...f, routeStatus: e.target.value }))}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">All Routes</option>
            <option value="active">Active Routes</option>
            <option value="inactive">Inactive Routes</option>
            <option value="disrupted">Disrupted Routes</option>
          </select>
        </div>
      </div>

      {/* Graph Container */}
      <div className="flex-1 relative">
        <CytoscapeComponent
          elements={elements}
          style={{ width: '100%', height: '100%' }}
          stylesheet={cytoscapeStylesheet}
          layout={layout}
          cy={(cy) => {
            cyRef.current = cy;
            
            cy.on('tap', 'node', (evt) => {
              const node = evt.target;
              setSelectedNode(node.data());
            });

            cy.on('tap', (evt) => {
              if (evt.target === cy) {
                setSelectedNode(null);
              }
            });
          }}
        />

        {/* Legend */}
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-xs">
          <h3 className="font-semibold text-gray-900 mb-3 text-sm">Legend</h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              <span>Supplier</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-purple-500"></div>
              <span>Warehouse</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-pink-500"></div>
              <span>Distributor</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span>Retailer</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white"></div>
              <span>Critical Node</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-orange-500"></div>
              <span>Bottleneck</span>
            </div>
            <div className="border-t border-gray-200 my-2"></div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-0.5 bg-green-500"></div>
              <span>Low Risk</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-0.5 bg-orange-500"></div>
              <span>Medium Risk</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-0.5 bg-red-500"></div>
              <span>High Risk</span>
            </div>
          </div>
        </div>

        {/* Node Details Panel */}
        {selectedNode && (
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 w-72">
            <h3 className="font-bold text-gray-900 mb-3">{selectedNode.label}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium capitalize">{selectedNode.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium capitalize ${
                  selectedNode.status === 'active' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {selectedNode.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Capacity:</span>
                <span className="font-medium">{selectedNode.capacity}</span>
              </div>
              {selectedNode.region && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Region:</span>
                  <span className="font-medium">{selectedNode.region}</span>
                </div>
              )}
              <div className="border-t border-gray-200 my-2"></div>
              <div className="flex justify-between">
                <span className="text-gray-600">Degree:</span>
                <span className="font-medium">{selectedNode.degreeCentrality.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Betweenness:</span>
                <span className="font-medium">{selectedNode.betweennessCentrality.toFixed(4)}</span>
              </div>
              {selectedNode.isCritical && (
                <div className="bg-red-50 border border-red-200 rounded p-2 mt-2">
                  <p className="text-red-800 text-xs font-medium">⚠️ Critical Node</p>
                </div>
              )}
              {selectedNode.isBottleneck && (
                <div className="bg-orange-50 border border-orange-200 rounded p-2 mt-2">
                  <p className="text-orange-800 text-xs font-medium">🚧 Bottleneck</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GraphView;
