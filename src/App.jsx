import { useState } from "react";
import Reg from "./Reg";
import Login from "./Login";
import LandingPage from "./LandingPage";
import AdminPage from "./AdminPage";

import MovieDetails from "./MovieDetails";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import CastGenre from "./CastGenre";
import UserMovieListPage from "./UserMovieListPage";
import ReviewsSection from "./ReviewsSection";
function App() {
  

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/morie" element={<ReviewsSection movieId={15} />} />
        <Route path="/" element={<LandingPage/>} />
        <Route path="/Login" element={<Login/>} />
        <Route path="/Reg" element={<Reg/>} />
             <Route path="/movielistpage" element={<UserMovieListPage />} />
       
         <Route path="/seriespage" element={<UserMovieListPage type="Series"/>} />
          <Route path="/moviespage" element={<UserMovieListPage type="Movie"/>} />
{/*    admin routes below */}
          <Route path="/adminpage" element={<AdminPage/>} />
          <Route path="/castgenre" element={<CastGenre/>} />
          <Route path="/movie/:id" element={<MovieDetails/>} />
         
      </Routes>
    </BrowserRouter>
  );
}

export default App;
