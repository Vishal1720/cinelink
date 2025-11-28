import React, { useState } from "react";
import "./Login.css";
import { Link,useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import Landingheader from "./Landingheader";
import SHA256 from "crypto-js/sha256";
const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
const navigate = useNavigate();

const hashPassword = (password) => {
  return SHA256(password).toString();
};

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);


  // 🔹 Handle input change
  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const togglePassword = () => {
  setShowPassword(!showPassword);
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
let pass=await hashPassword(formData.password);
       // Check admin table first
  const { data: adminData, error: adminError } = await supabase
    .from("admin")
    .select("*")
    .eq("email", formData.email)
    .eq("password",pass );

  if (adminError) {
    console.error("❌ Supabase admin error:", adminError.message);
    setError("Something went wrong. Please try again later.");
  } else if (adminData && adminData.length > 0) {
    // Admin found, redirect to AdminPage
    console.log("Admin login data:", adminData);
         sessionStorage.setItem("role", "admin");
         sessionStorage.setItem("username", adminData[0].name);
        sessionStorage.setItem("userimage", adminData[0].avatar_url);
    navigate("/adminpage");
  } else {
    // Not an admin, check user table
      const { data, error } = await supabase
        .from("user")
        .select("*")
        .eq("email", formData.email)
        .eq("password", pass);
    console.log("User login data1:", data);
      if (error) {
        console.error("❌ Supabase error:", error.message);
        setError("Something went wrong. Please try again later.");
      } else if (!data || data.length === 0) {
        setError("Invalid email or password.");
      } else {

        //checking if email is verified
        const { data:data2, error:error2 } = await supabase
        .from("user")
        .select("*")
        .eq("email", formData.email)
        .eq("password",pass)
        .eq("verified",true);
        
        console.log("User login data:", data2);
        if (error2) {
  console.error("Error querying user:", error2);
} else if (data2.length<1 ) {
  setError("Please verify your email before logging in.Check email for verification link.");
} else {
  console.log(data2);
   sessionStorage.setItem("role", "user");
        sessionStorage.setItem("username", data2[0].name);
        sessionStorage.setItem("userimage", data2[0].avatar_url);
        navigate("/movielistpage");
     
}  
      }
    }
    } catch (err) {
      console.error("⚠️ Unexpected error:", err);
      setError(`An unexpected error occurred.${err}`);
    }

    setLoading(false);
  };

  return (<div  >
  <Landingheader/>
    <div className="login-container loginbgcontainer"  style={{ marginTop:"10px",width:"100vw"}}>
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

        <div className="input-group password-group" style={{ position: "relative" }}>
  <label>Password</label>

  <input
    type={showPassword ? "text" : "password"}
    name="password"
    placeholder="Enter your password"
    value={formData.password}
    onChange={handleChange}
    style={{ paddingRight: "40px" }}
  />

  {/* Eye Icon */}
  <span
    onClick={togglePassword}
    style={{
      position: "absolute",
      right: "12px",
      top: "50px",
      cursor: "pointer",
      userSelect: "none"
    }}
  >
    {showPassword ? (
      // 👁 Visible Eye SVG
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        fill="#9ca3af"
        viewBox="0 0 24 24"
      >
        <path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7z M12 15a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
      </svg>
    ) : (
      // 👁 Closed Eye SVG
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        fill="#9ca3af"
        viewBox="0 0 24 24"
      >
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12zm10-1.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z"/>
      </svg>
    )}
  </span>
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
    </div>
  );
};

export default Login;
