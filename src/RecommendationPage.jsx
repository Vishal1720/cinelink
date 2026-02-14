import React, { useState, useEffect } from 'react';
import UserHeader from './UserHeader';
import { supabase } from './supabase';
import './RecommendationPage.css';
import { useNavigate } from 'react-router-dom';

const RecommendationPage = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'normal', 'pair'
  const [sortBy, setSortBy] = useState('latest'); // 'latest', 'popular'
  const [userEmail, setUserEmail] = useState('');
  const [likedRecommendations, setLikedRecommendations] = useState(new Set());
  const [likeCounts, setLikeCounts] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editMessage, setEditMessage] = useState('');
  const [editError, setEditError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      }
    };
    getUser();
  }, []);

  useEffect(() => {
    loadRecommendations();
  }, [activeTab]);

  useEffect(() => {
    if (userEmail) {
      loadUserLikes();
    }
  }, [userEmail, recommendations]);

  // Sort recommendations when sortBy changes
  useEffect(() => {
    if (recommendations.length > 0) {
      sortRecommendations();
    }
  }, [sortBy, likeCounts]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('user_recommendation')
        .select(`
          *,
          user:email (name, avatar_url),
          movie1:movie_id1 (id, title, year, poster_url, type, duration),
          movie2:movie_id2 (id, title, year, poster_url, type, duration)
        `)
        .order('created_at', { ascending: false });

      // Filter by tab
      if (activeTab === 'normal') {
        query = query.eq('type_of_recommendation', 'normal_based').is('movie_id2', null);
      } else if (activeTab === 'pair') {
        query = query.eq('type_of_recommendation', 'like_based').not('movie_id2', 'is', null);
      }

      const { data, error } = await query.limit(20);

      if (error) throw error;

      setRecommendations(data || []);
      
      // Load like counts for all recommendations
      if (data && data.length > 0) {
        loadLikeCounts(data.map(rec => rec.id));
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserLikes = async () => {
    if (!userEmail || recommendations.length === 0) return;

    try {
      const recommendationIds = recommendations.map(rec => rec.id);
      
      const { data, error } = await supabase
        .from('likes_in_recommendation')
        .select('recommendation_id')
        .eq('liker_email', userEmail)
        .in('recommendation_id', recommendationIds);

      if (error) throw error;

      const likedIds = new Set(data.map(like => like.recommendation_id));
      setLikedRecommendations(likedIds);
    } catch (error) {
      console.error('Error loading user likes:', error);
    }
  };

  const loadLikeCounts = async (recommendationIds) => {
    try {
      const counts = {};
      
      for (const id of recommendationIds) {
        const { data, error } = await supabase
          .from('likes_in_recommendation')
          .select('id', { count: 'exact' })
          .eq('recommendation_id', id);

        if (!error) {
          counts[id] = data?.length || 0;
        }
      }

      setLikeCounts(counts);
    } catch (error) {
      console.error('Error loading like counts:', error);
    }
  };

  const sortRecommendations = () => {
    const sorted = [...recommendations].sort((a, b) => {
      if (sortBy === 'popular') {
        // Sort by likes (descending)
        const likesA = likeCounts[a.id] || 0;
        const likesB = likeCounts[b.id] || 0;
        if (likesB !== likesA) {
          return likesB - likesA;
        }
        // If likes are equal, sort by date
        return new Date(b.created_at) - new Date(a.created_at);
      } else {
        // Sort by latest (default)
        return new Date(b.created_at) - new Date(a.created_at);
      }
    });
    setRecommendations(sorted);
  };

  const toggleLike = async (recommendationId) => {
    if (!userEmail) {
      alert('Please log in to like recommendations');
      return;
    }

    // Find the recommendation to check if user owns it
    const recommendation = recommendations.find(rec => rec.id === recommendationId);
    if (recommendation && recommendation.email === userEmail) {
      alert('You cannot like your own recommendation');
      return;
    }

    const isLiked = likedRecommendations.has(recommendationId);

    try {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('likes_in_recommendation')
          .delete()
          .eq('recommendation_id', recommendationId)
          .eq('liker_email', userEmail);

        if (error) throw error;

        // Update state
        const newLiked = new Set(likedRecommendations);
        newLiked.delete(recommendationId);
        setLikedRecommendations(newLiked);
        
        setLikeCounts(prev => ({
          ...prev,
          [recommendationId]: Math.max(0, (prev[recommendationId] || 0) - 1)
        }));
      } else {
        // Like
        const { error } = await supabase
          .from('likes_in_recommendation')
          .insert([{
            recommendation_id: recommendationId,
            liker_email: userEmail,
            created_at: new Date().toISOString()
          }]);

        if (error) throw error;

        // Update state
        const newLiked = new Set(likedRecommendations);
        newLiked.add(recommendationId);
        setLikedRecommendations(newLiked);
        
        setLikeCounts(prev => ({
          ...prev,
          [recommendationId]: (prev[recommendationId] || 0) + 1
        }));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      alert('Failed to update like. Please try again.');
    }
  };

  const handlePosterClick = (movieId) => {
    navigate(`/movie/${movieId}`);
  };

  const handleEdit = (recommendation) => {
    setEditingId(recommendation.id);
    setEditMessage(recommendation.message);
    setEditError('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditMessage('');
    setEditError('');
  };

  const handleSaveEdit = async (recommendationId) => {
    // Validate message is not empty
    const trimmedMessage = editMessage.trim();
    
    if (!trimmedMessage) {
      setEditError('Review cannot be empty');
      return;
    }

    if (trimmedMessage.length < 10) {
      setEditError('Review must be at least 10 characters');
      return;
    }

    try {
      const { error } = await supabase
        .from('user_recommendation')
        .update({ message: trimmedMessage })
        .eq('id', recommendationId);

      if (error) throw error;

      // Update local state
      setRecommendations(prev =>
        prev.map(rec =>
          rec.id === recommendationId
            ? { ...rec, message: trimmedMessage }
            : rec
        )
      );

      // Exit edit mode
      setEditingId(null);
      setEditMessage('');
      setEditError('');
      
      alert('Recommendation updated successfully');
    } catch (error) {
      console.error('Error updating recommendation:', error);
      setEditError('Failed to update recommendation. Please try again.');
    }
  };

  const handleDelete = async (recommendationId) => {
    if (!window.confirm('Are you sure you want to delete this recommendation?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('user_recommendation')
        .delete()
        .eq('id', recommendationId);

      if (error) throw error;

      // Remove from local state
      setRecommendations(prev => prev.filter(rec => rec.id !== recommendationId));
      
      alert('Recommendation deleted successfully');
    } catch (error) {
      console.error('Error deleting recommendation:', error);
      alert('Failed to delete recommendation. Please try again.');
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  };

  return (
    <div className="rp-page-wrapper">
      <UserHeader />
      
      {/* Background Effects */}
      <div className="rp-bg-glow"></div>

      <main className="rp-main-content">
        <div className="rp-container">
          {/* Sticky Filter Tabs + Sort + Add Button */}
          <div className="rp-sticky-filters">
            <div className="rp-sticky-inner">
              <div className="rp-filter-tabs">
                <button
                  className={`rp-tab ${activeTab === 'all' ? 'rp-tab-active' : ''}`}
                  onClick={() => setActiveTab('all')}
                >
                  All
                </button>

                <button
                  className={`rp-tab ${activeTab === 'normal' ? 'rp-tab-active' : ''}`}
                  onClick={() => setActiveTab('normal')}
                >
                  Single
                </button>

                <button
                  className={`rp-tab ${activeTab === 'pair' ? 'rp-tab-active' : ''}`}
                  onClick={() => setActiveTab('pair')}
                >
                  Pairings
                </button>
              </div>

              <div className="rp-controls-group">
                {/* Sort Dropdown */}
                <div className="rp-sort-container">
                  <select
                    className="rp-sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="latest">Latest</option>
                    <option value="popular">Most Popular</option>
                  </select>
                  <span className="material-symbols-outlined rp-sort-icon">sort</span>
                </div>

                <button
                  className="rp-add-btn"
                  onClick={() => navigate('/add-recommendation')}
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Recommendations Feed */}
          <section className="rp-feed">
            {loading ? (
              <div className="rp-loading">
                <div className="rp-spinner"></div>
                <p>Loading recommendations...</p>
              </div>
            ) : recommendations.length === 0 ? (
              <div className="rp-empty-state">
                <span className="material-symbols-outlined rp-empty-icon">movie_filter</span>
                <h3>No recommendations yet</h3>
                <p>Be the first to share your cinematic discoveries</p>
              </div>
            ) : (
              recommendations.map((rec) => (
                <article
                  key={rec.id}
                  className={`rp-card ${rec.type_of_recommendation === 'like_based' ? 'rp-card-pairing' : ''}`}
                >
                  {/* Card Header */}
                  <div className="rp-card-header">
                    <div className="rp-user-info">
                      <img
                        src={rec.user?.avatar_url || 'https://wiggitkoxqislzddubuk.supabase.co/storage/v1/object/public/AvatarBucket/defaultavatar.jpg'}
                        alt={rec.user?.name || 'User'}
                        className="rp-user-avatar"
                      />
                      <div>
                        <h3 className="rp-user-name">{rec.user?.name || 'Anonymous'}</h3>
                        <p className="rp-timestamp">
                          {rec.type_of_recommendation === 'like_based' ? 'Paired' : 'Recommended'} {formatTimeAgo(rec.created_at)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="rp-header-actions">
                      {rec.type_of_recommendation === 'like_based' && (
                        <div className="rp-pairing-badge">
                          <span className="material-symbols-outlined">link</span>
                          <span>Double Feature</span>
                        </div>
                      )}
                      
                      {/* Edit and Delete buttons for user's own recommendations */}
                      {userEmail && rec.email === userEmail && (
                        <div className="rp-owner-actions">
                          <button
                            className="rp-edit-btn"
                            onClick={() => handleEdit(rec)}
                            title="Edit recommendation"
                          >
                            <span className="material-symbols-outlined">edit</span>
                          </button>
                          <button
                            className="rp-delete-btn"
                            onClick={() => handleDelete(rec.id)}
                            title="Delete recommendation"
                          >
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Normal Recommendation */}
                  {rec.type_of_recommendation === 'normal_based' && rec.movie1 && (
                    <div className="rp-normal-content">
                      <div 
                        className="rp-movie-poster-section"
                        onClick={() => handlePosterClick(rec.movie1.id)}
                      >
                        <div className="rp-poster-overlay"></div>
                        <img
                          src={rec.movie1.poster_url}
                          alt={rec.movie1.title}
                          className="rp-movie-poster"
                        />
                        <div className="rp-poster-info">
                          <h2 className="rp-movie-title">{rec.movie1.title}</h2>
                          <p className="rp-movie-meta">
                            {rec.movie1.year} • {rec.movie1.type}
                          </p>
                        </div>
                      </div>

                      <div className="rp-content-section">
                        <h4 className="rp-section-title">Why you should watch</h4>
                        
                        {editingId === rec.id ? (
                          <div className="rp-edit-mode">
                            <textarea
                              className="rp-edit-textarea"
                              value={editMessage}
                              onChange={(e) => setEditMessage(e.target.value)}
                              placeholder="Share why you recommend this..."
                              rows={6}
                            />
                            {editError && (
                              <div className="rp-edit-error">
                                <span className="material-symbols-outlined">error</span>
                                {editError}
                              </div>
                            )}
                            <div className="rp-edit-actions">
                              <button
                                className="rp-save-btn"
                                onClick={() => handleSaveEdit(rec.id)}
                              >
                                <span className="material-symbols-outlined">check</span>
                                Save
                              </button>
                              <button
                                className="rp-cancel-btn"
                                onClick={handleCancelEdit}
                              >
                                <span className="material-symbols-outlined">close</span>
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="rp-message">{rec.message}</p>
                        )}
                        
                        <div className="rp-card-actions">
                          <div className="rp-action-group">
                            {userEmail !== rec.email && (
                              <button 
                                className={`rp-action-btn ${likedRecommendations.has(rec.id) ? 'rp-action-liked' : ''}`}
                                onClick={() => toggleLike(rec.id)}
                              >
                                <div className="rp-action-icon-wrapper">
                                  <span className="material-symbols-outlined">
                                    {likedRecommendations.has(rec.id) ? 'favorite' : 'favorite_border'}
                                  </span>
                                </div>
                                <span className="rp-action-count">{likeCounts[rec.id] || 0}</span>
                              </button>
                            )}
                            {userEmail === rec.email && likeCounts[rec.id] > 0 && (
                              <div className="rp-like-count-display">
                                <div className="rp-action-icon-wrapper">
                                  <span className="material-symbols-outlined">favorite</span>
                                </div>
                                <span className="rp-action-count">{likeCounts[rec.id]}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pairing Recommendation */}
                  {rec.type_of_recommendation === 'like_based' && rec.movie1 && rec.movie2 && (
                    <div className="rp-pairing-content">
                      <div className="rp-movie-pair">
                        <div className="rp-pair-connector">
                          <span className="material-symbols-outlined">add</span>
                        </div>
                        
                        <div 
                          className="rp-pair-movie"
                          onClick={() => handlePosterClick(rec.movie1.id)}
                        >
                          <img
                            src={rec.movie1.poster_url}
                            alt={rec.movie1.title}
                            className="rp-pair-poster"
                          />
                          <div className="rp-pair-overlay"></div>
                          <div className="rp-pair-info">
                            <h3 className="rp-pair-title">{rec.movie1.title}</h3>
                            <p className="rp-pair-meta">{rec.movie1.year}</p>
                          </div>
                        </div>

                        <div 
                          className="rp-pair-movie"
                          onClick={() => handlePosterClick(rec.movie2.id)}
                        >
                          <img
                            src={rec.movie2.poster_url}
                            alt={rec.movie2.title}
                            className="rp-pair-poster"
                          />
                          <div className="rp-pair-overlay"></div>
                          <div className="rp-pair-info">
                            <h3 className="rp-pair-title">{rec.movie2.title}</h3>
                            <p className="rp-pair-meta">{rec.movie2.year}</p>
                          </div>
                        </div>
                      </div>

                      <div className="rp-pairing-description">
                        <h4 className="rp-connection-title">
                          <span className="material-symbols-outlined">auto_awesome</span>
                          The Connection
                        </h4>
                        
                        {editingId === rec.id ? (
                          <div className="rp-edit-mode">
                            <textarea
                              className="rp-edit-textarea"
                              value={editMessage}
                              onChange={(e) => setEditMessage(e.target.value)}
                              placeholder="Explain the connection between these movies..."
                              rows={6}
                            />
                            {editError && (
                              <div className="rp-edit-error">
                                <span className="material-symbols-outlined">error</span>
                                {editError}
                              </div>
                            )}
                            <div className="rp-edit-actions">
                              <button
                                className="rp-save-btn"
                                onClick={() => handleSaveEdit(rec.id)}
                              >
                                <span className="material-symbols-outlined">check</span>
                                Save
                              </button>
                              <button
                                className="rp-cancel-btn"
                                onClick={handleCancelEdit}
                              >
                                <span className="material-symbols-outlined">close</span>
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="rp-connection-text">{rec.message}</p>
                        )}
                      </div>

                      <div className="rp-card-actions">
                        <div className="rp-action-group">
                          {userEmail !== rec.email && (
                            <button 
                              className={`rp-action-btn ${likedRecommendations.has(rec.id) ? 'rp-action-liked' : ''}`}
                              onClick={() => toggleLike(rec.id)}
                            >
                              <div className="rp-action-icon-wrapper">
                                <span className="material-symbols-outlined">
                                  {likedRecommendations.has(rec.id) ? 'favorite' : 'favorite_border'}
                                </span>
                              </div>
                              <span className="rp-action-count">{likeCounts[rec.id] || 0}</span>
                            </button>
                          )}
                          {userEmail === rec.email && likeCounts[rec.id] > 0 && (
                            <div className="rp-like-count-display">
                              <div className="rp-action-icon-wrapper">
                                <span className="material-symbols-outlined">favorite</span>
                              </div>
                              <span className="rp-action-count">{likeCounts[rec.id]}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              ))
            )}

            {!loading && recommendations.length > 0 && (
              <div className="rp-end-message">
                <span>You're all caught up for now</span>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default RecommendationPage;