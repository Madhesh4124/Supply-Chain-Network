const express = require('express');
const router = express.Router();
const Route = require('../models/Route');
const { optionalAuth } = require('../middleware/auth');

// @route   GET /api/routes
// @desc    Get all routes
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    // If logged in, show only user's data. If not logged in, show all public data (user: null)
    const filter = req.user ? { user: req.user._id } : { user: null };
    
    // Support query parameters for filtering
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.transportMode) {
      filter.transportMode = req.query.transportMode;
    }
    if (req.query.riskLevel) {
      filter.riskLevel = req.query.riskLevel;
    }

    const routes = await Route.find(filter).sort({ createdAt: -1 });
    
    res.json({
      count: routes.length,
      routes
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching routes', error: error.message });
  }
});

// @route   GET /api/routes/:id
// @desc    Get single route by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    res.json(route);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching route', error: error.message });
  }
});

// @route   GET /api/routes/node/:nodeId
// @desc    Get all routes connected to a specific node
// @access  Public
router.get('/node/:nodeId', optionalAuth, async (req, res) => {
  try {
    const filter = req.user ? { user: req.user._id } : { user: null };
    const nodeId = req.params.nodeId;

    const routes = await Route.find({
      ...filter,
      $or: [
        { source: nodeId },
        { target: nodeId }
      ]
    });

    res.json({
      count: routes.length,
      routes
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching routes', error: error.message });
  }
});

// @route   PUT /api/routes/:id
// @desc    Update route
// @access  Public
router.put('/:id', optionalAuth, async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    const updatedRoute = await Route.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Route updated successfully',
      route: updatedRoute
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating route', error: error.message });
  }
});

// @route   DELETE /api/routes/:id
// @desc    Delete route
// @access  Public
router.delete('/:id', optionalAuth, async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);
    
    if (!route) {
      return res.status(404).json({ message: 'Route not found' });
    }

    await Route.findByIdAndDelete(req.params.id);

    res.json({ message: 'Route deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting route', error: error.message });
  }
});

// @route   GET /api/routes/stats/summary
// @desc    Get route statistics
// @access  Public
router.get('/stats/summary', optionalAuth, async (req, res) => {
  try {
    const filter = req.user ? { user: req.user._id } : { user: null };

    const totalRoutes = await Route.countDocuments(filter);
    
    const routesByStatus = await Route.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const routesByTransportMode = await Route.aggregate([
      { $match: filter },
      { $group: { _id: '$transportMode', count: { $sum: 1 } } }
    ]);

    const routesByRiskLevel = await Route.aggregate([
      { $match: filter },
      { $group: { _id: '$riskLevel', count: { $sum: 1 } } }
    ]);

    const avgMetrics = await Route.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          avgDistance: { $avg: '$distance' },
          avgCost: { $avg: '$cost' },
          avgTime: { $avg: '$time' },
          totalDistance: { $sum: '$distance' },
          totalCost: { $sum: '$cost' }
        }
      }
    ]);

    res.json({
      totalRoutes,
      byStatus: routesByStatus,
      byTransportMode: routesByTransportMode,
      byRiskLevel: routesByRiskLevel,
      metrics: avgMetrics[0] || {}
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
});

module.exports = router;
