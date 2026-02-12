// server/routes/adminCast.js

const express = require('express');
const router = express.Router();
const Cast = require('../models/Cast'); // Make sure you have this Mongoose model
const authAdmin = require('../middlewares/authAdmin');

router.use(authAdmin);

// GET all cast members
router.get('/', async (req, res) => {
  try {
    const cast = await Cast.find();
    res.json(cast);
  } catch (err) {
    console.error('Admin cast list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET single cast member
router.get('/:id', async (req, res) => {
  try {
    const member = await Cast.findById(req.params.id);
    if (!member) return res.status(404).json({ error: 'Cast member not found' });
    res.json(member);
  } catch (err) {
    console.error('Admin cast get error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// CREATE cast member
router.post('/', async (req, res) => {
  try {
    const member = new Cast(req.body);
    await member.save();
    res.status(201).json(member);
  } catch (err) {
    console.error('Admin cast create error:', err);
    res.status(400).json({ error: 'Invalid input' });
  }
});

// UPDATE cast member
router.put('/:id', async (req, res) => {
  try {
    const member = await Cast.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!member) return res.status(404).json({ error: 'Cast member not found' });
    res.json(member);
  } catch (err) {
    console.error('Admin cast update error:', err);
    res.status(400).json({ error: 'Invalid input' });
  }
});

// DELETE cast member
router.delete('/:id', async (req, res) => {
  try {
    const member = await Cast.findByIdAndDelete(req.params.id);
    if (!member) return res.status(404).json({ error: 'Cast member not found' });
    res.json({ message: 'Cast member deleted' });
  } catch (err) {
    console.error('Admin cast delete error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
