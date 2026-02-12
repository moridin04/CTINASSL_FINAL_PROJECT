// /server/models/User.js

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  name: { type: String }, // For display/friendly name, not required
  email: {
    type: String,
    unique: true,
    required: function() {
      // Only require email for 'user' and 'admin'
      return this.role === 'user' || this.role === 'admin';
    }
  },
  password: { type: String, required: true },
  role:     { type: String, enum: ['user', 'admin', 'super-admin'], default: 'user' },

  // Security: account lockout after repeated failures
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
