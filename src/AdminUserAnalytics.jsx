import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';
import './AdminUserAnalytics.css';
import AdminHeader from './AdminHeader';
const AdminUserAnalytics = () => {
  const [users, setUsers] = useState([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [topReviewer, setTopReviewer] = useState(null);
  const [topLiked, setTopLiked] = useState(null);

  const totalReviewsSum = users.reduce(
  (sum, user) => sum + user.total_reviews,
  0
);

const totalMasterpiece = users.reduce(
  (sum, u) => sum + (u.masterpiece || 0),
  0
);

const totalAmazing = users.reduce(
  (sum, u) => sum + (u.amazing || 0),
  0
);



const sentimentBalance =
  totalReviewsSum > 0
    ? (((totalMasterpiece + totalAmazing) / totalReviewsSum) * 100).toFixed(1)
    : 0;

  useEffect(() => {
    const fetchUserAnalytics = async () => {
      const { data, error } = await supabase
        .from('user_analytics')
        .select('*')
        .order('review_score', { ascending: false });

      if (error) {
        console.error(error);
      } else {
        console.log(data);
        setUsers(data);
        
        // Calculate top reviewer and most liked
        if (data.length > 0) {
          const mostReviews = [...data].sort((a, b) => b.total_reviews - a.total_reviews)[0];
          setTopReviewer(mostReviews);
          
          const mostLiked = [...data].sort((a, b) => b.likes_received - a.likes_received)[0];
          setTopLiked(mostLiked);
        }
      }
      
    };

    fetchUserAnalytics();
  }, []);

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  

  return (<div style={{display:"flex"}}>
    <AdminHeader />
    <div className="admin-analytics">
        
      <div className="analytics-gradient-bg"></div>
      
      <div className="analytics-container">
        {/* Header */}
        <div className="analytics-header">
          <div className="breadcrumb">
            <a href="#">Admin</a>
            <span>/</span>
            <span>Review Analytics</span>
          </div>
          
          <div className="header-content">
            <div className="header-text">
              <h2>USER REVIEW ANALYTICS</h2>
              <p>Detailed breakdown of user engagement and sentiment patterns across the platform.</p>
            </div>
            
          
          </div>
        </div>

        {/* Top Highlights */}
        <div className="highlights-grid">
          {topReviewer && (
            <div className="highlight-card card-purple">
              <h3>Most Prolific Reviewer</h3>
              <div className="highlight-content">
                <img src={topReviewer.avatar_url} alt={topReviewer.name} className="highlight-avatar" />
                <div>
                  <p className="highlight-name">{topReviewer.name}</p>
                  <p className="highlight-stat purple-text">{topReviewer.total_reviews} Reviews Submitted</p>
                </div>
              </div>
            </div>
          )}

          {topLiked && (
            <div className="highlight-card card-amber">
              <h3>Highest Liked Reviewer</h3>
              <div className="highlight-content">
                <img src={topLiked.avatar_url} alt={topLiked.name} className="highlight-avatar" />
                <div>
                  <p className="highlight-name">{topLiked.name}</p>
                  <p className="highlight-stat amber-text">{topLiked.likes_received.toLocaleString()} Likes Received</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <p className="stat-label">Total Users</p>
            <p className="stat-value">{users.length.toLocaleString()}</p>
            {/* <div className="stat-badge badge-green">
              <span>📈</span>
              <span>+5% this week</span>
            </div> */}
          </div>

          <div className="stat-card">
            <p className="stat-label">Sentiment Balance</p>
            <p className="stat-value">{sentimentBalance}% </p>
            <div className="stat-badge badge-green">
              <span>↗️</span>
              <span>Positive Trend</span>
            </div>
          </div>

          <div className="stat-card">
            <p className="stat-label">Reviews </p>
            <p className="stat-value">{totalReviewsSum}</p>
            <div className="stat-badge badge-blue">
              <span>⚡</span>
              <span>High Activity</span>
            </div>
          </div>

          {topReviewer && (
            <div className="stat-card">
              <p className="stat-label">Top Contributor</p>
              <div className="top-contributor">
                <img src={topReviewer.avatar_url} alt={topReviewer.name} />
                <p>@{topReviewer.email.split('@')[0]}</p>
              </div>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="search-wrapper">
          <div className="search-container">
            
            <input
              type="text"
              placeholder="🔍Search by username, email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Table */}
        <div className="analytics-table-wrapper">
          <div className="analytics-table">
            <div className="table-header">
              <span className="col-user">User Profile</span>
              <span className="col-center">Total Reviews</span>
              <span className="col-center text-amber">Masterpiece</span>
              <span className="col-center text-blue">Amazing</span>
              <span className="col-center">One Time</span>
              <span className="col-center text-red">Unbearable</span>
              <span className="col-engagement">Engagement Stats</span>
              <span className="col-center col-score">Review Score</span>
            </div>

            <div className="table-body">
              {filteredUsers.map(user => (
                <div className="table-row" key={user.email}>
                  <div className="user-cell">
                    <img src={user.avatar_url} alt={user.name} className="user-avatar" />
                    <div className="user-info">
                      <strong>{user.name}</strong>
                      <small>{user.email}</small>
                    </div>
                  </div>

                  <div className="col-center" data-label="Total Reviews">
                    <span className="badge">{user.total_reviews}</span>
                  </div>

                  <div className="col-center" data-label="Masterpiece">
                    <span className="value-bold">{user.masterpiece}</span>
                  </div>

                  <div className="col-center" data-label="Amazing">
                    <span className="value-normal">{user.amazing}</span>
                  </div>

                  <div className="col-center" data-label="One Time">
                    <span className="value-muted">{user.one_time}</span>
                  </div>

                  <div className="col-center" data-label="Unbearable">
                    {user.unbearable > 50 ? (
                      <span className="badge-danger">{user.unbearable}</span>
                    ) : (
                      <span className="value-muted">{user.unbearable}</span>
                    )}
                  </div>

                  <div className="engagement-cell">
                    <div className="engagement-stat">
                      <span className="engagement-label">
                        <span>👍Received:{user.likes_received >= 1000 
                          ? `${(user.likes_received / 1000).toFixed(1)}k`
                          : user.likes_received
                        }</span>

                      </span>
                     <span className="engagement-label">
                        <span>💗Given:{user.likes_given >= 1000 
                          ? `${(user.likes_given / 1000).toFixed(1)}k`
                          : user.likes_given
                        }</span>
                        
                      </span>
                    </div>
                  </div>

                  <div className="col-center score-cell">
                    <span className="score-value">{user.review_score.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination */}
          {/*<div className="table-pagination">
            <div className="pagination-info">
              Showing <span className="text-white">1</span> to{' '}
              <span className="text-white">{Math.min(filteredUsers.length, 10)}</span> of{' '}
              <span className="text-white">{filteredUsers.length}</span> results
            </div>
             <div className="pagination-controls">
              <button className="pagination-btn" disabled>
                <span>‹</span>
              </button>
              <button className="pagination-btn active">1</button>
              <button className="pagination-btn">2</button>
              <button className="pagination-btn">3</button>
              <span className="pagination-dots">...</span>
              <button className="pagination-btn">24</button>
              <button className="pagination-btn">
                <span>›</span>
              </button>
            </div> 
          </div>*/}
        </div>
      </div>
    </div>
    </div>
  );
};

export default AdminUserAnalytics;