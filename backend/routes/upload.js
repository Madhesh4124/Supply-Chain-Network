const express = require('express');
const router = express.Router();
const fs = require('fs');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const upload = require('../middleware/upload');
const { optionalAuth } = require('../middleware/auth');
const Node = require('../models/Node');
const Route = require('../models/Route');

// Helper function to parse CSV
const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
};

// Helper function to parse Excel
const parseExcel = (filePath) => {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    return data;
  } catch (error) {
    throw new Error('Error parsing Excel file: ' + error.message);
  }
};

// @route   POST /api/upload/nodes
// @desc    Upload nodes CSV/Excel file
// @access  Public (or Private if auth enabled)
router.post('/nodes', optionalAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    const filePath = req.file.path;
    const fileExt = req.file.originalname.split('.').pop().toLowerCase();

    let data;
    
    // Parse file based on extension
    if (fileExt === 'csv') {
      data = await parseCSV(filePath);
    } else if (fileExt === 'xlsx' || fileExt === 'xls') {
      data = parseExcel(filePath);
    } else {
      fs.unlinkSync(filePath); // Delete file
      return res.status(400).json({ message: 'Unsupported file format' });
    }

    // Validate and transform data
    const nodes = [];
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      // Map CSV columns to schema (flexible column naming)
      const nodeId = row.id || row.nodeId || row.node_id || row.ID;
      const name = row.name || row.Name || row.NODE_NAME;
      const type = (row.type || row.Type || row.node_type || 'other').toLowerCase();
      const latitude = parseFloat(row.latitude || row.lat || row.Latitude || row.LAT);
      const longitude = parseFloat(row.longitude || row.lng || row.lon || row.Longitude || row.LNG);
      const capacity = parseFloat(row.capacity || row.Capacity || 0);
      const region = row.region || row.Region || '';
      const country = row.country || row.Country || '';
      const city = row.city || row.City || '';
      const status = (row.status || row.Status || 'active').toLowerCase();

      // Validation
      if (!nodeId || !name || !latitude || !longitude) {
        errors.push({ row: i + 1, message: 'Missing required fields (id, name, latitude, longitude)' });
        continue;
      }

      if (isNaN(latitude) || isNaN(longitude)) {
        errors.push({ row: i + 1, message: 'Invalid latitude or longitude' });
        continue;
      }

      nodes.push({
        nodeId,
        name,
        type,
        latitude,
        longitude,
        capacity,
        region,
        country,
        city,
        status,
        user: req.user ? req.user._id : null
      });
    }

    // Delete uploaded file
    fs.unlinkSync(filePath);

    if (nodes.length === 0) {
      return res.status(400).json({ 
        message: 'No valid nodes found in file', 
        errors 
      });
    }

    // Insert nodes into database (with upsert to handle duplicates)
    const insertedNodes = [];
    const duplicates = [];

    for (const nodeData of nodes) {
      try {
        const node = await Node.findOneAndUpdate(
          { nodeId: nodeData.nodeId, user: nodeData.user },
          nodeData,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        insertedNodes.push(node);
      } catch (error) {
        duplicates.push({ nodeId: nodeData.nodeId, error: error.message });
      }
    }

    res.status(201).json({
      message: 'Nodes uploaded successfully',
      total: data.length,
      inserted: insertedNodes.length,
      errors: errors.length,
      errorDetails: errors,
      duplicates: duplicates.length,
      duplicateDetails: duplicates
    });

  } catch (error) {
    console.error(error);
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Error uploading nodes', error: error.message });
  }
});

