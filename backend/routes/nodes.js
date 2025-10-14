const express = require('express');
const router = express.Router();
const Node = require('../models/Node');
const { optionalAuth } = require('../middleware/auth');

// @route   GET /api/nodes
// @desc    Get all nodes
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    // If logged in, show only user's data. If not logged in, show all public data (user: null)
    const filter = req.user ? { user: req.user._id } : { user: null };
    
    // Support query parameters for filtering
    if (req.query.type) {
      filter.type = req.query.type;
    }
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.region) {
      filter.region = req.query.region;
    }

    const nodes = await Node.find(filter).sort({ createdAt: -1 });
    
    res.json({
      count: nodes.length,
      nodes
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching nodes', error: error.message });
  }
});

// @route   GET /api/nodes/:id
// @desc    Get single node by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const node = await Node.findById(req.params.id);
    
    if (!node) {
      return res.status(404).json({ message: 'Node not found' });
    }

    res.json(node);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching node', error: error.message });
  }
});

// @route   GET /api/nodes/nodeId/:nodeId
// @desc    Get node by nodeId (custom ID)
// @access  Public
router.get('/nodeId/:nodeId', optionalAuth, async (req, res) => {
  try {
    const filter = { nodeId: req.params.nodeId };
    if (req.user) {
      filter.user = req.user._id;
    } else {
      filter.user = null;
    }

    const node = await Node.findOne(filter);
    
    if (!node) {
      return res.status(404).json({ message: 'Node not found' });
    }

    res.json(node);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching node', error: error.message });
  }
});

// @route   PUT /api/nodes/:id
// @desc    Update node
// @access  Public
router.put('/:id', optionalAuth, async (req, res) => {
  try {
    const node = await Node.findById(req.params.id);
    
    if (!node) {
      return res.status(404).json({ message: 'Node not found' });
    }

    // Update fields
    const updatedNode = await Node.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Node updated successfully',
      node: updatedNode
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating node', error: error.message });
  }
});

// @route   DELETE /api/nodes/:id
// @desc    Delete node
// @access  Public
router.delete('/:id', optionalAuth, async (req, res) => {
  try {
    const node = await Node.findById(req.params.id);
    
    if (!node) {
      return res.status(404).json({ message: 'Node not found' });
    }

    await Node.findByIdAndDelete(req.params.id);

    res.json({ message: 'Node deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting node', error: error.message });
  }
});

// @route   GET /api/nodes/stats/summary
// @desc    Get node statistics
// @access  Public
router.get('/stats/summary', optionalAuth, async (req, res) => {
  try {
    const filter = req.user ? { user: req.user._id } : { user: null };

    const totalNodes = await Node.countDocuments(filter);
    
    const nodesByType = await Node.aggregate([
      { $match: filter },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    const nodesByStatus = await Node.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const nodesByRegion = await Node.aggregate([
      { $match: filter },
      { $group: { _id: '$region', count: { $sum: 1 } } }
    ]);

    res.json({
      totalNodes,
      byType: nodesByType,
      byStatus: nodesByStatus,
      byRegion: nodesByRegion
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
});

module.exports = router;
