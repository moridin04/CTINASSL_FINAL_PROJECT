// server/routes/adminGenres.js

const express = require('express');
const router = express.Router();
const Genre = require('../models/Genre');
const authAdmin = require('../middlewares/authAdmin');

router.use(authAdmin);

// GET all genres
router.get('/', async (req, res) => {
  try {
    const genres = await Genre.find().sort({ name: 1 });
    res.json(genres);
  } catch (err) {
    console.error('Admin genres list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET single genre
router.get('/:id', async (req, res) => {
  try {
    const genre = await Genre.findById(req.params.id);
    if (!genre) return res.status(404).json({ error: 'Genre not found' });
    res.json(genre);
  } catch (err) {
    console.error('Admin genre get error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// CREATE genre
router.post('/', async (req, res) => {
  try {
    const genre = new Genre(req.body);
    await genre.save();
    res.status(201).json(genre);
  } catch (err) {
    console.error('Admin genre create error:', err);
    res.status(400).json({ error: 'Invalid input' });
  }
});

// UPDATE genre
router.put('/:id', async (req, res) => {
  try {
    const genre = await Genre.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!genre) return res.status(404).json({ error: 'Genre not found' });
    res.json(genre);
  } catch (err) {
    console.error('Admin genre update error:', err);
    res.status(400).json({ error: 'Invalid input' });
  }
});

// DELETE genre
router.delete('/:id', async (req, res) => {
  try {
    const genre = await Genre.findByIdAndDelete(req.params.id);
    if (!genre) return res.status(404).json({ error: 'Genre not found' });
    res.json({ message: 'Genre deleted' });
  } catch (err) {
    console.error('Admin genre delete error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
