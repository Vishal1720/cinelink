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
         localStorage.setItem("role", "admin");
         localStorage.setItem("username", adminData[0].name);
        localStorage.setItem("userimage", adminData[0].avatar_url);
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
   localStorage.setItem("role", "user");
   localStorage.setItem("userEmail", data2[0].email);
        localStorage.setItem("username", data2[0].name);
        localStorage.setItem("userimage", data2[0].avatar_url);
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

 <button
  type="button"
  className="google-btn"
  onClick={async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/google-callback",

      },
    });

    if (error) {
      setError(error.message);
    }
  }}
>
   <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
  Sign in with Google
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