// @route   POST /api/upload/routes
// @desc    Upload routes CSV/Excel file
// @access  Public (or Private if auth enabled)
router.post('/routes', optionalAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    const filePath = req.file.path;
    const fileExt = req.file.originalname.split('.').pop().toLowerCase();

    let data;
    
    // Parse file based on extension
    if (fileExt === 'csv') {
      data = await parseCSV(filePath);
    } else if (fileExt === 'xlsx' || fileExt === 'xls') {
      data = parseExcel(filePath);
    } else {
      fs.unlinkSync(filePath);
      return res.status(400).json({ message: 'Unsupported file format' });
    }

    // Validate and transform data
    const routes = [];
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      // Map CSV columns to schema
      const source = row.source || row.Source || row.from || row.FROM;
      const target = row.target || row.Target || row.to || row.TO;
      const distance = parseFloat(row.distance || row.Distance || 0);
      const cost = parseFloat(row.cost || row.Cost || 0);
      const time = parseFloat(row.time || row.Time || row.duration || 0);
      const capacity = parseFloat(row.capacity || row.Capacity || 0);
      const status = (row.status || row.Status || 'active').toLowerCase();
      const transportMode = (row.transportMode || row.transport_mode || row.mode || 'road').toLowerCase();
      const riskLevel = (row.riskLevel || row.risk_level || row.risk || 'low').toLowerCase();

      // Validation
      if (!source || !target) {
        errors.push({ row: i + 1, message: 'Missing required fields (source, target)' });
        continue;
      }

      routes.push({
        source,
        target,
        distance,
        cost,
        time,
        capacity,
        status,
        transportMode,
        riskLevel,
        user: req.user ? req.user._id : null
      });
    }

    // Delete uploaded file
    fs.unlinkSync(filePath);

    if (routes.length === 0) {
      return res.status(400).json({ 
        message: 'No valid routes found in file', 
        errors 
      });
    }

    // Validate that referenced nodes exist
    const filter = req.user ? { user: req.user._id } : {};
    const existingNodes = await Node.find(filter);
    const existingNodeIds = new Set(existingNodes.map(n => n.nodeId));
    
    const missingNodes = new Set();
    const validRoutes = routes.filter(route => {
      const hasSource = existingNodeIds.has(route.source);
      const hasTarget = existingNodeIds.has(route.target);
      
      if (!hasSource) missingNodes.add(route.source);
      if (!hasTarget) missingNodes.add(route.target);
      
      return hasSource && hasTarget;
    });

    // Insert routes into database
    const insertedRoutes = [];
    const duplicates = [];

    for (const routeData of validRoutes) {
      try {
        const route = await Route.findOneAndUpdate(
          { source: routeData.source, target: routeData.target, user: routeData.user },
          routeData,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        insertedRoutes.push(route);
      } catch (error) {
        duplicates.push({ 
          source: routeData.source, 
          target: routeData.target, 
          error: error.message 
        });
      }
    }

    const response = {
      message: 'Routes uploaded successfully',
      total: data.length,
      inserted: insertedRoutes.length,
      errors: errors.length,
      errorDetails: errors,
      duplicates: duplicates.length,
      duplicateDetails: duplicates
    };

    // Add warning about missing nodes
    if (missingNodes.size > 0) {
      response.warning = `${routes.length - validRoutes.length} route(s) skipped due to missing nodes`;
      response.missingNodes = Array.from(missingNodes);
      response.hint = 'Please upload nodes file first, or check that node IDs in routes match node IDs in nodes file';
    }

    res.status(201).json(response);

  } catch (error) {
    console.error(error);
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Error uploading routes', error: error.message });
  }
});

// @route   DELETE /api/upload/clear-all
// @desc    Clear all nodes and routes (for testing)
// @access  Public
router.delete('/clear-all', optionalAuth, async (req, res) => {
  try {
    // Build filter to include both user-specific data and data without user
    // This ensures we delete data uploaded both when logged in and logged out
    const filter = req.user 
      ? { $or: [{ user: req.user._id }, { user: null }] }
      : { user: null };
    
    const nodesDeleted = await Node.deleteMany(filter);
    const routesDeleted = await Route.deleteMany(filter);

    res.json({
      message: 'All data cleared successfully',
      nodesDeleted: nodesDeleted.deletedCount,
      routesDeleted: routesDeleted.deletedCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error clearing data', error: error.message });
  }
});

module.exports = router;
