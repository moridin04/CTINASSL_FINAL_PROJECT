// server/models/Movie.js

const mongoose = require('mongoose');

const MovieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  genre: [{ type: String }],
  rating: { type: Number, min: 0, max: 10 },
  description: String,
  cast: [String],
  releaseDate: String,
  image: String,
  status: { type: String, enum: ['Coming Soon', 'Trending', 'Latest Movies'], default: 'Latest Movies' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Movie', MovieSchema);
