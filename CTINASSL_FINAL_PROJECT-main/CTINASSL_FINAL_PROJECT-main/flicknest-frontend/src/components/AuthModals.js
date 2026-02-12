// src/components/AuthModals.js

import React, { useState } from "react";
import RegisterModal from "./RegisterModal";
import LoginModal from "./LoginModal";
import { register, login } from "../api/auth"; // Adjust import path as needed

const AuthModals = ({ setUser }) => {
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  // Registration handler
  const handleRegister = async (username, password, email) => {
    try {
      await register(username, password, email);
      setShowRegister(false); // Close registration modal
      setShowLogin(true); // Open login modal
      // Optionally show a toast: "Registration successful! Please log in."
    } catch (err) {
      throw err; // Error handled in RegisterModal
    }
  };

  // Login handler
  const handleLogin = async (username, password) => {
    try {
      const data = await login(username, password);
      setUser(data.user); // Set logged-in user in parent/app state
      localStorage.setItem("token", data.accessToken); // Store token
      setShowLogin(false); // Close login modal
    } catch (err) {
      throw err; // Error handled in LoginModal
    }
  };

  return (
    <>
      {/* Trigger buttons, or show modals based on state */}
      <button onClick={() => setShowRegister(true)}>Register</button>
      <button onClick={() => setShowLogin(true)}>Login</button>

      {showRegister && (
        <RegisterModal
          onClose={() => setShowRegister(false)}
          onSwitch={() => {
            setShowRegister(false);
            setShowLogin(true);
          }}
          onRegister={handleRegister}
        />
      )}

      {showLogin && (
        <LoginModal
          onClose={() => {
            setShowLogin(false);
            setLoginError("");
          }}
          onSwitch={() => {
            setShowLogin(false);
            setShowRegister(true);
            setLoginError("");
          }}
          onLogin={handleLogin}
          error={loginError}
        />
      )}
    </>
  );
};

export default AuthModals;
