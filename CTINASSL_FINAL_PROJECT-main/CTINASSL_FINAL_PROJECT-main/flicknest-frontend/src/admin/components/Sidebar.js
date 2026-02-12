// src/admin/components/Sidebar.js

import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiHome, FiFilm, FiUsers, FiSettings, FiFileText } from "react-icons/fi"; // Feather Icons
import './Sidebar.css';

const Sidebar = ({ onLogout }) => (
  <aside className="admin-sidebar">
    <div className="sidebar-logo">
      <img src={require('../../assets/logo.png')} alt="Logo" />
    </div>
    
    <nav className="sidebar-nav">
      <ul>
        <li>
          <NavLink to="/admin/dashboard">
            <FiHome style={{ marginRight: '10px' }} /> Dashboard
          </NavLink>
        </li>
        <li>
          <NavLink to="/admin/movies">
            <FiFilm style={{ marginRight: '10px' }} /> Movies List
          </NavLink>
        </li>
        <li>
          <NavLink to="/admin/users">
            <FiUsers style={{ marginRight: '10px' }} /> Users List
          </NavLink>
        </li>
        <li>
          <NavLink to="/admin/settings">
            <FiSettings style={{ marginRight: '10px' }} /> Settings
          </NavLink>
        </li>
        <li>
          <NavLink to="/admin/reports">
            <FiFileText style={{ marginRight: '10px' }} /> Reports
          </NavLink>
        </li>
      </ul>
    </nav>
    
    <div className="sidebar-footer">
      <button className="logout-btn" onClick={onLogout}>Logout</button>
    </div>
  </aside>
);

export default Sidebar;
