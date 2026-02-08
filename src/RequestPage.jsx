import React, { useState, useEffect } from 'react';
import { supabase } from './supabase.js';
import { useNavigate } from 'react-router-dom';
import AdminHeader from './AdminHeader';
import './RequestPage.css';

const RequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();
  const itemsPerPage = 6;

  useEffect(() => {
    fetchRequests();
  }, [currentPage, searchQuery]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('movie_req')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.or(`subject.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,desc.ilike.%${searchQuery}%`);
      }

      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data, error, count } = await query.range(from, to);

      if (error) throw error;

      setRequests(data || []);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (request) => {
    try {
      // Delete the request
      const { error: deleteError } = await supabase
        .from('movie_req')
        .delete()
        .eq('id', request.id);

      if (deleteError) throw deleteError;

      // Navigate to admin page with request data
      navigate('/adminpage', { 
        state: { 
          movieData: {
            title: request.subject
          }
        }
      });
    } catch (error) {
      console.error('Error accepting request:', error);
      alert('Failed to accept request');
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Are you sure you want to reject this request?')) return;

    try {
      const { error } = await supabase
        .from('movie_req')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Refresh the list
      fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this request permanently?')) return;

    try {
      const { error } = await supabase
        .from('movie_req')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Refresh the list
      fetchRequests();
    } catch (error) {
      console.error('Error deleting request:', error);
      alert('Failed to delete request');
    }
  };

  const getInitials = (email) => {
    if (!email) return 'U';
    const parts = email.split('@')[0].split('.');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const created = new Date(timestamp);
    const diffInSeconds = Math.floor((now - created) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  };

  const getColorClass = (index) => {
    const colors = ['req-yellow', 'req-rose', 'req-blue', 'req-yellow', 'req-purple'];
    return colors[index % colors.length];
  };

  const getAvatarColor = (index) => {
    const colors = [
      'from-indigo-500 to-purple-600',
      'from-rose-500 to-orange-500',
      'from-blue-500 to-cyan-500',
      'from-green-500 to-teal-500',
      'from-gray-600 to-gray-800'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="requests-page-wrapper">
      <AdminHeader />
      
      <div className="requests-page-container">
        <div className="req-mesh-background"></div>

        <div className="req-max-width">
          <header className="req-header">
            <div>
              <h1 className="req-title">Movie Request Dashboard</h1>
              <p className="req-subtitle">Manage pending user submissions for the catalog.</p>
            </div>
            <div className="req-header-actions">
              <div className="req-search-container">
                <span className="req-search-icon material-icons-outlined">search</span>
                <input
                  className="req-search-input"
                  placeholder="Search requests..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <button className="req-icon-button" aria-label="Filter">
                <span className="material-icons-outlined">filter_list</span>
              </button>
            </div>
          </header>

          <div className="req-stats-grid">
            <div className="req-stat-card">
              <div>
                <p className="req-stat-label">Pending Review</p>
                <p className="req-stat-value">{requests.length}</p>
              </div>
              <div className="req-stat-icon req-stat-icon-yellow">
                <span className="material-icons-round">pending_actions</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="req-loading">Loading requests...</div>
          ) : (
            <div className="req-cards-grid">
              {requests.map((request, index) => (
                <div key={request.id} className={`req-card ${getColorClass(index)}`}>
                  <div className="req-card-stripe"></div>
                  
                  <div className="req-card-header">
                    <div className="req-user-info">
                      <div className={`req-avatar bg-gradient-to-br ${getAvatarColor(index)}`}>
                        {getInitials(request.email)}
                      </div>
                      <div>
                        <p className="req-email">{request.email}</p>
                        <p className="req-time">{getTimeAgo(request.created_at)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="req-card-content">
                    <h3 className="req-movie-title">{request.subject}</h3>
                    <p className="req-description">
                      {request.desc}
                    </p>
                
                  </div>

                  <div className="req-card-actions">
                    <button 
                      className="req-btn-accept"
                      onClick={() => handleAccept(request)}
                      title="Accept Request"
                    >
                      Accept
                    </button>
                     <button 
                        className="req-btn-reject"
                        onClick={() => handleReject(request.id)}
                        title="Reject Request"
                      >
                        Reject
                      </button>
                    
                  </div>
                </div>
              ))}

              
            </div>
          )}

          {totalPages > 1 && (
            <div className="req-pagination">
              <nav className="req-pagination-nav">
                <button
                  className="req-page-arrow"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <span className="material-icons-round">chevron_left</span>
                </button>

                {[...Array(Math.min(3, totalPages))].map((_, i) => (
                  <button
                    key={i + 1}
                    className={`req-page-number ${currentPage === i + 1 ? 'req-page-active' : ''}`}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}

                {totalPages > 4 && <span className="req-page-ellipsis">...</span>}

                {totalPages > 3 && (
                  <button
                    className={`req-page-number ${currentPage === totalPages ? 'req-page-active' : ''}`}
                    onClick={() => setCurrentPage(totalPages)}
                  >
                    {totalPages}
                  </button>
                )}

                <button
                  className="req-page-arrow"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <span className="material-icons-round">chevron_right</span>
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestsPage;