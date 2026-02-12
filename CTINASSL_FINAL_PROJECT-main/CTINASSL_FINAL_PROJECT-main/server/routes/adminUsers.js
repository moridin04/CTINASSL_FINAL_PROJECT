// server/routes/adminUsers.js

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authSuperAdmin = require('../middlewares/authSuperAdmin');
const bcrypt = require('bcrypt');

const BCRYPT_COST = Number(process.env.BCRYPT_COST || 12);

function passwordIsStrong(pw) {
  return (
    typeof pw === 'string' &&
    pw.length >= 12 &&
    pw.length <= 128 &&
    /[a-z]/.test(pw) &&
    /[A-Z]/.test(pw) &&
    /\d/.test(pw) &&
    /[^A-Za-z0-9]/.test(pw) &&
    !/\s/.test(pw)
  );
}

router.use(authSuperAdmin);

// GET all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error('Admin users list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST create admin (NO super-admin allowed)
router.post('/', async (req, res) => {
  try {
    const { username, name, email, password, role } = req.body;

    // Validate required fields
    if (!username || !name || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Only allow role "admin"
    if (role !== 'admin') {
      return res.status(400).json({ error: 'Role must be admin.' });
    }

    // Check for existing username or email
    const existing = await User.findOne({
      $or: [
        { email },
        { username }
      ]
    });
    if (existing) {
      return res.status(409).json({ error: 'Username or email already exists.' });
    }

    if (!passwordIsStrong(password)) {
      return res.status(400).json({ error: 'Password does not meet complexity requirements.' });
    }

    // Hash password and save
    const hashedPassword = await bcrypt.hash(password, BCRYPT_COST);
    const user = new User({ username, name, email, password: hashedPassword, role });
    await user.save();
    const safeUser = user.toObject();
    delete safeUser.password;
    res.status(201).json(safeUser);
  } catch (err) {
    console.error('Admin user create error:', err);
    res.status(400).json({ error: 'Invalid input' });
  }
});

// PUT update admin/user (NO super-admin allowed)
router.put('/:id', async (req, res) => {
  try {
    const userToEdit = await User.findById(req.params.id);
    if (userToEdit && userToEdit.role === 'super-admin') {
      return res.status(403).json({ error: 'Super Admin cannot be edited.' });
    }

    const { username, name, email, role, password } = req.body;
    const updateFields = {};
    if (username) {
      const existingUsername = await User.findOne({ username, _id: { $ne: req.params.id } });
      if (existingUsername) {
        return res.status(409).json({ error: 'Username already exists.' });
      }
      updateFields.username = username;
    }
    if (name) updateFields.name = name;
    if (email) {
      const existingEmail = await User.findOne({ email, _id: { $ne: req.params.id } });
      if (existingEmail) {
        return res.status(409).json({ error: 'Email already exists.' });
      }
      updateFields.email = email;
    }
    if (role) {
      if (!['admin', 'user'].includes(role)) {
        return res.status(400).json({ error: 'Role must be admin or user.' });
      }
      updateFields.role = role;
    }
    if (password) {
      if (!passwordIsStrong(password)) {
        return res.status(400).json({ error: 'Password does not meet complexity requirements.' });
      }
      updateFields.password = await bcrypt.hash(password, BCRYPT_COST);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    const safeUser = user.toObject();
    delete safeUser.password;
    res.json(safeUser);
  } catch (err) {
    console.error('Admin user update error:', err);
    res.status(400).json({ error: 'Invalid input' });
  }
});

// DELETE admin/super-admin
router.delete('/:id', async (req, res) => {
  try {
    const userToDelete = await User.findById(req.params.id);
    if (userToDelete && userToDelete.role === 'super-admin') {
      return res.status(403).json({ error: 'Super Admin cannot be deleted.' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error('Admin user delete error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
