// src/admin/components/AdminDashboard.js

import React, { useEffect, useState } from 'react';
import { applyThemeFromStorage } from '../utils/theme';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  getMoviesPerMonth,
  getUserRegistrations,
  getGenrePopularity,
  getRecentActivity,
  getDashboardStats,
} from '../utils/api';
import './Dashboard.css';

const COLORS = ['#0D6EFD', '#198754', '#FFC107', '#AB2E3C'];

const Dashboard = () => {
  useEffect(() => {
    applyThemeFromStorage();
  }, []);

  const [moviesPerMonth, setMoviesPerMonth] = useState([]);
  const [userRegistrations, setUserRegistrations] = useState([]);
  const [genrePopularity, setGenrePopularity] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [stats, setStats] = useState({
    totalMovies: 0,
    totalUsers: 0,
    totalAdmins: 0,
    moviesThisWeek: 0,
    usersThisWeek: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      try {
        const [moviesMonth, usersMonth, genres, recent, dashboardStats] = await Promise.all([
          getMoviesPerMonth(),
          getUserRegistrations(),
          getGenrePopularity(),
          getRecentActivity(),
          getDashboardStats(),
        ]);

        setMoviesPerMonth(moviesMonth);
        setUserRegistrations(usersMonth);
        setGenrePopularity(genres);
        setRecentActivity(recent);
        setStats(dashboardStats);
      } catch (err) {
        setMoviesPerMonth([
          { month: 'Jan', movies: 10 }, { month: 'Feb', movies: 25 },
          { month: 'Mar', movies: 15 }, { month: 'Apr', movies: 30 },
          { month: 'May', movies: 45 }, { month: 'Jun', movies: 20 },
        ]);
        setUserRegistrations([
          { month: 'Jan', users: 5 }, { month: 'Feb', users: 12 },
          { month: 'Mar', users: 25 }, { month: 'Apr', users: 40 },
          { month: 'May', users: 55 }, { month: 'Jun', users: 30 },
        ]);
        setGenrePopularity([
          { name: 'Action', value: 400 }, { name: 'Comedy', value: 300 },
          { name: 'Drama', value: 300 }, { name: 'Horror', value: 200 },
        ]);
        setRecentActivity([
          { type: 'movie', name: 'Inception added', date: '2 mins ago' },
          { type: 'user', name: 'John Doe registered', date: '1 hour ago' },
          { type: 'movie', name: 'The Matrix updated', date: '3 hours ago' },
          { type: 'user', name: 'Jane Smith registered', date: '5 hours ago' },
        ]);
        setStats({
          totalMovies: 125, totalUsers: 48, totalAdmins: 3,
          moviesThisWeek: 5, usersThisWeek: 12
        });
      }
      setLoading(false);
    }
    fetchDashboardData();
  }, []);

  return (
    <main className="dashboard-container">
      <header className="dashboard-header">
        <h1>Welcome back, Admin! 👋</h1>
        <p>Here is what's happening with your platform today.</p>
      </header>

      <section className="stats-grid">
        <div className="stat-card">
          <h3>Total Movies</h3>
          <p className="stat-number">{stats.totalMovies}</p>
          <span className="stat-trend positive">+{stats.moviesThisWeek} this week</span>
        </div>
        <div className="stat-card">
          <h3>Total Users</h3>
          <p className="stat-number">{stats.totalUsers}</p>
          <span className="stat-trend neutral">{stats.usersThisWeek} this week</span>
        </div>
        <div className="stat-card">
          <h3>Total Admins</h3>
          <p className="stat-number">{stats.totalAdmins}</p>
          <span className="stat-trend">Active</span>
        </div>
      </section>

      <section className="charts-section">
        <div className="chart-card">
          <h2>Movies Added Per Month</h2>
          {loading ? <div className="loading-text">Loading...</div> : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={moviesPerMonth}>
                <XAxis dataKey="month" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: '#f4f4f5' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="movies" fill="#7b3ff2" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="chart-card">
          <h2>User Registrations</h2>
          {loading ? <div className="loading-text">Loading...</div> : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={userRegistrations}>
                <XAxis dataKey="month" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="users" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="chart-card">
          <h2>Genre Popularity</h2>
          {loading ? <div className="loading-text">Loading...</div> : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={genrePopularity}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                >
                  {genrePopularity.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="activity-section">
        <div className="activity-card">
          <h2>Recent Activity</h2>
          {loading ? (
            <div className="loading-text">Loading...</div>
          ) : (
            <ul className="recent-activity-list">
              {recentActivity.map((item, idx) => (
                <li key={idx}>
                  <span className={`activity-type ${item.type}`}>
                    {item.type === 'movie' ? '🎬' : '👤'}
                  </span>
                  <div className="activity-info">
                    <span className="activity-name">{item.name}</span>
                    <span className="activity-date">{item.date}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
};

export default Dashboard;
