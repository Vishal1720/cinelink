import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import './UserHeader.css';
const UserHeader = () => {
  const role = sessionStorage.getItem("role");
  const navigate = useNavigate();
  
  if (role !== "user") {
    navigate("/Login");
  }
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);
  
  const defaultAvatar =
    "https://wiggitkoxqislzddubuk.supabase.co/storage/v1/object/public/AvatarBucket/defaultavatar.jpg";
  const storedImg = sessionStorage.getItem("userimage");

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleLogout = () => {
    // Clear session storage
    sessionStorage.clear();
    // Navigate to login page
    navigate("/Login");
  };

  const toggleLogoutMenu = () => {
    setShowLogoutMenu(!showLogoutMenu);
  };

  return (
    <>
      <header className="header">
        <div className="header-left">
          <div className="left-section">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              aria-hidden="true"
              focusable="false"
              className="logo-icon"
            >
              <g clipPath="url(#clip0)">
                <path
                  clipRule="evenodd"
                  d="M24 0.757355L47.2426 24L24 47.2426L0.757355 24L24 0.757355ZM21 35.7574V12.2426L9.24264 24L21 35.7574Z"
                  fill="currentColor"
                  fillRule="evenodd"
                />
              </g>
              <defs>
                <clipPath id="clip0">
                  <rect width="48" height="48" fill="white" />
                </clipPath>
              </defs>
            </svg>
            <span className="logo-text">CineVerse</span>
          </div>
          <button className="hamburger" onClick={toggleSidebar} aria-label="Toggle menu">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="hamburger-icon"
            >
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <nav className="nav-links">
          <Link to="/movielistpage" className="nav-link active">Home</Link>
          <Link to="/moviespage" className="nav-link">Movies</Link>
          <Link to="/seriespage" className="nav-link">Series</Link>
          <a href="#" className="nav-link">Lists</a>
        </nav>
        
        <div className="header-right">
          <div className="user-menu-container">
            <button
              className="user-avatar"
              onClick={toggleLogoutMenu}
              style={{
                backgroundImage: `url('${storedImg || defaultAvatar}')`,
              }}
              aria-label="User menu"
            ></button>
            
            {showLogoutMenu && (
              <div className="logout-menu">
                <button onClick={handleLogout} className="logout-button">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="logout-icon"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <button className="close-sidebar" onClick={closeSidebar} aria-label="Close menu">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="close-icon"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <Link to="/movielistpage" className="sidebar-link active" onClick={closeSidebar}>
            Home
          </Link>
          <Link to="/moviespage" className="sidebar-link" onClick={closeSidebar}>
            Movies
          </Link>
          <Link to="/seriespage" className="sidebar-link" onClick={closeSidebar}>
            Series
          </Link>
          
          <button onClick={handleLogout} className="sidebar-logout-button">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="logout-icon"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Logout
          </button>
        </nav>
      </div>
    </>
  );
};

export default UserHeader;