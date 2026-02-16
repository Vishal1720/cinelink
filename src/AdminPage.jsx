import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from './AdminHeader'
import AddMovies from "./AddMovies";
const AdminPage = () => {

  return (
    <div style={{display:"flex"}}>
    <AdminHeader/>
    <AddMovies/>
    </div>
  )
}

export default AdminPage