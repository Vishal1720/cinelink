import { useState } from "react";
import Reg from "./Reg";
import Login from "./Login";
import LandingPage from "./LandingPage";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage/>} />
        <Route path="/Login" element={<Login/>} />
        <Route path="/Reg" element={<Reg/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
