import { useState } from "react";
import Reg from "./Reg";
import Login from "./Login";
import LandingPage from "./LandingPage";
import AdminPage from "./AdminPage";
import UserHeader from "./UserHeader";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import CastGenre from "./CastGenre";
import UserMovieListPage from "./UserMovieListPage";
function App() {
  

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage/>} />
        <Route path="/Login" element={<Login/>} />
        <Route path="/Reg" element={<Reg/>} />
          <Route path="/adminpage" element={<AdminPage/>} />
          <Route path="/castgenre" element={<CastGenre/>} />
          <Route path="/movielistpage" element={<UserMovieListPage/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
