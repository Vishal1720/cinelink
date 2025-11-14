import React, { useState } from "react";
import "./Login.css";
import { Link } from "react-router-dom";
import { supabase } from "./supabase";
import Landingheader from "./Landingheader";
const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });


  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);


  // 🔹 Handle input change
  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // 🔹 Input validation before submitting
  const validateForm = () => {
    const { email, password } = formData;

    if (!email.trim() || !password.trim()) {
      return "All fields are required.";
    }

    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address.";
    }

    // Password length validation
    if (password.length < 6) {
      return "Password must be at least 6 characters long.";
    }

    return null; // No errors
  };

  // 🔹 Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate input before sending request
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {

       // Check admin table first
  const { data: adminData, error: adminError } = await supabase
    .from("admin")
    .select("*")
    .eq("email", formData.email)
    .eq("password", formData.password);

  if (adminError) {
    console.error("❌ Supabase admin error:", adminError.message);
    setError("Something went wrong. Please try again later.");
  } else if (adminData && adminData.length > 0) {
    // Admin found, redirect to AdminPage
    alert(`Welcome Admin, ${adminData[0].name}!`);
    // Your AdminPage redirect logic here, e.g.:
    // navigate("/admin-page");
  } else {
    // Not an admin, check user table
      const { data, error } = await supabase
        .from("user")
        .select("*")
        .eq("email", formData.email)
        .eq("password", formData.password);

      if (error) {
        console.error("❌ Supabase error:", error.message);
        setError("Something went wrong. Please try again later.");
      } else if (!data || data.length === 0) {
        setError("Invalid email or password.");
      } else {
        alert(`Welcome back, ${data[0].name}!`);
      }
    }
    } catch (err) {
      console.error("⚠️ Unexpected error:", err);
      setError("An unexpected error occurred. Please try again.");
    }

    setLoading(false);
  };

  return (<>
  <Landingheader/>
    <div className="login-container">
      <div className="login-card">
        <h1 className="title">CineVerse</h1>
        <h3 className="subtitle">Welcome Back</h3>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Email</label>
            <input
              type="text"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="input-group password-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}

            />
          </div>

          {error && <p className="error-text">{error}</p>}

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="signup-text">
          Don’t have an account?{" "}
          <Link to="/Reg" className="signup-link">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
    </>
  );
};

export default Login;
