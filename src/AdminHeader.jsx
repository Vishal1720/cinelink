import React, { useState } from 'react';
import './AdminHeader.css';
import { useNavigate } from 'react-router-dom';
const AdminHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
const navigate = useNavigate();
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const logout = () => {
    sessionStorage.clear();

    navigate("/Login");
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="mobile-header">
        <div className="mobile-logo">
          <img 
            src="https://via.placeholder.com/32" 
            alt="admin panel logo" 
            className="logo-img"
          />
          <h2 className="admin-title">CineVerse Admin</h2>
        </div>
        <button className="hamburger" onClick={toggleMenu}>
          <span className={`bar ${isMenuOpen ? 'open' : ''}`}></span>
          <span className={`bar ${isMenuOpen ? 'open' : ''}`}></span>
          <span className={`bar ${isMenuOpen ? 'open' : ''}`}></span>
        </button>
      </header>

      {/* Overlay */}
      {isMenuOpen && <div className="overlay" onClick={toggleMenu}></div>}

      {/* Sidebar */}
      <aside className={`admin-panel ${isMenuOpen ? 'open' : ''}`}>
        <div className="admin-logo">
          <img 
            src="https://wiggitkoxqislzddubuk.supabase.co/storage/v1/object/public/AvatarBucket/defaultavatar.jpg" 
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
              <button className="nav-item" onClick={toggleMenu}>
                <span className="icon">📊</span>
                Dashboard
              </button>
            </li>
            <li>
              <button className="nav-item active" onClick={toggleMenu}>
                <span className="icon">🎬</span>
                Movies
              </button>
            </li>
            <li>
              <button className="nav-item" onClick={toggleMenu}>
                <span className="icon">👥</span>
                Users
              </button>
            </li>
            <li>
              <button className="nav-item" onClick={toggleMenu}>
                <span className="icon">⭐</span>
                Reviews
              </button>
            </li>
            <li>
              <button className="nav-item" onClick={toggleMenu}>
                <span className="icon">⚙️</span>
                Settings
              </button>
            </li>
          </ul>
        </nav>

        <button className="logout-btn" onClick={logout}>
          <span className="icon">↩️</span>
          Logout
        </button>
      </aside>
    </>
  );
};

export default AdminHeader;