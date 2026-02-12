import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import './UserHeader.css';
import { supabase } from "./supabase";

const UserHeader = () => {
  const role = localStorage.getItem("role");
  const navigate = useNavigate();
  const location = useLocation();
  
  if (role !== "user") {
    navigate("/Login");
  }
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Ref for click outside detection
  const menuRef = useRef(null);
  
  const isActive = (path) => location.pathname === path ? "active" : "";

  const defaultAvatar =
    "https://wiggitkoxqislzddubuk.supabase.co/storage/v1/object/public/AvatarBucket/defaultavatar.jpg";
  const storedImg = localStorage.getItem("userimage");
  const userName = localStorage.getItem("username") || "User";

  // Fetch unread notification count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        // Get current session from Supabase
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error fetching session:', sessionError);
          return;
        }

        if (!session?.user?.email) {
          console.log('No user email found in session');
          navigate('/Login');
          return;
        }

        const userEmail = session.user.email;

        // Fetch unread notifications
        const { data, error } = await supabase
          .from('notification')
          .select('id', { count: 'exact' })
          .eq('email', userEmail)
          .eq('status', 'unread');

        if (error) {
          console.error('Error fetching notifications:', error);
        } else {
          console.log('Unread notifications count:', data?.length || 0);
          setUnreadCount(data?.length || 0);
        }
      } catch (err) {
        console.error('Error:', err);
      }
    };

    fetchUnreadCount();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowLogoutMenu(false);
      }
    };

    if (showLogoutMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLogoutMenu]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleLogout = () => {
    localStorage.clear();
    supabase.auth.signOut();
    navigate("/Login");
  };

  const toggleLogoutMenu = () => {
    setShowLogoutMenu(!showLogoutMenu);
  };

  const handleProfileClick = () => {
    setShowLogoutMenu(false);
    navigate("/profile");
  };

  const handleNotificationClick = () => {
    navigate("/usernotifications");
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
          <Link to="/homepage" className={`nav-link ${isActive('/homepage')}`}>Home</Link>
          <Link to="/movielistpage" className={`nav-link ${isActive('/movielistpage')}`}>Discover</Link>
          <Link to="/recommendations" className={`nav-link ${isActive('/recommendations')}`}>Recommendations</Link>
          <Link to="/watchlist" className={`nav-link ${isActive('/watchlist')}`}>Watchlist</Link>
        </nav>
        
        <div className="header-right">
          {/* Notification Icon */}
          <button 
            className="notification-icon-button" 
            onClick={handleNotificationClick}
            aria-label="Notifications"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="notification-bell-svg"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            {unreadCount > 0 && (
              <span className="notification-count-badge">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          <div className="user-menu-container" ref={menuRef}>
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
                {/* Profile Button */}
                <button onClick={handleProfileClick} className="logout-button">
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
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  Profile
                </button>
                
                {/* Logout Button */}
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
          <Link to="/homepage" className={`sidebar-link ${isActive('/homepage')}`} onClick={closeSidebar}>Home</Link>
          <Link to="/movielistpage" className={`sidebar-link ${isActive('/movielistpage')}`} onClick={closeSidebar}>Discover</Link>
          <Link to="/recommendations" className={`sidebar-link ${isActive('/recommendations')}`} onClick={closeSidebar}>Recommendations</Link>
          <Link to="/watchlist" className={`sidebar-link ${isActive('/watchlist')}`} onClick={closeSidebar}>
            Watchlist
          </Link>
          
          {/* Profile in Sidebar */}
          <Link to="/profile" className={`sidebar-link ${isActive('/profile')}`} onClick={closeSidebar}>
            Profile
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