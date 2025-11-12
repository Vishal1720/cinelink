import { useState } from 'react'
import Reg from './Reg'
<<<<<<< HEAD
import Login from './Login'
=======
import LandingPage from './LandingPage'
>>>>>>> e34ed2129a8330d7c20e3afba6dc2cefb66e958b
import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
<<<<<<< HEAD
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Reg />} />
        </Routes>
      </BrowserRouter>
=======
 <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage/>} />
        <Route path="/signup" element={<Reg/>} />
        
      </Routes>
    </BrowserRouter>
       
>>>>>>> e34ed2129a8330d7c20e3afba6dc2cefb66e958b
    </>
  )
}

export default App
