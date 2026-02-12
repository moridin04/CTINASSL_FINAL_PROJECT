// src/admin/components/Settings.js

import React, { useState, useEffect } from 'react';
import { applyThemeFromStorage } from '../utils/theme'; // <-- Import utility
import { FiUser, FiLock, FiBell, FiSave, FiMonitor, FiMoon, FiSun } from "react-icons/fi";
import './Settings.css';

const Settings = () => {
  // --- Theme sync on mount (optional, for consistency) ---
  useEffect(() => {
    applyThemeFromStorage();
  }, []);

  // 1. Initialize theme from localStorage so it remembers your choice
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  const [profile, setProfile] = useState({ 
    username: 'SuperAdmin', 
    email: 'admin@clicknest.com',
    role: 'Administrator'
  });
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [notifications, setNotifications] = useState(true);

  // 2. Apply theme to body AND save to localStorage whenever it changes
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleProfileChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Platform Settings</h1>
        <p>Manage your account preferences and security configuration.</p>
      </div>

      <div className="settings-grid">
        
        {/* Left Column: Profile */}
        <div className="settings-card profile-card">
          <div className="card-header">
            <FiUser className="card-icon" />
            <h3>Public Profile</h3>
          </div>
          
          <div className="profile-avatar-section">
            <div className="avatar-circle">
              {profile.username.charAt(0).toUpperCase()}
            </div>
            <div className="avatar-info">
              <h4>{profile.username}</h4>
              <span className="role-badge">{profile.role}</span>
            </div>
          </div>

          <div className="form-group">
            <label>Display Name</label>
            <input
              name="username"
              value={profile.username}
              onChange={handleProfileChange}
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              name="email"
              value={profile.email}
              onChange={handleProfileChange}
            />
          </div>

          <div className="card-actions">
            <button className="btn-primary">
              <FiSave style={{ marginRight: '8px' }} /> Save Profile
            </button>
          </div>
        </div>

        {/* Right Column: Security & Preferences */}
        <div className="right-column">
          
          {/* Preferences Card */}
          <div className="settings-card">
            <div className="card-header">
              <FiMonitor className="card-icon" />
              <h3>System Preferences</h3>
            </div>

            {/* THEME TOGGLE */}
            <div className="preference-item">
              <div className="pref-info">
                <div className="pref-title">
                  {theme === 'dark' ? <FiMoon style={{marginRight:'8px'}}/> : <FiSun style={{marginRight:'8px'}}/>}
                  Appearance
                </div>
                <div className="pref-desc">Switch between Dark and Light mode.</div>
              </div>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={theme === 'dark'} 
                  onChange={toggleTheme} 
                />
                <span className="slider round"></span>
              </label>
            </div>

            {/* NOTIFICATIONS TOGGLE */}
            <div className="preference-item">
              <div className="pref-info">
                <div className="pref-title"><FiBell style={{ marginRight: '8px' }}/> Email Notifications</div>
                <div className="pref-desc">Receive weekly digest reports via email.</div>
              </div>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={notifications} 
                  onChange={() => setNotifications(!notifications)} 
                />
                <span className="slider round"></span>
              </label>
            </div>
          </div>

          {/* Security Card */}
          <div className="settings-card">
            <div className="card-header">
              <FiLock className="card-icon" />
              <h3>Security</h3>
            </div>
            
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                name="current"
                value={passwords.current}
                onChange={handlePasswordChange}
                placeholder="••••••••"
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  name="new"
                  value={passwords.new}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                />
              </div>
              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  name="confirm"
                  value={passwords.confirm}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="card-actions">
              <button className="btn-secondary">Update Password</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Settings;
