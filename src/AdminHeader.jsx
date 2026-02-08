import React, { useState } from 'react';
import './AdminHeader.css';
import { useNavigate } from 'react-router-dom';
import { useLocation } from "react-router-dom";


const AdminHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
const defaultAvatar =
  "https://wiggitkoxqislzddubuk.supabase.co/storage/v1/object/public/AvatarBucket/defaultavatar.jpg";

const userimg= localStorage.getItem("userimage");
const imgSrc = userimg || defaultAvatar;
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const genre_caste = () => {
    setIsMenuOpen(false);
    navigate("/castgenre");
  };

  const movie_page = () => {
    setIsMenuOpen(false);
    navigate("/adminpage");
  };

  const user_analytics = () => {
    setIsMenuOpen(false);
    navigate("/useranalytics");
  };

  const dashboard = () => {
    setIsMenuOpen(false);
    navigate("/adminpage");
  };

  const reviews_page = () => {
  setIsMenuOpen(false);
  navigate("/admin-reviews");
};

  const banner = () => {
    setIsMenuOpen(false);
    navigate("/upload-banner");
  }

  const logout = () => {
    localStorage.clear();
    navigate("/Login");
  };
const location = useLocation();

// selecting tab when page change
const isActive = (path) =>
  location.pathname === path ? "active" : "";


  return (
    <>
      {/* Mobile Header */}
      <header className="mobile-header">
        <div className="mobile-logo">
          <img
            src={imgSrc}
            alt="admin panel logo"
            className="admin-logo-img"
          />
          <h2 className="admin-title">CineVerse Admin</h2>
        </div>
        <button className="admin-hamburger" onClick={toggleMenu}>
          <span className={`bar ${isMenuOpen ? 'open' : ''}`}></span>
          <span className={`bar ${isMenuOpen ? 'open' : ''}`}></span>
          <span className={`bar ${isMenuOpen ? 'open' : ''}`}></span>
        </button>
      </header>

      {/* Overlay */}
      {isMenuOpen && <div className="admin-overlay" onClick={toggleMenu}></div>}

      {/* Sidebar */}
      <aside className={`admin-panel ${isMenuOpen ? 'open' : ''}`}>
        <div className="admin-logo">
          <img
            src={imgSrc}
            alt="admin panel logo"
            className="admin-logo-img"
          />
          <div>
            <h2 className="admin-title">CineVerse Admin</h2>
            <p className="admin-subtitle">{localStorage.getItem("username")}</p>
          </div>
        </div>

        <nav className="nav-menu">
          <ul>
            <li>
              <button className={`admin-nav-item ${isActive("/upload-banner")}`} onClick={banner}>
              
                <span className="material-icons-round">campaign</span>

                Banner
              </button>
            </li>
            <li>
              <button className={`admin-nav-item ${isActive("/adminpage")}`} onClick={movie_page}>
                <span className="admin-icon">🎬</span>
                
                Movies
              </button>
            </li>
            <li>
              <button className={`admin-nav-item ${isActive("/useranalytics")}`} onClick={user_analytics}>
                <span className="admin-icon">👥</span>
                Users
              </button>
            </li>
           <li>
              <button
                 className={`admin-nav-item ${isActive("/admin-reviews")}`}
                  onClick={reviews_page}
                >
                  <span className="admin-icon">⭐</span>
                    Reviews
             </button>
            </li>

            <li>
              <button className={`admin-nav-item ${isActive("/castgenre")}`} onClick={genre_caste}>
                <span className="admin-icon">➕</span>
                Genre & Cast
              </button>
            </li>
          </ul>
        </nav>

        <button className="logout-btn" onClick={logout}>
          <span className="admin-icon">↩️</span>
          Logout
        </button>
      </aside>
    </>
  );
};

export default AdminHeader;