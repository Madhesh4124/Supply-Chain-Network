import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { 
  Map as MapIcon, Filter, RefreshCw, Layers, 
  Navigation, AlertTriangle, Star, Info 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { nodeAPI, routeAPI, analyticsAPI } from '../services/api';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom marker icons
const createCustomIcon = (color, isCritical = false) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: ${isCritical ? '24px' : '20px'};
        height: ${isCritical ? '24px' : '20px'};
        border-radius: 50%;
        border: ${isCritical ? '3px' : '2px'} solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [isCritical ? 24 : 20, isCritical ? 24 : 20],
    iconAnchor: [isCritical ? 12 : 10, isCritical ? 12 : 10],
  });
};

const MapView = () => {
  const [nodes, setNodes] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    nodeType: 'all',
    nodeStatus: 'all',
    routeStatus: 'all',
    showCritical: false,
    showBottlenecks: false,
    riskLevel: 'all'
  });
  const [selectedNode, setSelectedNode] = useState(null);
  const [mapCenter, setMapCenter] = useState([20, 0]);
  const [mapZoom, setMapZoom] = useState(2);

  useEffect(() => {
    fetchMapData();
  }, []);

  const fetchMapData = async () => {
    setLoading(true);
    try {
      const [nodesRes, routesRes] = await Promise.all([
        nodeAPI.getAll(),
        routeAPI.getAll()
      ]);

      const fetchedNodes = nodesRes.data.nodes || [];
      const fetchedRoutes = routesRes.data.routes || [];

      // Create a Set of valid node IDs
      const validNodeIds = new Set(fetchedNodes.map(n => n.nodeId));

      // Filter routes to only include those with valid source and target nodes
      const validRoutes = fetchedRoutes.filter(route => {
        const hasValidSource = validNodeIds.has(route.source);
        const hasValidTarget = validNodeIds.has(route.target);
        
        if (!hasValidSource || !hasValidTarget) {
          console.warn(`Skipping route ${route.source} → ${route.target}: Missing node(s)`);
          return false;
        }
        return true;
      });

      // Show warning if some routes were skipped
      if (fetchedRoutes.length > validRoutes.length) {
        const skippedCount = fetchedRoutes.length - validRoutes.length;
        toast.error(
          `${skippedCount} route(s) skipped due to missing nodes. Please check your data.`,
          { duration: 5000 }
        );
      }

      setNodes(fetchedNodes);
      setRoutes(validRoutes);

      // Calculate center based on nodes
      if (fetchedNodes.length > 0) {
        const avgLat = fetchedNodes.reduce((sum, n) => sum + n.latitude, 0) / fetchedNodes.length;
        const avgLng = fetchedNodes.reduce((sum, n) => sum + n.longitude, 0) / fetchedNodes.length;
        setMapCenter([avgLat, avgLng]);
        setMapZoom(3);
      }

      toast.success('Map data loaded successfully');
    } catch (error) {
      console.error('Error fetching map data:', error);
      toast.error('Failed to load map data');
    } finally {
      setLoading(false);
    }
  };

  const getNodeColor = (node) => {
    if (node.metrics?.isCritical) return '#ef4444'; // Red
    if (node.metrics?.isBottleneck) return '#f59e0b'; // Orange
    
    const typeColors = {
      supplier: '#3b82f6',      // Blue
      warehouse: '#8b5cf6',     // Purple
      distributor: '#ec4899',   // Pink
      retailer: '#10b981',      // Green
      manufacturer: '#f59e0b'   // Orange
    };
    return typeColors[node.type] || '#6b7280'; // Gray default
  };

  const getRouteColor = (route) => {
    const riskColors = {
      low: '#10b981',       // Green
      medium: '#f59e0b',    // Orange
      high: '#ef4444',      // Red
      critical: '#dc2626'   // Dark Red
    };
    return riskColors[route.riskLevel] || '#9ca3af'; // Gray default
  };

  const getRouteWeight = (route) => {
    if (route.status === 'disrupted') return 1;
    if (route.riskLevel === 'critical') return 4;
    if (route.riskLevel === 'high') return 3;
    return 2;
  };

  const getRouteDashArray = (route) => {
    if (route.status === 'disrupted') return '10, 10';
    if (route.status === 'inactive') return '5, 5';
    return null;
  };

  const filteredNodes = nodes.filter(node => {
    if (filters.nodeType !== 'all' && node.type !== filters.nodeType) return false;
    if (filters.nodeStatus !== 'all' && node.status !== filters.nodeStatus) return false;
    if (filters.showCritical && !node.metrics?.isCritical) return false;
    if (filters.showBottlenecks && !node.metrics?.isBottleneck) return false;
    return true;
  });

  const filteredRoutes = routes.filter(route => {
    if (filters.routeStatus !== 'all' && route.status !== filters.routeStatus) return false;
    if (filters.riskLevel !== 'all' && route.riskLevel !== filters.riskLevel) return false;
    
    // Only show routes where both source and target nodes are visible
    const sourceVisible = filteredNodes.some(n => n.nodeId === route.source);
    const targetVisible = filteredNodes.some(n => n.nodeId === route.target);
    return sourceVisible && targetVisible;
  });

  const getRouteCoordinates = (route) => {
    const sourceNode = nodes.find(n => n.nodeId === route.source);
    const targetNode = nodes.find(n => n.nodeId === route.target);
    
    if (sourceNode && targetNode) {
      return [
        [sourceNode.latitude, sourceNode.longitude],
        [targetNode.latitude, targetNode.longitude]
      ];
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <MapIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Map Data</h2>
          <p className="text-gray-600 mb-6">Please upload nodes with geospatial coordinates</p>
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
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <MapIcon className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">Geospatial Map View</h1>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchMapData}
              className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-gray-600" />
              <span className="text-sm">Refresh</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilters(f => ({ ...f, showCritical: !f.showCritical }))}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg border text-sm transition-colors ${
              filters.showCritical
                ? 'bg-red-100 border-red-300 text-red-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Star className="w-4 h-4" />
            <span>Critical</span>
          </button>

          <button
            onClick={() => setFilters(f => ({ ...f, showBottlenecks: !f.showBottlenecks }))}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg border text-sm transition-colors ${
              filters.showBottlenecks
                ? 'bg-orange-100 border-orange-300 text-orange-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Bottlenecks</span>
          </button>

          <select
            value={filters.nodeType}
            onChange={(e) => setFilters(f => ({ ...f, nodeType: e.target.value }))}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">All Types</option>
            <option value="supplier">Suppliers</option>
            <option value="warehouse">Warehouses</option>
            <option value="distributor">Distributors</option>
            <option value="retailer">Retailers</option>
            <option value="manufacturer">Manufacturers</option>
          </select>

          <select
            value={filters.nodeStatus}
            onChange={(e) => setFilters(f => ({ ...f, nodeStatus: e.target.value }))}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="disrupted">Disrupted</option>
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

          <select
            value={filters.riskLevel}
            onChange={(e) => setFilters(f => ({ ...f, riskLevel: e.target.value }))}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">All Risk Levels</option>
            <option value="low">Low Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="high">High Risk</option>
            <option value="critical">Critical Risk</option>
          </select>

          <div className="ml-auto text-sm text-gray-600">
            {filteredNodes.length} nodes, {filteredRoutes.length} routes
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Draw Routes First (so they appear under markers) */}
          {filteredRoutes.map((route, index) => {
            const coordinates = getRouteCoordinates(route);
            if (!coordinates) return null;

            return (
              <Polyline
                key={`route-${index}`}
                positions={coordinates}
                color={getRouteColor(route)}
                weight={getRouteWeight(route)}
                opacity={route.status === 'active' ? 0.7 : 0.3}
                dashArray={getRouteDashArray(route)}
              >
                <Popup>
                  <div className="text-sm">
                    <h3 className="font-bold mb-2">Route: {route.source} → {route.target}</h3>
                    <div className="space-y-1">
                      <p><strong>Distance:</strong> {route.distance} km</p>
                      <p><strong>Cost:</strong> ${route.cost}</p>
                      <p><strong>Time:</strong> {route.time} hours</p>
                      <p><strong>Mode:</strong> {route.transportMode}</p>
                      <p><strong>Status:</strong> <span className={`capitalize ${
                        route.status === 'active' ? 'text-green-600' : 'text-red-600'
                      }`}>{route.status}</span></p>
                      <p><strong>Risk:</strong> <span className={`capitalize ${
                        route.riskLevel === 'low' ? 'text-green-600' :
                        route.riskLevel === 'medium' ? 'text-orange-600' :
                        'text-red-600'
                      }`}>{route.riskLevel}</span></p>
                    </div>
                  </div>
                </Popup>
              </Polyline>
            );
          })}

          {/* Draw Nodes */}
          {filteredNodes.map((node) => (
            <CircleMarker
              key={node.nodeId}
              center={[node.latitude, node.longitude]}
              radius={node.metrics?.isCritical ? 12 : 8}
              fillColor={getNodeColor(node)}
              color="white"
              weight={node.metrics?.isCritical ? 3 : 2}
              opacity={1}
              fillOpacity={0.8}
            >
              <Popup>
                <div className="text-sm min-w-[200px]">
                  <h3 className="font-bold text-base mb-2">{node.name}</h3>
                  <div className="space-y-1">
                    <p><strong>ID:</strong> {node.nodeId}</p>
                    <p><strong>Type:</strong> <span className="capitalize">{node.type}</span></p>
                    <p><strong>Status:</strong> <span className={`capitalize ${
                      node.status === 'active' ? 'text-green-600' : 'text-red-600'
                    }`}>{node.status}</span></p>
                    <p><strong>Capacity:</strong> {node.capacity}</p>
                    {node.region && <p><strong>Region:</strong> {node.region}</p>}
                    {node.city && <p><strong>City:</strong> {node.city}</p>}
                    {node.country && <p><strong>Country:</strong> {node.country}</p>}
                    
                    {node.metrics && (
                      <>
                        <div className="border-t border-gray-200 my-2"></div>
                        <p className="text-xs"><strong>Degree:</strong> {node.metrics.degreeCentrality?.toFixed(4)}</p>
                        <p className="text-xs"><strong>Betweenness:</strong> {node.metrics.betweennessCentrality?.toFixed(4)}</p>
                      </>
                    )}

                    {node.metrics?.isCritical && (
                      <div className="bg-red-50 border border-red-200 rounded p-2 mt-2">
                        <p className="text-red-800 text-xs font-medium">⚠️ Critical Node</p>
                      </div>
                    )}
                    {node.metrics?.isBottleneck && (
                      <div className="bg-orange-50 border border-orange-200 rounded p-2 mt-2">
                        <p className="text-orange-800 text-xs font-medium">🚧 Bottleneck</p>
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        {/* Legend */}
        <div className="absolute bottom-6 left-6 bg-white rounded-lg shadow-lg p-4 max-w-xs z-[1000]">
          <div className="flex items-center space-x-2 mb-3">
            <Layers className="w-4 h-4 text-gray-600" />
            <h3 className="font-semibold text-gray-900 text-sm">Legend</h3>
          </div>
          
          <div className="space-y-2 text-xs">
            <p className="font-medium text-gray-700 mb-1">Node Types:</p>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Supplier</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span>Warehouse</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-pink-500"></div>
              <span>Distributor</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Retailer</span>
            </div>
            
            <div className="border-t border-gray-200 my-2"></div>
            <p className="font-medium text-gray-700 mb-1">Special Nodes:</p>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white"></div>
              <span>Critical Node</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span>Bottleneck</span>
            </div>
            
            <div className="border-t border-gray-200 my-2"></div>
            <p className="font-medium text-gray-700 mb-1">Route Risk:</p>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-0.5 bg-green-500"></div>
              <span>Low</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-0.5 bg-orange-500"></div>
              <span>Medium</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-0.5 bg-red-500"></div>
              <span>High/Critical</span>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="absolute top-6 right-6 bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-xs z-[1000]">
          <div className="flex items-start space-x-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-xs text-blue-900">
              <p className="font-medium mb-1">Interactive Map</p>
              <p>Click on nodes and routes for detailed information. Use filters to focus on specific elements.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;
