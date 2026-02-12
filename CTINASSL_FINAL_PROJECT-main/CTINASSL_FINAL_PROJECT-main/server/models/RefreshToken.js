// src/server/models/RefreshToken.js

const mongoose = require('mongoose');

const RefreshTokenSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true },
  expires: { type: Date, required: true }
});

module.exports = mongoose.model('RefreshToken', RefreshTokenSchema);
