// server/models/Rating.js

const mongoose = require('mongoose');

const RatingSchema = new mongoose.Schema({
  movie: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 10
  },
  comment: {
    type: String,
    required: false,
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Rating', RatingSchema);
