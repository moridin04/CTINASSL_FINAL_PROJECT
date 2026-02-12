// src/components/LoginModal.js

import React, { useState } from 'react';
import { FiEye, FiEyeOff, FiX } from "react-icons/fi"; 
import '../styles/Modal.css';

// Success Modal Component
const SuccessModal = ({ message }) => (
  <div className="success-modal-overlay">
    <div className="success-modal">
      <div className="success-checkmark">✔</div>
      <div className="success-title">Success!</div>
      <div className="success-message">{message}</div>
    </div>
  </div>
);

const LoginModal = ({ onClose, onSwitch, onLogin, isAdmin = false, error }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Success Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isAdmin) {
        await onLogin(username, password, 'super-admin');
      } else {
        await onLogin(username, password);
      }
      setSuccessMessage("Login successful!");
      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
        onClose();
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      {showSuccessModal && <SuccessModal message={successMessage} />}
      <div className="modal-glass">
        <button className="modal-close-btn" onClick={onClose}><FiX /></button>
        <div className="modal-header">
          <h2>{isAdmin ? "Admin Portal" : "Welcome Back"}</h2>
          <p>Enter your credentials to access your account.</p>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="input-group">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="input-group">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex="-1"
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          <button className="modal-submit-btn" type="submit" disabled={loading}>
            {loading ? "Authenticating..." : (isAdmin ? "Login as Admin" : "Login")}
          </button>
        </form>
        {error && <div className="modal-error-msg">{error}</div>}
        {!isAdmin && (
          <div className="modal-footer">
            <p>
              Don't have an account?{' '}
              <span className="modal-link-text" onClick={onSwitch}>Sign up here</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginModal;
