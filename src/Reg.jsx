import React from 'react'
import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Landingheader from './Landingheader'
import { Link } from "react-router-dom";
import "./Reg.css"

const Reg = () => {

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmpassword:""
  });

  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmpassword) {
      setPasswordError("❌ Passwords do not match");
      return;
    }

    setPasswordError("");
    insertUser();
  };

  useEffect(() => {
    async function fetchUsers() {
      const { data, error } = await supabase
        .from('user')
        .select('*')

      if (error) {
        setError(error.message)
        console.error('❌ Supabase error:', error.message)
      } else {
        console.log('✅ Supabase data:', data)
      }
    }

    fetchUsers()
  }, []);

  async function insertUser() {
    const newUser = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone ? Number(formData.phone) : null,
      password: formData.password
    }

    const { data, error } = await supabase
      .from('user')
      .insert([newUser])

    if (error) {
      setError(error.message)
      console.error('❌ Insert error:', error.message)
    } else {
      console.log('✅ Inserted:', data)
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmpassword: ""
      })
    }
  }

  return (
    <>
      <Landingheader />

      <div className="container" style={{ marginTop: "50%", paddingBottom: "2%" }}>
        <h1>CineLink</h1>

        <form onSubmit={handleSubmit} method="POST">

          <label className='reglabel' htmlFor="fullname">Full Name</label>
          <input type="text" id="fullname"
            name='name'
            placeholder="Enter your full name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <label className='reglabel' htmlFor="email">Email Address</label>
          <input type="email" id="email" name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email address"
            required
          />

          <label className='reglabel' htmlFor="phone">Phone Number</label>
          <input type="tel" id="phone" name="phone"
            placeholder="Enter your phone number"
            pattern="[0-9]{10}"
            title="Phone number must be exactly 10 digits"
            value={formData.phone}
            onChange={handleChange}
            required
          />

          {/* PASSWORD */}
          <label className='reglabel' htmlFor="password">Password</label>
          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
            />

            <svg
              onClick={() => setShowPassword(!showPassword)}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="eye-icon"
              style={{right:"17px",top:"20px"}}
            >
              {showPassword ? (
                <path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7z M12 15a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" />
              ) : (
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12zm10-1.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z" />
              )}
            </svg>
          </div>

          {/* CONFIRM PASSWORD */}
          <label className='reglabel' htmlFor="confirmpassword">Confirm Password</label>
          <div className="password-wrapper">
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmpassword"
              name="confirmpassword"
              placeholder="Confirm your password"
              value={formData.confirmpassword}
              onChange={handleChange}
              required
            />

            <svg
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="eye-icon"
              style={{right:"17px",top:"20px"}}
            >
              {showConfirmPassword ? (
                <path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7z M12 15a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" />
              ) : (
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12zm10-1.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z" />
              )}
            </svg>
          </div>

          {passwordError && (
            <p style={{ color: "red", fontSize: "14px", marginTop: "5px" }}>
              {passwordError}
            </p>
          )}

          <button type="submit" className='register-btn'>Create Account</button>
        </form>

        <p className="footer-text">
          Already have an account? <Link style={{ color: "#3b82f6" }} to="/Login">Login</Link>
        </p>

      </div>
    </>
  )
}

export default Reg
