const express = require('express');
const router = express.Router();
const Rating = require('../models/Rating'); // Make sure you have this Mongoose model
const authAdmin = require('../middlewares/authAdmin');

router.use(authAdmin);

// GET all ratings
router.get('/', async (req, res) => {
  try {
    const ratings = await Rating.find();
    res.json(ratings);
  } catch (err) {
    console.error('Admin ratings list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET single rating
router.get('/:id', async (req, res) => {
  try {
    const rating = await Rating.findById(req.params.id);
    if (!rating) return res.status(404).json({ error: 'Rating not found' });
    res.json(rating);
  } catch (err) {
    console.error('Admin rating get error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// CREATE rating
router.post('/', async (req, res) => {
  try {
    const rating = new Rating(req.body);
    await rating.save();
    res.status(201).json(rating);
  } catch (err) {
    console.error('Admin rating create error:', err);
    res.status(400).json({ error: 'Invalid input' });
  }
});

// UPDATE rating
router.put('/:id', async (req, res) => {
  try {
    const rating = await Rating.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!rating) return res.status(404).json({ error: 'Rating not found' });
    res.json(rating);
  } catch (err) {
    console.error('Admin rating update error:', err);
    res.status(400).json({ error: 'Invalid input' });
  }
});

// DELETE rating
router.delete('/:id', async (req, res) => {
  try {
    const rating = await Rating.findByIdAndDelete(req.params.id);
    if (!rating) return res.status(404).json({ error: 'Rating not found' });
    res.json({ message: 'Rating deleted' });
  } catch (err) {
    console.error('Admin rating delete error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
