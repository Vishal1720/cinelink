import React from 'react';
import './Landingheader.css';
import Reg from "./Reg";
import Login from "./Login"; 
import { Link } from 'react-router-dom';
import { useNavigate } from "react-router-dom";

const Landingheader = () => {
const navigate = useNavigate();

      const handlesigninClick = () => {
    navigate("/Login");  // manually go to /community route
  };

  const navigateToLanding = () => {
    navigate("/");  // manually go to /community route
  }
   const handlesignupClick = () => {
    navigate("/Reg");  // manually go to /community route
  };

  return (
    <header className="cineverse-header">
      <div className="left-section" onClick={navigateToLanding}>
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

      <nav className="navigation" role="navigation" aria-label="Primary Navigation">
        <Link to="/" style={{color:"white",marginTop:"12px"}}>Home</Link>
        
      </nav>

      <div className="auth-buttons">
        <button className="btn signin-btn" type="button" onClick={handlesignupClick}>
          Sign Up
        </button>
        <button className="btn signin-btn" type="button" onClick={handlesigninClick}>
          Login
        </button>
      </div>
    </header>
  );
};

export default Landingheader;
