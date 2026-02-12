// server/routes/adminMovies.js

const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');
const authAdmin = require('../middlewares/authAdmin'); // Only admins/super-admins

// Protect all routes in this file
router.use(authAdmin);

// Create a new movie
router.post('/', async (req, res) => {
  try {
    const { title, genre, rating, description, cast, releaseDate, image, status } = req.body;
    const movie = new Movie({
      title,
      genre,
      rating,
      description,
      cast,
      releaseDate,
      image,
      status, // <-- Add status field
    });
    await movie.save();

    res.status(201).json(movie);
  } catch (err) {
    console.error('Error creating AdminMovie:', err);
    res.status(400).json({ error: 'Invalid input' });
  }
});

// Get all movies (list)
router.get('/', async (req, res) => {
  try {
    const movies = await Movie.find().sort({ createdAt: -1 });
    res.json(movies);
  } catch (err) {
    console.error('Error fetching AdminMovies:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single movie (detail)
router.get('/:id', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ error: 'Movie not found' });
    res.json(movie);
  } catch (err) {
    console.error('Error fetching AdminMovie by ID:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update movie
router.put('/:id', async (req, res) => {
  try {
    const { title, genre, rating, description, cast, releaseDate, image, status } = req.body;
    const movie = await Movie.findByIdAndUpdate(
      req.params.id,
      { title, genre, rating, description, cast, releaseDate, image, status }, // <-- Add status field
      { new: true, runValidators: true }
    );

    if (!movie) return res.status(404).json({ error: 'Movie not found' });
    res.json(movie);
  } catch (err) {
    console.error('Error updating AdminMovie:', err);
    res.status(400).json({ error: 'Invalid input' });
  }
});

// Delete movie
router.delete('/:id', async (req, res) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);
    if (!movie) return res.status(404).json({ error: 'Movie not found' });

    res.json({ message: 'Movie deleted' });
  } catch (err) {
    console.error('Error deleting AdminMovie:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
