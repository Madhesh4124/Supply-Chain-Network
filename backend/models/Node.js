const mongoose = require('mongoose');

const nodeSchema = new mongoose.Schema({
  nodeId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['supplier', 'warehouse', 'distributor', 'retailer', 'manufacturer', 'other'],
    lowercase: true
  },
  latitude: {
    type: Number,
    required: true,
    min: -90,
    max: 90
  },
  longitude: {
    type: Number,
    required: true,
    min: -180,
    max: 180
  },
  capacity: {
    type: Number,
    default: 0
  },
  region: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'disrupted'],
    default: 'active'
  },
  // Social Network Analysis metrics (computed)
  metrics: {
    degreeCentrality: { type: Number, default: 0 },
    betweennessCentrality: { type: Number, default: 0 },
    closenessCentrality: { type: Number, default: 0 },
    clusteringCoefficient: { type: Number, default: 0 },
    isBottleneck: { type: Boolean, default: false },
    isCritical: { type: Boolean, default: false }
  },
  // Additional metadata
  metadata: {
    type: Map,
    of: String
  },
  // User reference (for multi-user support)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for geospatial queries
nodeSchema.index({ latitude: 1, longitude: 1 });
nodeSchema.index({ type: 1 });
nodeSchema.index({ status: 1 });
nodeSchema.index({ user: 1 });

module.exports = mongoose.model('Node', nodeSchema);
