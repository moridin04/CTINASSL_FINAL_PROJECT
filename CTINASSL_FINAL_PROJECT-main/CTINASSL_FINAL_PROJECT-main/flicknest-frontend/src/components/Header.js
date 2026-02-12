// src/components/Header.js

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import SearchBar from './SearchBar';
import '../styles/Header.css';

function Header({ user, onLoginClick, onSignupClick, onLogout, onSearchResults, onNavMoviesClick }) {
  const isAdmin = user && ['admin', 'super-admin'].includes(user.role);
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-brand">FlickNest</div>
        <div className="nav-search">
          <SearchBar onResults={onSearchResults} />
        </div>
        <div className="nav-menu">
          <Link className="nav-link" to="/">Home</Link>
          <Link
            className={`nav-link${location.pathname === "/movies" ? " active" : ""}`}
            to="/movies"
            onClick={onNavMoviesClick}
          >
            Movies
          </Link>
          {isAdmin && (
            <Link className="nav-link" to="/admin/dashboard">
              Admin Panel
            </Link>
          )}
          {!user ? (
            <>
              <button className="nav-btn" onClick={onLoginClick}>Login</button>
              <button className="nav-btn" onClick={onSignupClick}>Sign Up</button>
            </>
          ) : (
            <>
              <span className="nav-link">Welcome, {user.username}</span>
              <button className="nav-btn" onClick={onLogout}>Logout</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Header;
