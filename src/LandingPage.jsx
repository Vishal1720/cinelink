import React from 'react'

import Landingheader from './Landingheader'
import "./LandingPage.css"
const LandingPage = () => {
  return (
    <div>
      <Landingheader />
    {/* somewhere css class undu section g av sari malpod */}
       <section className="watch-section" style={{marginLeft:"-70px"}} >
      <div className="watch-content">
        <h1>WHAT TO WATCH TONIGHT?</h1>
        <p>Get an instant recommendation tailored just for you.</p>
        <button className="recommendation-btn">Get Recommendation</button>
      </div>
    </section>
    </div>
  )
}

export default LandingPage