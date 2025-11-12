import { useState } from 'react'
import Reg from './Reg'
import LandingPage from './LandingPage'
import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
function App() {
  const [count, setCount] = useState(0)

  return (
    <>
 <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage/>} />
        <Route path="/signup" element={<Reg/>} />
        
      </Routes>
    </BrowserRouter>
       
    </>
  )
}

export default App
