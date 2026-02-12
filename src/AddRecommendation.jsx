import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import UserHeader from './UserHeader';
import { supabase } from './supabase';
import './AddRecommendation.css';

const AddRecommendation = () => {
  const [mode, setMode] = useState('single');
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Form state
  const [formData, setFormData] = useState({
    movie_id1: '',
    movie_id2: null,
    message: '',
    type_of_recommendation: 'normal_based'
  });

  // Movie search states
  const [movieOptions, setMovieOptions] = useState([]);
  const [isLoadingMovies, setIsLoadingMovies] = useState(false);
  const [selectedMovie1, setSelectedMovie1] = useState(null);
  const [selectedMovie2, setSelectedMovie2] = useState(null);

  useEffect(() => {
    // Get user email from Supabase session
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      }
    };
    getUser();
    
    // Load initial movie options
    loadMovieOptions();
  }, []);

  const loadMovieOptions = async (searchQuery = '') => {
    setIsLoadingMovies(true);
    try {
      let query = supabase
        .from('movies')
        .select('id, title, year, poster_url, duration, type');

      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;

      const options = data.map(movie => ({
        value: movie.id,
        label: `${movie.title} (${movie.year})`,
        movie: movie
      }));

      setMovieOptions(options);
    } catch (error) {
      console.error('Error loading movies:', error);
    } finally {
      setIsLoadingMovies(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setErrors({});
    if (newMode === 'single') {
      setFormData(prev => ({
        ...prev,
        movie_id2: null,
        type_of_recommendation: 'normal_based'
      }));
      setSelectedMovie2(null);
    } else {
      setFormData(prev => ({
        ...prev,
        type_of_recommendation: 'like_based'
      }));
    }
  };

  const validateForm = async () => {
    const newErrors = {};

    // Validate movie selection
    if (!selectedMovie1) {
      newErrors.movie1 = 'Please select a movie';
    }

    // For pairing mode, validate second movie
    if (mode === 'pairing') {
      if (!selectedMovie2) {
        newErrors.movie2 = 'Please select a second movie';
      } else if (selectedMovie1 && selectedMovie2 && selectedMovie1.id === selectedMovie2.id) {
        newErrors.movie2 = 'Please select a different movie for pairing';
      }
    }

    // Validate message
    if (!formData.message.trim()) {
      newErrors.message = mode === 'pairing' 
        ? 'Please explain the connection between these films'
        : 'Please provide a justification for your recommendation';
    } else if (formData.message.trim().length < 50) {
      newErrors.message = 'Please provide at least 50 characters of explanation';
    }

    // Validate user email
    if (!userEmail) {
      newErrors.general = 'User session not found. Please log in again.';
    }

    // Check for duplicate recommendations
    if (selectedMovie1 && userEmail) {
      setChecking(true);
      try {
        let query = supabase
          .from('user_recommendation')
          .select('id')
          .eq('email', userEmail)
          .eq('movie_id1', selectedMovie1.id)
          .eq('type_of_recommendation', mode === 'pairing' ? 'like_based' : 'normal_based');

        // For pairing mode, also check movie_id2
        if (mode === 'pairing' && selectedMovie2) {
          query = query.eq('movie_id2', selectedMovie2.id);
        } else if (mode === 'single') {
          // For single mode, movie_id2 should be null
          query = query.is('movie_id2', null);
        }

        const { data: existingRecommendations, error } = await query;

        if (error) {
          console.error('Error checking duplicates:', error);
        } else if (existingRecommendations && existingRecommendations.length > 0) {
          if (mode === 'pairing') {
            newErrors.general = `You have already created a pairing recommendation for "${selectedMovie1.title}" and "${selectedMovie2.title}".`;
          } else {
            newErrors.general = `You have already created a recommendation for "${selectedMovie1.title}".`;
          }
        }

        // Also check reverse pairing for like_based recommendations
        if (mode === 'pairing' && selectedMovie1 && selectedMovie2 && !newErrors.general) {
          const { data: reverseRecommendations, error: reverseError } = await supabase
            .from('user_recommendation')
            .select('id')
            .eq('email', userEmail)
            .eq('movie_id1', selectedMovie2.id)
            .eq('movie_id2', selectedMovie1.id)
            .eq('type_of_recommendation', 'like_based');

          if (reverseError) {
            console.error('Error checking reverse duplicates:', reverseError);
          } else if (reverseRecommendations && reverseRecommendations.length > 0) {
            newErrors.general = `You have already created a pairing recommendation for these movies (in reverse order).`;
          }
        }
      } catch (error) {
        console.error('Error validating duplicates:', error);
      } finally {
        setChecking(false);
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form (now async)
    const isValid = await validateForm();
    if (!isValid) {
      return;
    }

    setLoading(true);

    try {
      const submissionData = {
        email: userEmail,
        movie_id1: selectedMovie1?.id,
        movie_id2: mode === 'pairing' ? selectedMovie2?.id : null,
        message: formData.message,
        type_of_recommendation: mode === 'pairing' ? 'like_based' : 'normal_based',
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('user_recommendation')
        .insert([submissionData]);

      if (error) throw error;

      // Reset form
      setFormData({
        movie_id1: '',
        movie_id2: null,
        message: '',
        type_of_recommendation: mode === 'pairing' ? 'like_based' : 'normal_based'
      });
      setSelectedMovie1(null);
      setSelectedMovie2(null);
      setErrors({});

      alert('Recommendation submitted successfully!');
    } catch (error) {
      console.error('Error submitting recommendation:', error);
      alert('Error submitting recommendation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMovie1Change = (selectedOption) => {
    setSelectedMovie1(selectedOption?.movie || null);
    setErrors(prev => ({ ...prev, movie1: null }));
  };

  const handleMovie2Change = (selectedOption) => {
    setSelectedMovie2(selectedOption?.movie || null);
    setErrors(prev => ({ ...prev, movie2: null }));
  };

  const handleInputChange = (inputValue) => {
    if (inputValue.length >= 2) {
      loadMovieOptions(inputValue);
    }
  };

  const handleMessageChange = (e) => {
    setFormData({ ...formData, message: e.target.value });
    setErrors(prev => ({ ...prev, message: null }));
  };

  // Custom styles for react-select
  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      background: 'rgba(30, 41, 59, 0.4)',
      borderColor: errors.movie1 || errors.movie2 
        ? '#ef4444' 
        : state.isFocused 
          ? '#8B5CF6' 
          : 'rgba(255, 255, 255, 0.08)',
      borderRadius: '0.75rem',
      padding: '0.5rem',
      boxShadow: state.isFocused ? '0 0 0 1px rgba(139, 92, 246, 0.3)' : 'none',
      '&:hover': {
        borderColor: '#8B5CF6',
      },
    }),
    menu: (base) => ({
      ...base,
      background: 'rgba(15, 23, 42, 0.95)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(139, 92, 246, 0.3)',
      borderRadius: '0.75rem',
      overflow: 'hidden',
    }),
    menuList: (base) => ({
      ...base,
      padding: 0,
      maxHeight: '300px',
      '::-webkit-scrollbar': {
        width: '8px',
      },
      '::-webkit-scrollbar-track': {
        background: 'transparent',
      },
      '::-webkit-scrollbar-thumb': {
        background: '#334155',
        borderRadius: '4px',
      },
    }),
    option: (base, state) => ({
      ...base,
      background: state.isFocused 
        ? 'rgba(139, 92, 246, 0.2)' 
        : 'transparent',
      color: state.isFocused ? '#E2E8F0' : '#94A3B8',
      padding: '0.75rem 1rem',
      cursor: 'pointer',
      '&:active': {
        background: 'rgba(139, 92, 246, 0.3)',
      },
    }),
    placeholder: (base) => ({
      ...base,
      color: '#475569',
    }),
    singleValue: (base) => ({
      ...base,
      color: 'white',
    }),
    input: (base) => ({
      ...base,
      color: 'white',
    }),
    loadingIndicator: (base) => ({
      ...base,
      color: '#8B5CF6',
    }),
    noOptionsMessage: (base) => ({
      ...base,
      color: '#64748b',
    }),
  };

  return (
    <div className="add-recommendation-wrapper">
      <UserHeader />
      
      <div className="ar-background-effects">
        <div className="ar-bg-gradient"></div>
        <div className="ar-glow-orb ar-glow-orb-1"></div>
        <div className="ar-glow-orb ar-glow-orb-2"></div>
      </div>

      <main className="ar-main-content">
        <div className="ar-glass-container">
          <div className="ar-gradient-border-top"></div>
          <div className="ar-gradient-border-bottom"></div>
          
          <div className="ar-content-wrapper">
            {/* Header Section */}
            <div className="ar-header-section">
              <div className="ar-header-text">
                <h1 className="ar-title">New Submission</h1>
                <p className="ar-subtitle">Contribute to the cinematic archive.</p>
              </div>
              
              <div className="ar-mode-toggle">
                <button
                  className={`ar-mode-btn ${mode === 'single' ? 'ar-mode-active' : 'ar-mode-inactive'}`}
                  onClick={() => switchMode('single')}
                >
                  <span className="material-symbols-outlined">videocam</span>
                  Single
                </button>
                <button
                  className={`ar-mode-btn ${mode === 'pairing' ? 'ar-mode-active' : 'ar-mode-inactive'}`}
                  onClick={() => switchMode('pairing')}
                >
                  <span className="material-symbols-outlined">compare_arrows</span>
                  Pairing
                </button>
              </div>
            </div>

            {/* Form Section */}
            <div className="ar-form-section">
              <form onSubmit={handleSubmit} className="ar-form">
                
                {/* Single Mode */}
                {mode === 'single' && (
                  <>
                    <div className="ar-single-layout">
                      {/* Poster Column */}
                      <div className="ar-poster-column">
                        <div className="ar-poster-container">
                          {selectedMovie1 ? (
                            <>
                              <img
                                src={selectedMovie1.poster_url}
                                alt={selectedMovie1.title}
                                className="ar-poster-image"
                              />
                              <div className="ar-poster-overlay"></div>
                              <div className="ar-poster-info">
                                <h3 className="ar-poster-title">{selectedMovie1.title}</h3>
                                <p className="ar-poster-meta">
                                  {selectedMovie1.year} • {selectedMovie1.duration} min
                                </p>
                              </div>
                              <div className="ar-poster-badge">{selectedMovie1.type}</div>
                            </>
                          ) : (
                            <div className="ar-poster-placeholder">
                              <span className="material-symbols-outlined">movie</span>
                              <p>Search for a movie</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Form Fields Column */}
                      <div className="ar-fields-column">
                        <div className="ar-field-group">
                          <label className="ar-label" htmlFor="search-title">Search Title</label>
                          <div className="ar-select-wrapper">
                            <Select
                              id="search-title"
                              options={movieOptions}
                              onChange={handleMovie1Change}
                              onInputChange={handleInputChange}
                              isLoading={isLoadingMovies}
                              placeholder="Type a movie title..."
                              isClearable
                              styles={customSelectStyles}
                              value={selectedMovie1 ? {
                                value: selectedMovie1.id,
                                label: `${selectedMovie1.title} (${selectedMovie1.year})`,
                                movie: selectedMovie1
                              } : null}
                            />
                            {errors.movie1 && (
                              <div className="ar-error-message">
                                <span className="material-symbols-outlined">error</span>
                                {errors.movie1}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="ar-field-group ar-field-grow">
                          <label className="ar-label" htmlFor="message">The Justification</label>
                          <div className="ar-textarea-wrapper">
                            <textarea
                              id="message"
                              className={`ar-glass-textarea ${errors.message ? 'ar-textarea-error' : ''}`}
                              placeholder="Craft your recommendation. Why does this film resonate? Discuss the cinematography, the score, or the narrative arc..."
                              value={formData.message}
                              onChange={handleMessageChange}
                              rows={10}
                            />
                            
                          </div>
                          {errors.message && (
                            <div className="ar-error-message">
                              <span className="material-symbols-outlined">error</span>
                              {errors.message}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Pairing Mode */}
                {mode === 'pairing' && (
                  <div className="ar-pairing-layout">
                    {/* Movie Pair Section */}
                    <div className="ar-movie-pair-grid">
                      <div className="ar-link-connector">
                        <div className="ar-link-circle">
                          <span className="material-symbols-outlined">link</span>
                        </div>
                      </div>

                      {/* Primary Feature */}
                      <div className="ar-pairing-section">
                        <label className="ar-pairing-label">Primary Feature</label>
                        {selectedMovie1 ? (
                          <div className="ar-movie-card">
                            <img
                              src={selectedMovie1.poster_url}
                              alt={selectedMovie1.title}
                              className="ar-movie-card-poster"
                            />
                            <div className="ar-movie-card-info">
                              <h4 className="ar-movie-card-title">{selectedMovie1.title}</h4>
                              <p className="ar-movie-card-meta">
                                {selectedMovie1.year}
                              </p>
                              <div className="ar-movie-card-tags">
                                <span className="ar-tag">{selectedMovie1.type}</span>
                                <span className="ar-tag">{selectedMovie1.duration} MIN</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="ar-movie-card-edit"
                              onClick={() => {
                                setSelectedMovie1(null);
                                setErrors(prev => ({ ...prev, movie1: null }));
                              }}
                            >
                              <span className="material-symbols-outlined">edit</span>
                            </button>
                          </div>
                        ) : (
                          <div className="ar-movie-search-box">
                            <Select
                              options={movieOptions}
                              onChange={handleMovie1Change}
                              onInputChange={handleInputChange}
                              isLoading={isLoadingMovies}
                              placeholder="Search first movie..."
                              isClearable
                              styles={customSelectStyles}
                            />
                          </div>
                        )}
                        {errors.movie1 && !selectedMovie1 && (
                          <div className="ar-error-message">
                            <span className="material-symbols-outlined">error</span>
                            {errors.movie1}
                          </div>
                        )}
                      </div>

                      {/* Companion Piece */}
                      <div className="ar-pairing-section">
                        <label className="ar-pairing-label">Companion Piece</label>
                        {selectedMovie2 ? (
                          <div className="ar-movie-card">
                            <img
                              src={selectedMovie2.poster_url}
                              alt={selectedMovie2.title}
                              className="ar-movie-card-poster"
                            />
                            <div className="ar-movie-card-info">
                              <h4 className="ar-movie-card-title">{selectedMovie2.title}</h4>
                              <p className="ar-movie-card-meta">
                                {selectedMovie2.year}
                              </p>
                              <div className="ar-movie-card-tags">
                                <span className="ar-tag">{selectedMovie2.type}</span>
                                <span className="ar-tag">{selectedMovie2.duration} MIN</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="ar-movie-card-edit"
                              onClick={() => {
                                setSelectedMovie2(null);
                                setErrors(prev => ({ ...prev, movie2: null }));
                              }}
                            >
                              <span className="material-symbols-outlined">edit</span>
                            </button>
                          </div>
                        ) : (
                          <div className="ar-movie-search-box">
                            <Select
                              options={movieOptions}
                              onChange={handleMovie2Change}
                              onInputChange={handleInputChange}
                              isLoading={isLoadingMovies}
                              placeholder="Search second movie..."
                              isClearable
                              styles={customSelectStyles}
                            />
                          </div>
                        )}
                        {errors.movie2 && !selectedMovie2 && (
                          <div className="ar-error-message">
                            <span className="material-symbols-outlined">error</span>
                            {errors.movie2}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Connection Text Area */}
                    <div className="ar-connection-section">
                      <div className="ar-connection-header">
                        <label className="ar-pairing-label" htmlFor="connection">
                          The Connection
                        </label>
                        <span className="ar-connection-hint">Thematic Bridge</span>
                      </div>
                      <textarea
                        id="connection"
                        className={`ar-glass-textarea ar-pairing-textarea ${errors.message ? 'ar-textarea-error' : ''}`}
                        placeholder="Define the link between these two works. Focus on visual language, philosophical undertones, or narrative symmetry..."
                        value={formData.message}
                        onChange={handleMessageChange}
                        rows={6}
                      />
                      {errors.message && (
                        <div className="ar-error-message">
                          <span className="material-symbols-outlined">error</span>
                          {errors.message}
                        </div>
                      )}
                    </div>

                    {/* Info Footer */}
                    <div className="ar-pairing-footer">
                      <div className="ar-pairing-info">
                        <span className="material-symbols-outlined">info</span>
                        <p>Pairings are curated by the community for thematic depth.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="ar-submit-section">
                  {errors.general && (
                    <div className="ar-error-message ar-error-general">
                      <span className="material-symbols-outlined">error</span>
                      {errors.general}
                    </div>
                  )}
                  <button
                    type="submit"
                    className={mode === 'single' ? 'ar-submit-btn' : 'ar-submit-btn-pairing'}
                    disabled={loading || checking}
                  >
                    <span className="ar-submit-text">
                      {checking ? 'CHECKING...' : loading ? 'SUBMITTING...' : (mode === 'single' ? 'Add Recommendation' : 'Submit Pair Recommendation')}
                      {!loading && !checking && <span className="material-symbols-outlined ar-submit-icon">
                        {mode === 'single' ? 'arrow_forward' : 'arrow_right_alt'}
                      </span>}
                    </span>
                    <div className="ar-submit-overlay"></div>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AddRecommendation;