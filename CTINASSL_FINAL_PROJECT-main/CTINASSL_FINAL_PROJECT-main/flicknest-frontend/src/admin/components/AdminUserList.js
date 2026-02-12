// src/admin/components/AdminUserList.js

import React, { useEffect, useState } from 'react';
import { applyThemeFromStorage } from '../utils/theme';
import { FiEdit2, FiTrash2, FiLock, FiUserPlus, FiEye, FiEyeOff } from "react-icons/fi";
import {
  getAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
} from '../utils/api';
import './AdminUserList.css';

const AdminUserList = () => {
  useEffect(() => {
    applyThemeFromStorage();
  }, []);

  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    role: 'admin'
  });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // New state for toggling password visibility
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getAdminUsers();
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users');
    }
    setLoading(false);
  };

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      if (editId) {
        const user = users.find(u => u._id === editId);
        if (user && user.role === 'super-admin') {
          alert('Super Admin cannot be edited.');
          setEditId(null);
          setForm({ username: '', name: '', email: '', password: '', role: 'admin' });
          return;
        }
        await updateAdminUser(editId, {
          username: form.username,
          name: form.name,
          email: form.email,
          role: form.role
        });
        setEditId(null);
      } else {
        await createAdminUser(form);
      }
      setForm({ username: '', name: '', email: '', password: '', role: 'admin' });
      fetchUsers();
    } catch (err) {
      alert('Error saving user');
    }
  };

  const handleEdit = user => {
    if (user.role === 'super-admin') {
      alert('Super Admin cannot be edited.');
      return;
    }
    setEditId(user._id);
    setForm({
      username: user.username || '',
      name: user.name || '',
      email: user.email || '',
      password: '',
      role: user.role || 'admin',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async id => {
    const user = users.find(u => u._id === id);
    if (user.role === 'super-admin') {
      alert('Super Admin cannot be deleted.');
      return;
    }
    if (window.confirm('Delete this user?')) {
      await deleteAdminUser(id);
      fetchUsers();
    }
  };

  return (
    <div className="user-list-container">
      <header className="page-header">
        <h1>Users Management</h1>
        <p>Manage admin access and view registered users.</p>
      </header>

      <section className="form-card">
        <h3>{editId ? 'Edit User' : 'Add New Admin'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Username</label>
              <input 
                name="username"
                value={form.username}
                onChange={handleChange}
                required
                autoComplete="off"
              />
            </div>
            <div className="form-group">
              <label>Full Name</label>
              <input 
                name="name" 
                value={form.name} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input 
                name="email" 
                type="email" 
                value={form.email} 
                onChange={handleChange} 
                required 
              />
            </div>
            
            {!editId && (
              <div className="form-group">
                <label>Password</label>
                <div className="password-wrapper">
                  <input 
                    name="password" 
                    type={showPassword ? "text" : "password"} 
                    value={form.password} 
                    onChange={handleChange} 
                    required 
                  />
                  <button 
                    type="button" 
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Role</label>
              <select name="role" value={form.role} onChange={handleChange}>
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {editId ? <><FiEdit2 /> Update User</> : <><FiUserPlus /> Add Admin</>}
            </button>
            {editId && (
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => { 
                  setEditId(null); 
                  setForm({ username: '', name: '', email: '', password: '', role: 'admin' }); 
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="table-card">
        <h3>All Users</h3>
        {loading ? (
          <div className="loading-text">Loading users...</div>
        ) : (
          <div className="table-responsive">
            <table className="user-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Registered</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? users.map(u => (
                  <tr key={u._id}>
                    <td className="font-medium">{u.username}</td>
                    <td className="font-medium">{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge ${u.role === 'super-admin' ? 'badge-purple' : 'badge-blue'}`}>
                        {u.role === 'super-admin' ? 'Super Admin' : (u.role || 'User')}
                      </span>
                    </td>
                    <td className="text-muted">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="text-right">
                      {u.role === 'super-admin' ? (
                        <span className="locked-text"><FiLock /> Locked</span>
                      ) : (
                        <div className="action-buttons">
                          <button className="action-btn edit" onClick={() => handleEdit(u)}>
                            <FiEdit2 />
                          </button>
                          <button className="action-btn delete" onClick={() => handleDelete(u._id)}>
                            <FiTrash2 />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="empty-state">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminUserList;
