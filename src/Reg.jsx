import React from 'react'
import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Landingheader from './Landingheader'
import "./Reg.css"
const Reg = () => {
    const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmpassword:""
    })

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
      }
    
      const handleSubmit = (e) => {
        e.preventDefault()
        // Add form validation and submission logic here
        console.log(formData)
        console.log('Form submitted'+formData.email)
        insertUser()
      }

      
  
  const [error, setError] = useState(null)
  useEffect(() => {
    async function fetchUsers() {
      const { data, error } = await supabase
        .from('user') // replace with your actual table name
        .select('*')

      if (error) {
        setError(error.message)
        console.error('❌ Supabase error:', error.message)
      } else {
        
        console.log('✅ Supabase data:', data)
      }
    }

    fetchUsers()
  }, [])

   async function insertUser() {
    const newUser = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone ? Number(formData.phone) : null,
      password: formData.password
    }

    const { data, error } = await supabase
      .from('user')
      .insert([newUser])  // insert expects an array of objects

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
    confirmpassword:""
    })
    }
  }

  return (
    <><Landingheader></Landingheader>
     <div className="container" style={{marginTop:"50%",paddingBottom:"2%"}}>
    <h1>CineLink</h1>
    {/* <p className="subtitle">Join the ultimate movie community.</p> */}
    
    {/* <h2>Register Account</h2> */}

    <form onSubmit={handleSubmit} method="POST">
      <label htmlFor="fullname">Full Name</label>
      <input type="text" id="fullname"
      name='name'
       placeholder="Enter your full name" 
        value={formData.name}
        onChange={handleChange} required
/>

      <label htmlFor="email">Email Address</label>
      <input type="email" id="email" name="email" 
      value={formData.email}
        onChange={handleChange}
        placeholder="Enter your email address" />
<label htmlFor="phone">Phone Number</label>
      <input type="tel" id="phone" name="phone"
       placeholder="Enter your phone number"
       pattern="[0-9]{10}"
  title="Phone number must be exactly 10 digits"
        value={formData.phone}
        onChange={handleChange} required/>

      <label htmlFor="password">Password</label>
      <div className="password-wrapper">
        <input type="password"
        value={formData.password}
        onChange={handleChange} id="password" name="password"  placeholder="Enter your password" required/>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5zm0-8a3 3 0 0 0 0 6 3 3 0 0 0 0-6z"/></svg>
      </div>

      <label htmlFor="confirmpassword">Confirm Password</label>
      <div className="password-wrapper">
        <input type="password" id="confirmpassword"
         name="confirmpassword" placeholder="Confirm your password"
            value={formData.confirmpassword}
        onChange={handleChange}
          required />
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 5c-7 0-10 7-10 7s3 7 10 7 10-7 10-7-3-7-10-7zm0 12c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5zm0-8a3 3 0 0 0 0 6 3 3 0 0 0 0-6z"/></svg>
      </div>

      <button type="submit">Create Account</button>
    </form>

    <p className="footer-text">
      Already have an account? <a href="#">Login</a>
    </p>
  </div>
  </>
  )
}

export default Reg