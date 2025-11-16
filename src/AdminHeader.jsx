import React from 'react';
import './AdminHeader.css';

const AdminHeader = () => {
  return (
    <aside className="admin-panel">
      <div className="admin-logo">
        <img 
          src="https://via.placeholder.com/32" 
          alt="admin panel logo" 
          className="logo-img"
        />
        <div>
          <h2 className="admin-title">Admin Panel</h2>
          <p className="admin-subtitle">Content Management</p>
        </div>
      </div>

      <nav className="nav-menu">
        <ul>
          <li>
            <button className="nav-item">
              <span className="icon">📊</span>
              Dashboard
            </button>
          </li>
          <li>
            <button className="nav-item active">
              <span className="icon">🎬</span>
              Movies
            </button>
          </li>
          <li>
            <button className="nav-item">
              <span className="icon">👥</span>
              Users
            </button>
          </li>
          <li>
            <button className="nav-item">
              <span className="icon">⭐</span>
              Reviews
            </button>
          </li>
          <li>
            <button className="nav-item">
              <span className="icon">⚙️</span>
              Settings
            </button>
          </li>
        </ul>
      </nav>

      <button className="logout-btn">
        <span className="icon">↩️</span>
        Logout
      </button>
    </aside>
  );
};

export default AdminHeader;
