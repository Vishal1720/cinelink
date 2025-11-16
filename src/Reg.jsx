import React from 'react'
import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Landingheader from './Landingheader'
import { Link } from "react-router-dom";
import "./Reg.css"
import { useNavigate } from 'react-router-dom';
const Reg = () => {
  const navigate = useNavigate();
const [imageFile, setImageFile] = useState(null);
const [registering, setRegistering] = useState(false);
const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmpassword:"",
    avatar_url: ""
  });

  const hashPassword = async (password) => {
  const enc = new TextEncoder().encode(password);
  const buffer = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
};

  function validatePassword(password) {
  const rules = [];

  if (password.length < 8)
    rules.push("Password must be at least 8 characters");

  if (!/[A-Z]/.test(password))
    rules.push("Password must include at least 1 uppercase letter");

  if (!/[a-z]/.test(password))
    rules.push("Password must include at least 1 lowercase letter");

  if (!/[0-9]/.test(password))
    rules.push("Password must include at least 1 number");

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
    rules.push("Password must include at least 1 special character");

  return rules;
}


async function uploadImageAndInsertUser() {
  setRegistering(true);
  let imageUrl = "https://wiggitkoxqislzddubuk.supabase.co/storage/v1/object/public/AvatarBucket/defaultavatar.jpg";  // 👈 default value if no image

  // 1️⃣ If user selected an image → Upload to Supabase
  if (imageFile) {
    const fileName = `${Date.now()}_${imageFile.name}`;

    const { data: uploaded, error: uploadError } = await supabase.storage
      .from("AvatarBucket")
      .upload(`profiles/${fileName}`, imageFile);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      setError(uploadError.message);
      return;
    }

    // 2️⃣ Get public URL of uploaded image
    const { data: urlData } = supabase.storage
      .from("AvatarBucket")
      .getPublicUrl(`profiles/${fileName}`);

    imageUrl = urlData.publicUrl;
  }
const hashed = await hashPassword(formData.password);

  // 3️⃣ Insert user details with imageUrl (could be NULL or actual URL)
  const newUser = {
    name: formData.name,
    email: formData.email,
    phone: formData.phone ? Number(formData.phone) : null,
    password:hashed,
    avatar_url: imageUrl,   // 👈 will be default one OR uploaded URL
  };

  const { data, error } = await supabase
    .from("user")
    .insert([newUser]);


  if (error) {
    console.error("Insert error:", error);
    setError(error.message);
  } else {
    // console.log("User inserted:", data);
    // Sign up user via Supabase Auth triggering verification email
const { data3, error3 } = await supabase.auth.signUp({
  email: formData.email,
  password: hashed,
});

alert("Registration successful! Please check your email to verify your account.");
navigate("/Login");
    // Clear form
    setFormData({
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmpassword: "",
      avatar_url: ""
    });

    setImageFile(null);
setRegistering(false);

  }
}


  

  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  };

  const handleSubmit = (e) => {
  e.preventDefault();

  // password rules validation
  const validationErrors = validatePassword(formData.password);
  if (validationErrors.length > 0) {
    setPasswordError("❌ " + validationErrors.join(", "));
    return;
  }

  // confirm password check
  if (formData.password !== formData.confirmpassword) {
    setPasswordError("❌ Passwords do not match");
    return;
  }

  setPasswordError("");
  uploadImageAndInsertUser();
};


  return (
    <div className='regformcontainer' >
      <Landingheader />

      <div className="container">
        {/* <h1>CineLink</h1> */}
      
        <form onSubmit={handleSubmit} method="POST">
<div className="avatar-upload">
  <label htmlFor="avatarInput">
    <img
      src={
        imageFile
          ? URL.createObjectURL(imageFile)
          : "https://wiggitkoxqislzddubuk.supabase.co/storage/v1/object/public/AvatarBucket/defaultavatar.jpg"
      }
      alt="avatar"
      className="avatar-image"
    />
  </label>

  <input
    type="file"
    id="avatarInput"
    accept="image/*"
    onChange={(e) => setImageFile(e.target.files[0])}
    style={{ display: "none" }}
  />
</div>

          <label className='reglabel' htmlFor="fullname">Name</label>
          <input type="text" id="fullname"
            name='name'
            placeholder="Enter your name"
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

          <button type="submit" className='register-btn'>
            {registering ? "Registering..." : "Register"}</button>
        </form>

        <p className="footer-text">
          Already have an account? <Link style={{ color: "#3b82f6" }} to="/Login">Login</Link>
        </p>

      </div>
    </div>
  )
}

export default Reg
