import { useState } from 'react'
import Reg from './Reg'
import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
function App() {
  const [count, setCount] = useState(0)

  return (
    <>
 <BrowserRouter>
      <Routes>
        <Route path="/" element={<Reg/>} />
        
      </Routes>
    </BrowserRouter>
       
    </>
  )
}

export default App
