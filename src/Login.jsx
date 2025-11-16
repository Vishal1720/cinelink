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

//   const hashPassword = async (password) => {
//   const enc = new TextEncoder().encode(password);
//   const buffer = await crypto.subtle.digest("SHA-256", enc);
//   return Array.from(new Uint8Array(buffer))
//     .map(b => b.toString(16).padStart(2, "0"))
//     .join("");
// };



const hashPassword = (password) => {
  return SHA256(password).toString();
};

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
         sessionStorage.setItem("role", "admin");
         sessionStorage.setItem("username", adminData[0].name);
    alert(`Welcome Admin, ${adminData[0].name}! you are a ${sessionStorage.getItem("role")}`);
    // Your AdminPage redirect logic here, e.g.:
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
   sessionStorage.setItem("role", "user");
        sessionStorage.setItem("username", data2[0].name);
        alert(`Welcome back, ${data2[0].name}! you are a ${sessionStorage.getItem("role")}`);
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
    </div>
  );
};

export default Login;
