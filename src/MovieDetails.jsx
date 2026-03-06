import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from './supabase';
import UserHeader from './UserHeader';
import OttMovieRecommendation from './OttMovieRecommendation';
import './MovieDetails.css';
import ReviewsSection from './ReviewsSection';
import RatingDonutChart from "./RatingDonutChart";
import GenreRecommendationSection from './GenreRecommendationSection';
import { useNavigate } from 'react-router-dom';
import LikeBasedRecommendationSection from './LikeBasedRecommendationSection';

const MovieDetails = () => {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [genres, setGenres] = useState([]);
  const [cast, setCast] = useState([]);
  const [ottPlatforms, setOttPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRating, setSelectedRating] = useState(null);
  const [reviewCounts, setReviewCounts] = useState({});
  const [discussionCount, setDiscussionCount] = useState(0);
  const navigate = useNavigate();

  const [ratingCategories, setRatingCategories] = useState([]);

  // ── Watchlist state ──────────────────────────────────────────
  const [wlOpen, setWlOpen] = useState(false);
  const [wlLists, setWlLists] = useState([]);
  const [wlAdded, setWlAdded] = useState([]);
  const [wlNewName, setWlNewName] = useState('');
  const [wlShowInput, setWlShowInput] = useState(false);
  const [wlLoading, setWlLoading] = useState(false);
  const [wlToast, setWlToast] = useState(null);
  const wlRef = useRef(null);

  const wlShowToast = (msg, type = 'success') => {
    setWlToast({ msg, type });
    setTimeout(() => setWlToast(null), 2500);
  };

  const wlFetchLists = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('watchlist')
      .select('type')
      .eq('email', user.email)
      .not('type', 'is', null);
    if (data) setWlLists([...new Set(data.map(d => d.type).filter(Boolean))]);

    const { data: existing } = await supabase
      .from('watchlist')
      .select('type')
      .eq('email', user.email)
      .eq('movie_id', id);
    if (existing) setWlAdded(existing.map(e => e.type));
  };

  useEffect(() => {
    if (wlOpen) wlFetchLists();
  }, [wlOpen]);

  useEffect(() => {
    const handler = (e) => {
      if (wlRef.current && !wlRef.current.contains(e.target)) {
        setWlOpen(false);
        setWlShowInput(false);
        setWlNewName('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const wlToggleList = async (listName) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { wlShowToast('Please log in', 'error'); return; }
    setWlLoading(true);
    const isAdded = wlAdded.includes(listName);
    if (isAdded) {
      await supabase.from('watchlist').delete()
        .eq('email', user.email).eq('movie_id', id).eq('type', listName);
      setWlAdded(prev => prev.filter(l => l !== listName));
      wlShowToast(`Removed from "${listName}"`);
    } else {
      await supabase.from('watchlist').insert({
        email: user.email, movie_id: id, type: listName,
        status: 'pending', created_at: new Date().toISOString()
      });
      setWlAdded(prev => [...prev, listName]);
      wlShowToast(`Added to "${listName}"`);
    }
    setWlLoading(false);
  };

  const wlCreateList = async () => {
    const name = wlNewName.trim();
    if (!name) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { wlShowToast('Please log in', 'error'); return; }
    setWlLoading(true);
    const { error } = await supabase.from('watchlist').insert({
      email: user.email, movie_id: id, type: name,
      status: 'pending', created_at: new Date().toISOString()
    });
    if (!error) {
      setWlLists(prev => [...new Set([...prev, name])]);
      setWlAdded(prev => [...prev, name]);
      wlShowToast(`Created & added to "${name}"`);
    } else {
      wlShowToast('Failed to create list', 'error');
    }
    setWlNewName('');
    setWlShowInput(false);
    setWlLoading(false);
  };
  // ── end Watchlist ────────────────────────────────────────────

  const pieData = ratingCategories.map((cat) => ({
    id: cat.id,
    name: cat.cat_name,
    value: reviewCounts[cat.id] || 0,
    emoji: cat.cat_emoji
  })).filter((item) => item.value > 0);

  const fetchDiscussionCount = async () => {
    const { count, error } = await supabase
      .from("discussion")
      .select("id", { count: "exact", head: true })
      .eq("movie_id", id);
    if (!error) setDiscussionCount(count || 0);
  };

  const totalReviews = Object.values(reviewCounts).reduce((a, b) => a + b, 0);

  const fetchRatingCategories = async () => {
    const { data, error } = await supabase
      .from("ratingnames")
      .select("id, cat_name, cat_emoji")
      .order("id", { ascending: true });
    if (!error) setRatingCategories(data);
  };

  const countCategoryById = async (movieId, catId) => {
    const { count } = await supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("movie_id", movieId)
      .eq("rating_cat", catId);
    return count || 0;
  };

  const fetchReviewCounts = async () => {
    const counts = {};
    for (let catId = 1; catId <= 4; catId++) {
      counts[catId] = await countCategoryById(id, catId);
    }
    setReviewCounts(counts);
  };

  useEffect(() => {
    if (id) {
      fetchMovieDetails();
      fetchReviewCounts();
      fetchRatingCategories();
      fetchDiscussionCount();
    }
  }, [id]);

  const fetchMovieDetails = async () => {
    try {
      setLoading(true);
      const { data: movieData, error: movieError } = await supabase
        .from("movies").select("*").eq("id", id).single();
      if (movieError) throw movieError;

      const { data: genreData, error: genreError } = await supabase
        .from("genre_in_movies").select(`genre_name`).eq("movie_id", id)
        .order('genre_name', { ascending: true });
      if (genreError) throw genreError;

      const { data: castData, error: castError } = await supabase
        .from("cast_in_movies")
        .select(`role_in_movie,priority, cast:cast_id (id, cast_name, avatar_url)`)
        .eq("movie_id", id).order("priority", { ascending: true });
      if (castError) throw castError;

      const { data: ottData, error: ottError } = await supabase
        .from("url_in_movies")
        .select("urls(ott_name, logo_url), ott_link,ott_name")
        .eq("movie_id", id);
      if (ottError) throw ottError;

      setMovie(movieData);
      setGenres(genreData || []);
      setCast(castData || []);
      setOttPlatforms(ottData || []);
    } catch (error) {
      console.error("Error fetching movie details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRating = (rating) => {
    setSelectedRating(rating);
  };

  const getOttIcon = (ottName) => {
    const icons = {
      'Netflix': (
        <svg className="w-6 h-6" fill="currentColor" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <title>Netflix</title>
          <path d="M10.597.439L.918 23.332h3.895l1.854-4.855h5.996l1.94 4.855h3.931L13.403.439h-2.806zm-.124 4.047h.062l3.41 9.42h-6.95l3.478-9.42z"></path>
        </svg>
      ),
      'Amazon Prime': (
        <svg className="w-6 h-6" fill="currentColor" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <title>Amazon Prime Video</title>
          <path d="M2.52 23.364l5.424-5.364h2.52l-5.652 5.616A11.952 11.952 0 010 12C0 5.376 5.376 0 12 0s12 5.376 12 12-5.376 12-12 12a12.012 12.012 0 01-9.48-2.636zM11.7 13.056c.48.24 1.224.624 1.836.84.432.144.936.216 1.344.216.744 0 1.224-.168 1.488-.504.24-.312.288-.792.192-1.488l-.504-2.88c-.096-.6-.096-1.128.048-1.512.144-.408.552-.696 1.2-.696.576 0 1.056.216 1.416.624.048.048.096.072.12.12l-1.128 1.44c-.216-.312-.48-.528-.84-.528-.312 0-.48.168-.528.48-.024.168-.024.504.048 1.008l.504 2.88c.144.816.12 1.512-.12 2.04-.24.552-.744.9-1.536.9-1.008 0-1.872-.36-2.52-.96l-2.424 2.376c.744.576 1.584.984 2.52 1.224a7.32 7.32 0 003.36.336c2.472 0 4.224-.96 5.232-2.856.36-1.2.36-3.384.36-3.816v-2.112h-3.624l-1.056-5.328H20.4V.024h-5.904l-.84 4.2H11.4v4.44h2.304L11.7 13.056z"></path>
        </svg>
      )
    };
    return icons[ottName] || icons['Netflix'];
  };

  if (loading) {
    return (
      <div className="moviedetails-container">
        <UserHeader />
        <div className="moviedetails-loading">Loading...</div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="moviedetails-container">
        <UserHeader />
        <div className="moviedetails-error">Movie not found</div>
      </div>
    );
  }

  const ottNames = ottPlatforms.map((ott) => ott.ott_name || ott.urls?.ott_name);
  const uniqueOttNames = [...new Set(ottNames)];
  const wlIsActive = wlAdded.length > 0;

  return (
    <div className="moviedetails-container">
      <UserHeader />

      <div className="moviedetails-content">
        <div className="moviedetails-hero">

          {/* ── Poster with watchlist button overlaid on top ── */}
          <div className="moviedetails-poster">
            <img
              src={movie.poster_url || 'https://via.placeholder.com/350x500'}
              alt={`${movie.title} poster`}
            />

            {/* Watchlist overlay button — bottom of poster like IMDb/Letterboxd */}
            <div className="wlb-wrapper" ref={wlRef}>
              {wlToast && (
                <div className={`wlb-toast wlb-toast--${wlToast.type}`}>
                  {wlToast.type === 'success' ? '✓' : '✕'} {wlToast.msg}
                </div>
              )}

              <button
                className={`wlb-trigger ${wlIsActive ? 'wlb-trigger--active' : ''}`}
                onClick={() => setWlOpen(o => !o)}
                title="Add to Watchlist"
              >
                <svg viewBox="0 0 24 24" fill={wlIsActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  {!wlIsActive && <line x1="12" y1="9" x2="12" y2="15" />}
                  {!wlIsActive && <line x1="9" y1="12" x2="15" y2="12" />}
                </svg>
                <span>{wlIsActive ? 'Saved' : '+ Watchlist'}</span>
              </button>

              {wlOpen && (
                <div className="wlb-dropdown">
                  <div className="wlb-dropdown-header">Add to list</div>

                  {wlLists.length === 0 && !wlShowInput && (
                    <p className="wlb-empty">No lists yet. Create one below.</p>
                  )}

                  <div className="wlb-list-items">
                    {wlLists.map(listName => {
                      const checked = wlAdded.includes(listName);
                      return (
                        <button
                          key={listName}
                          className={`wlb-list-item ${checked ? 'wlb-list-item--checked' : ''}`}
                          onClick={() => wlToggleList(listName)}
                          disabled={wlLoading}
                        >
                          <span className="wlb-list-icon">
                            {checked ? (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            ) : (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
                                <rect x="3" y="3" width="18" height="18" rx="3"/>
                              </svg>
                            )}
                          </span>
                          <span className="wlb-list-name">{listName}</span>
                        </button>
                      );
                    })}
                  </div>

                  {wlShowInput ? (
                    <div className="wlb-new-input-row">
                      <input
                        autoFocus
                        className="wlb-new-input"
                        type="text"
                        placeholder="List name..."
                        value={wlNewName}
                        onChange={e => setWlNewName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') wlCreateList();
                          if (e.key === 'Escape') { setWlShowInput(false); setWlNewName(''); }
                        }}
                        maxLength={40}
                      />
                      <button
                        className="wlb-new-confirm"
                        onClick={wlCreateList}
                        disabled={!wlNewName.trim() || wlLoading}
                      >
                        Add
                      </button>
                    </div>
                  ) : (
                    <button className="wlb-new-list-btn" onClick={() => setWlShowInput(true)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13" strokeLinecap="round">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      Add in new list
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          {/* ── end poster ── */}

          <div className="moviedetails-info">
            <h1 className="moviedetails-title">{movie.title}</h1>

            <div className="moviedetails-genre-tags">
              {genres.map((item, index) => (
                <span key={index} className="moviedetails-genre-tag">
                  {item.genre?.genre_name || item.genre_name}
                </span>
              ))}
            </div>

            <div className="moviedetails-meta">
              <span>{movie.duration || '2h 15m'}</span>
              <span className="moviedetails-dot"></span>
              <span>{movie.year || '2024'}</span>
              <span className="moviedetails-dot"></span>
              <span>{movie.language || 'Hindi'}</span>
            </div>

            <p className="moviedetails-description">
              {movie.desc || 'No description available.'}
            </p>

            <div className="moviedetails-actions">
              {movie.trailer_link && (
                <a
                  href={movie.trailer_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="moviedetails-btn-primary"
                >
                  <span className="material-symbols-outlined">play_arrow</span>
                  <span>Watch Trailer</span>
                </a>
              )}

              <div className="moviedetails-ott-buttons">
                {ottPlatforms.map((ott, index) => (
                  <a
                    key={index}
                    href={ott.ott_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="moviedetails-btn-ott"
                    title={ott.urls?.ott_name}
                  >
                    {ott.urls?.logo_url ? (
                      <img src={ott.urls.logo_url} loading="lazy" alt={ott.urls.ott_name} className="moviedetails-ott-logo" />
                    ) : (
                      getOttIcon(ott.urls?.ott_name)
                    )}
                  </a>
                ))}
                <div className="discussion-btn-wrapper" onClick={() => navigate(`/discussion/${id}`)}>
                  <div className="discussion-icon-btn">
                    <span className="material-symbols-outlined">groups</span>
                  </div>
                  {discussionCount > 0 && (
                    <span className="discussion-count-badge">
                      {discussionCount > 99 ? "99+" : discussionCount}
                    </span>
                  )}
                  <span className="discussion-btn-label">Chat</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {cast.length > 0 && (
          <div className="moviedetails-cast-section">
            <h3 className="moviedetails-section-title">Cast</h3>
            <div className="moviedetails-cast-list">
              {cast.map((member, index) => (
                <div key={index} className="moviedetails-cast-member" onClick={() => navigate(`/cast/${member.cast?.id}`)} style={{cursor:"pointer"}}>
                  <img
                    className="moviedetails-cast-avatar"
                    src={member.cast?.avatar_url || 'https://via.placeholder.com/144'}
                    alt={member.cast?.cast_name || "Cast member"}
                    loading="lazy"
                  />
                  <p className="moviedetails-cast-name">{member.cast?.cast_name}</p>
                  {member.role_in_movie && (
                    <p className="moviedetails-cast-role">as {member.role_in_movie}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <ReviewsSection movieId={id} pieData={pieData} totalreviews={totalReviews} summary={movie.ai_summary} moviename={movie.title} type={movie.type}/>
      </div>

      <GenreRecommendationSection genres={genres.map(g => g.genre_name || g.genre?.genre_name)} movieid={id}/>
      {uniqueOttNames.map((ott) => (
        <OttMovieRecommendation key={ott} ottname={ott} movieid={id} />
      ))}
      <LikeBasedRecommendationSection movieid={id} />
    </div>
  );
};

export default MovieDetails;