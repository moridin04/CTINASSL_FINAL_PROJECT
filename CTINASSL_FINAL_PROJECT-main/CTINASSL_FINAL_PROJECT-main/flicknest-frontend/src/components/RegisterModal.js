// src/components/RegisterModal.js

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

const RegisterModal = ({ onClose, onSwitch, onRegister }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Success Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await onRegister(username, password, email);
      setSuccessMessage("Account created successfully!");
      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
        onClose();
        onSwitch();
      }, 1500);
    } catch (err) {
      const backendError =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Sign up failed';
      setError(backendError);
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
          <h2>Create Account</h2>
          <p>Sign up to explore and track your favorite movies and series.</p>
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
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <input
              type={showPass ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPass(!showPass)}
              tabIndex="-1"
            >
              {showPass ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          <div className="input-group">
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button className="modal-submit-btn" type="submit" disabled={loading}>
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>
        {error && <div className="modal-error-msg">{error}</div>}
        <div className="modal-footer">
          <p>
            Already have an account?{' '}
            <span className="modal-link-text" onClick={onSwitch}>Log in here</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterModal;
