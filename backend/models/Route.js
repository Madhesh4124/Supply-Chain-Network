const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  source: {
    type: String,
    required: true,
    trim: true
  },
  target: {
    type: String,
    required: true,
    trim: true
  },
  distance: {
    type: Number,
    default: 0,
    min: 0
  },
  cost: {
    type: Number,
    default: 0,
    min: 0
  },
  time: {
    type: Number,
    default: 0,
    min: 0,
    comment: 'Time in hours'
  },
  capacity: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'disrupted', 'congested'],
    default: 'active'
  },
  transportMode: {
    type: String,
    enum: ['road', 'rail', 'air', 'sea', 'multimodal', 'other'],
    default: 'road'
  },
  // Risk assessment
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
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

// Compound index for route lookup
routeSchema.index({ source: 1, target: 1 });
routeSchema.index({ status: 1 });
routeSchema.index({ user: 1 });

// Prevent duplicate routes
routeSchema.index({ source: 1, target: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Route', routeSchema);
