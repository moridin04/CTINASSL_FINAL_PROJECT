// server/routes/adminDashboard.js

const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');
const User = require('../models/User');
const authAdmin = require('../middlewares/authAdmin');

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Apply admin-only middleware to all dashboard routes
router.use(authAdmin);

// Movies added per month (current year)
router.get('/movies-per-month', async (req, res) => {
  const year = new Date().getFullYear();
  const pipeline = [
    {
      $match: {
        createdAt: {
          $gte: new Date(`${year}-01-01T00:00:00.000Z`),
          $lte: new Date(`${year}-12-31T23:59:59.999Z`)
        }
      }
    },
    {
      $group: {
        _id: { $month: "$createdAt" },
        movies: { $sum: 1 }
      }
    },
    { $sort: { "_id": 1 } }
  ];
  const results = await Movie.aggregate(pipeline);
  // Fill missing months
  const data = Array.from({ length: 12 }, (_, i) => ({
    month: monthNames[i],
    movies: 0
  }));
  results.forEach(r => {
    data[r._id - 1].movies = r.movies;
  });
  res.json(data);
});

// User registrations per month (current year)
router.get('/user-registrations', async (req, res) => {
  const year = new Date().getFullYear();
  const pipeline = [
    {
      $match: {
        createdAt: {
          $gte: new Date(`${year}-01-01T00:00:00.000Z`),
          $lte: new Date(`${year}-12-31T23:59:59.999Z`)
        }
      }
    },
    {
      $group: {
        _id: { $month: "$createdAt" },
        users: { $sum: 1 }
      }
    },
    { $sort: { "_id": 1 } }
  ];
  const results = await User.aggregate(pipeline);
  const data = Array.from({ length: 12 }, (_, i) => ({
    month: monthNames[i],
    users: 0
  }));
  results.forEach(r => {
    data[r._id - 1].users = r.users;
  });
  res.json(data);
});

// Genre popularity (all time)
router.get('/genre-popularity', async (req, res) => {
  const pipeline = [
    { $unwind: "$genre" },
    {
      $group: {
        _id: "$genre",
        value: { $sum: 1 }
      }
    },
    { $sort: { value: -1 } }
  ];
  const results = await Movie.aggregate(pipeline);
  const data = results.map(r => ({
    name: r._id || 'Unknown',
    value: r.value
  }));
  res.json(data);
});

// Recent activity (latest 5 movies and users)
router.get('/recent-activity', async (req, res) => {
  const recentMovies = await Movie.find().sort({ createdAt: -1 }).limit(5);
  const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5);
  const activity = [
    ...recentMovies.map(m => ({
      type: 'movie',
      name: m.title,
      date: m.createdAt.toISOString().slice(0, 10)
    })),
    ...recentUsers.map(u => ({
      type: 'user',
      name: u.username,
      date: u.createdAt.toISOString().slice(0, 10)
    }))
  ];
  // Sort all by date descending and limit to 10
  activity.sort((a, b) => b.date.localeCompare(a.date));
  res.json(activity.slice(0, 10));
});

// Dashboard stats
router.get('/stats', async (req, res) => {
  const totalMovies = await Movie.countDocuments();
  const totalUsers = await User.countDocuments();
  const totalAdmins = await User.countDocuments({ role: { $in: ['admin', 'super-admin'] } });

  // Movies added this week
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
  startOfWeek.setHours(0, 0, 0, 0);
  const moviesThisWeek = await Movie.countDocuments({ createdAt: { $gte: startOfWeek } });
  const usersThisWeek = await User.countDocuments({ createdAt: { $gte: startOfWeek } });

  res.json({
    totalMovies,
    totalUsers,
    totalAdmins,
    moviesThisWeek,
    usersThisWeek
  });
});

module.exports = router;
