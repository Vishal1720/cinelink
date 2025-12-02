import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from './AdminHeader'
import AddMovies from "./AddMovies";
const AdminPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Get the user's role stored in localStorage
    const role = localStorage.getItem("role");

    // If role is not "admin" OR role does not exist,
    // the user is not allowed to access this page.
    // So redirect them to the login page.
    if (role !== "admin") {
      
      navigate("/Login");
    }
  }, [navigate]); // dependency ensures navigate is available


  return (
    <div style={{display:"flex"}}>
    <AdminHeader/>
    <AddMovies/>
    </div>
  )
}

export default AdminPage