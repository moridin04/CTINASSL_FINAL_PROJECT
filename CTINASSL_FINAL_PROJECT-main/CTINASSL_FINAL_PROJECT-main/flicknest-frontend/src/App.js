// /src/App.js

import React, { useState, useEffect } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Movies from "./pages/Movies";
import LoginModal from "./components/LoginModal";
import RegisterModal from "./components/RegisterModal";
import { login, register, logout as apiLogout } from "./admin/utils/api";
import "./styles/App.css";

// Admin imports
import AdminLogin from "./admin/pages/AdminLogin";
import AdminDashboard from "./admin/components/AdminDashboard";
import AdminMovieList from "./admin/components/AdminMovieList";
import AdminUserList from "./admin/components/AdminUserList";
import Settings from "./admin/components/Settings";
import Reports from "./admin/components/Reports";
import ProtectedRoute from "./admin/components/ProtectedRoute";
import AdminLayout from "./admin/components/AdminLayout";

function App() {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [user, setUser] = useState(null);

  // --- Search state ---
  const [searchResults, setSearchResults] = useState(null);

  // --- Login error state ---
  const [loginError, setLoginError] = useState("");
  // --- Register error state ---
  const [registerError, setRegisterError] = useState("");

  const location = useLocation();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  // --- LOGIN HANDLER ---
  const handleLogin = async (username, password, role) => {
    setLoginError("");
    try {
      let userData;
      if (role === "admin" || role === "super-admin") {
        userData = await login(username, password, role);
      } else {
        userData = await login(username, password);
      }
      setUser(userData.user);
      localStorage.setItem("user", JSON.stringify(userData.user));
      localStorage.setItem("token", userData.accessToken);
      setShowLogin(false);
    } catch (err) {
      const backendError =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Unknown error";
      setLoginError("Login failed: " + backendError);
    }
  };

  // --- REGISTER HANDLER ---
  const handleRegister = async (username, password, email) => {
    setRegisterError("");
    try {
      await register(username, password, email);
      setShowRegister(false);
      setShowLogin(true);
    } catch (err) {
      const backendError =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Unknown error";
      setRegisterError("Registration failed: " + backendError);
    }
  };

  // --- LOGOUT HANDLER ---
  const handleLogout = async () => {
    await apiLogout();
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  const isAdminRoute = location.pathname.startsWith("/admin");
  const showHeader = !isAdminRoute;

  // Reset search results when "Movies" is clicked
  const handleNavMoviesClick = () => {
    setSearchResults(null);
  };

  return (
    <div className="App">
      {showHeader && (
        <Header
          user={user}
          onLoginClick={() => setShowLogin(true)}
          onSignupClick={() => setShowRegister(true)}
          onLogout={handleLogout}
          onSearchResults={setSearchResults}
          onNavMoviesClick={handleNavMoviesClick}
        />
      )}

      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Hero />} />
        <Route
          path="/movies"
          element={<Movies searchResults={searchResults} />}
        />

        {/* Admin Login - full page, not modal */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Admin panel routes - no header */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={["admin", "super-admin"]}>
              <AdminLayout>
                <Routes>
                  <Route
                    path="dashboard"
                    element={<AdminDashboard onLogout={handleLogout} />}
                  />
                  <Route path="movies" element={<AdminMovieList />} />
                  <Route path="users" element={<AdminUserList />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="reports" element={<Reports />} />
                  <Route
                    path="*"
                    element={<Navigate to="dashboard" replace />}
                  />
                </Routes>
              </AdminLayout>
            </ProtectedRoute>
          }
        />
      </Routes>

      {/* User login modal */}
      {showLogin && (
        <LoginModal
          onClose={() => {
            setShowLogin(false);
            setLoginError(""); // clear error on close
          }}
          onSwitch={() => {
            setShowLogin(false);
            setShowRegister(true);
            setLoginError(""); // clear error on switch
          }}
          onLogin={handleLogin}
          error={loginError}
        />
      )}

      {/* User registration modal */}
      {showRegister && (
        <RegisterModal
          onClose={() => {
            setShowRegister(false);
            setRegisterError(""); // clear error on close
          }}
          onSwitch={() => {
            setShowRegister(false);
            setShowLogin(true);
            setRegisterError(""); // clear error on switch
          }}
          onRegister={handleRegister}
          error={registerError}
        />
      )}
    </div>
  );
}

export default App;
