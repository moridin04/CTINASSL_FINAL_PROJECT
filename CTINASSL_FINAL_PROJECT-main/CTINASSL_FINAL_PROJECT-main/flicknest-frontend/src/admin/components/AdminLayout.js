// src/admin/components/AdminLayout.js

import React from 'react';
import Sidebar from './Sidebar';
import { useNavigate } from 'react-router-dom';
import { logout } from '../utils/api'; // Adjust path if needed

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout(); // This clears localStorage and calls backend
    navigate('/admin/login'); // Redirect to admin login
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#000000' }}>
      <Sidebar onLogout={handleLogout} />
      <main style={{ flex: 1, backgroundColor: '#000000' }}>
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
