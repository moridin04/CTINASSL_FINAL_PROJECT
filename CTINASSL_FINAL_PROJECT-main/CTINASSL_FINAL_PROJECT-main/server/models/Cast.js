// server/models/Cast.js

const mongoose = require('mongoose');

const CastSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    required: false,
    trim: true
  },
  photo: {
    type: String,
    required: false // URL to photo
  }
}, { timestamps: true });

module.exports = mongoose.model('Cast', CastSchema);
