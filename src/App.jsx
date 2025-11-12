import { useState } from 'react'
import Reg from './Reg'
import Login from './Login'
import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Reg />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
