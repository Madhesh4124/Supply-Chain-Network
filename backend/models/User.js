const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  organization: {
    type: String,
    trim: true
  },
  // Email notification preferences
  emailNotifications: {
    enabled: { type: Boolean, default: true },
    frequency: { 
      type: String, 
      enum: ['daily', 'weekly', 'monthly', 'on-demand'],
      default: 'weekly'
    }
  },
  // Alert notification preferences
  alertNotifications: {
    enabled: { type: Boolean, default: false },
    frequency: { 
      type: String, 
      enum: ['15min', '30min', 'hourly', '6hours', 'daily'],
      default: 'hourly'
    }
  },
  // Last login tracking
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
