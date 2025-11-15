import React from 'react'

import Landingheader from './Landingheader'
import "./LandingPage.css"
const LandingPage = () => {
  return (
    <div>
      <Landingheader />
    {/* somewhere css class undu section g av sari malpod */}
       <section className="watch-section" >
      <div className="watch-content">
        <h1>WHAT TO WATCH TONIGHT?</h1>
        <p>Movies rated by the people — for the people.</p>
        <button className="recommendation-btn">Get Recommendation</button>
      </div>
    </section>
    </div>
  )
}

export default LandingPage