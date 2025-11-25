import React from "react";
import "./UserHeader.css";

const UserHeader = () => {
  return (
    <header className="header">
      <div className="header-left">
        <div className="left-section" >
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
      
      </div>
      <nav className="nav-links">
        <a href="#" className="nav-link active">Home</a>
        <a href="#" className="nav-link">Discover</a>
        <a href="#" className="nav-link">Community</a>
        <a href="#" className="nav-link">Lists</a>
      </nav>
      <div className="header-right">
        <button
          className="user-avatar"
          style={{
            backgroundImage:
              "url('https://wiggitkoxqislzddubuk.supabase.co/storage/v1/object/public/AvatarBucket/defaultavatar.jpg')",
          }}
        ></button>
      </div>
    </header>
  );
};

export default UserHeader;
