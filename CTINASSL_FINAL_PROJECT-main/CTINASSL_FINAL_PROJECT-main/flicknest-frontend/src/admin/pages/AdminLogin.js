// /src/admin/pages/AdminLogin.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import bgImage from '../../assets/admin_bg.jpg';
import logo from '../../assets/logo.png';
import { login } from '../../admin/utils/api'; // Use your API helper!
import './AdminLogin.css';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // Use central API helper, send role: 'super-admin'
      const data = await login(username, password, 'super-admin');
      if (data.accessToken) localStorage.setItem('token', data.accessToken);
      if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid username or password');
    }
  };

  const handleInputChange = setter => e => {
    setter(e.target.value);
    setError('');
  };

  return (
    <div
      className="admin-login-bg"
      style={{
        background: `url(${bgImage}) no-repeat center center fixed`,
        backgroundSize: 'cover',
      }}
    >
      <div className="admin-login-card">
        <img src={logo} alt="FlickNest Logo" className="admin-login-logo-img" />
        <h2 className="admin-login-title">Admin Log In</h2>
        <p className="admin-login-subtitle">Welcome back! Please enter your details.</p>
        <form className="admin-login-form" onSubmit={handleSubmit}>
          <div className="admin-login-field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={handleInputChange(setUsername)}
              required
              placeholder="Enter your username"
            />
          </div>
          <div className="admin-login-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={handleInputChange(setPassword)}
              required
              placeholder="Enter your password"
            />
          </div>
          {error && <div className="admin-login-error">{error}</div>}
          <button className="admin-login-btn" type="submit">
            Log In
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
