// server/routes/movies.js

const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');
const authAdmin = require('../middlewares/authAdmin');

const PUBLIC_MOVIE_PROJECTION = '-__v -createdAt -updatedAt';

// Create a new movie
router.post('/', authAdmin, async (req, res) => {
  try {
    const { title, genre, rating, description, cast, releaseDate, image, status } = req.body;
    const movie = new Movie({ title, genre, rating, description, cast, releaseDate, image, status });
    await movie.save();

    res.status(201).json(movie);
  } catch (err) {
    console.error('Create movie error:', err);
    res.status(400).json({ error: 'Invalid input' });
  }
});

// Get all movies
router.get('/', async (req, res) => {
  try {
    const movies = await Movie.find().select(PUBLIC_MOVIE_PROJECTION);
    res.json(movies);
  } catch (err) {
    console.error('Get movies error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get trending movies
router.get('/trending', async (req, res) => {
  try {
    const trending = await Movie.find({ status: 'Trending' })
      .select(PUBLIC_MOVIE_PROJECTION)
      .sort({ rating: -1 })
      .limit(10);
    res.json(trending);
  } catch (err) {
    console.error('Get trending movies error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get latest movies
router.get('/latest', async (req, res) => {
  try {
    const latest = await Movie.find({ status: 'Latest Movies' })
      .select(PUBLIC_MOVIE_PROJECTION)
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(latest);
  } catch (err) {
    console.error('Get latest movies error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get coming soon movies (by status or releaseDate in the future)
router.get('/coming-soon', async (req, res) => {
  try {
    // Format today's date as YYYY-MM-DD
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isoToday = today.toISOString().slice(0, 10);

    const comingSoon = await Movie.find({
      $or: [
        { status: 'Coming Soon' },
        { releaseDate: { $gt: isoToday } }
      ]
    })
      .select(PUBLIC_MOVIE_PROJECTION)
      .sort({ releaseDate: 1 })
      .limit(10);

    res.json(comingSoon);
  } catch (err) {
    console.error('Get coming soon movies error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// -----------------------------
// ADD THIS: Search movies route
// -----------------------------
router.get('/search', async (req, res) => {
  const q = req.query.q ? String(req.query.q).trim() : '';
  if (!q) return res.json([]);
  try {
    const safe = q.slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const movies = await Movie.find({
      title: { $regex: safe, $options: 'i' }
    }).select(PUBLIC_MOVIE_PROJECTION);
    res.json(movies);
  } catch (err) {
    console.error('Search movies error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// -----------------------------

// Get a single movie by ID
router.get('/:id', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id).select(PUBLIC_MOVIE_PROJECTION);
    if (!movie) return res.status(404).json({ error: 'Movie not found' });
    res.json(movie);
  } catch (err) {
    console.error('Get movie error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a movie by ID
router.put('/:id', authAdmin, async (req, res) => {
  try {
    const { title, genre, rating, description, cast, releaseDate, image, status } = req.body;
    const updateFields = { title, genre, rating, description, cast, releaseDate, image, status };
    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    );

    if (!movie) return res.status(404).json({ error: 'Movie not found' });
    res.json(movie);
  } catch (err) {
    console.error('Update movie error:', err);
    res.status(400).json({ error: 'Invalid input' });
  }
});

// Delete a movie by ID
router.delete('/:id', authAdmin, async (req, res) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);
    if (!movie) return res.status(404).json({ error: 'Movie not found' });
    res.json({ message: 'Movie deleted' });
  } catch (err) {
    console.error('Delete movie error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
