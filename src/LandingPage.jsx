import React from 'react'
import { useEffect } from 'react'
import { supabase } from './supabase'
import Landingheader from './Landingheader'
import { useNavigate } from 'react-router-dom';
import "./LandingPage.css"
const LandingPage = () => {
  const navigate = useNavigate();

  async function verifyUser() {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error fetching user:', error);
        return;
      }
      // Safely get the 'user' from 'data' only if 'data' exists; otherwise get undefined.
// This prevents errors if 'data' is null or undefined.
// Extract the actual user object safely with optional chaining
 const user = data?.user;
     
      if (user && user.email_confirmed_at) {
        // Email verified, update registration table
        
        const { error: updateError } = await supabase
          .from('user')
          .update({verified: true })
          .eq('email', user.email);
         

        if (updateError) {
          console.error('Error updating verification status:', updateError);
        } else {
          
          alert("Email verified successfully! Please log in now.");
          navigate("/Login");
        }
      }
    }

    useEffect(() => {

      //adding check if email is already logged in instead of showing alert again and again

      const role = localStorage.getItem("role");
    const email = localStorage.getItem("userEmail");
    const name=localStorage.getItem("username");//this is only for admin for now 
    // 🔹 If user is already logged in, redirect to movie list page
    if (role === "user" && email) {
      navigate("/homepage");
      return;
    }
    if (role === "admin" && name)  {
      navigate("/adminpage");
      return;
    }
   
      
    
if(role!=="user" && role!=="admin")
    verifyUser();
  }, []);
function moveToLogin(){
  navigate("/Login");
}
  
  return (
    <div>
      <Landingheader />
    {/* somewhere css class undu section g av sari malpod */}
       <section className="watch-section" >
      <div className="watch-content">
        <h1>WHAT TO WATCH TONIGHT?</h1>
        <p>Movies rated by the people — for the people.</p>
        <button className="recommendation-btn" onClick={moveToLogin}>Get Recommendation</button>
      </div>
    </section>
    </div>
  )
}

export default LandingPage