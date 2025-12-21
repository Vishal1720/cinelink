import React, { useEffect, useState } from 'react'
import './Watchlist.css'
import UserHeader from './UserHeader'
import { supabase } from './supabase'
import { useNavigate } from 'react-router-dom'
import emptyImg from "./assets/icons/unfilled.png"
import filledImg from "./assets/icons/filled.png"

const Watchlist = () => {
  const mail = localStorage.getItem("userEmail")?.trim();
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  const [hoveredMovie, setHoveredMovie] = useState(null);

  const fetchRatingSummary = async (movieId) => {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        id,
        rating_cat,
        rating_cat:rating_cat (
          id,
          cat_name,
          cat_emoji
        )
      `)
      .eq('movie_id', movieId);

    if (error || !data || data.length === 0) return null;

    const total = data.length;
    const countMap = {};
    const emojiMap = {};
    const idMap = {};

    data.forEach((r) => {
      const cat = r.rating_cat.cat_name;
      countMap[cat] = (countMap[cat] || 0) + 1;
      emojiMap[cat] = r.rating_cat.cat_emoji;
      idMap[cat] = r.rating_cat.id;
    });

    let bestCat = null;
    let bestCount = 0;
    let emoji = "";

    for (const cat in countMap) {
      if (countMap[cat] > bestCount) {
        bestCat = cat;
        bestCount = countMap[cat];
        emoji = emojiMap[cat];
      }
    }

    return {
      category: bestCat,
      percentage: Math.round((bestCount / total) * 100),
      emoji_pic: emoji,
      ratingCatId: idMap[bestCat]
    };
  }

  const fetchWatchlist = async () => {
    if (!mail) {
      setMovies([]);
      setLoading(false);
      return;
    }

    const { data: watchRows, error: watchError } = await supabase
      .from('watchlist')
      .select('movie_id')
      .eq('email', mail);

    if (watchError) {
      console.error('Error fetching watchlist:', watchError);
      setLoading(false);
      return;
    }

    const ids = watchRows.map(r => r.movie_id);
    if (ids.length === 0) {
      setMovies([]);
      setLoading(false);
      return;
    }

    const { data: moviesData, error: moviesError } = await supabase
      .from('movies')
      .select('*')
      .in('id', ids)
      .order('title', { ascending: true });

    if (moviesError) {
      console.error('Error fetching movies for watchlist:', moviesError);
      setLoading(false);
      return;
    }

    const moviesWithRatings = await Promise.all(
      moviesData.map(async (m) => {
        const summary = await fetchRatingSummary(m.id);
        return { ...m, ratingSummary: summary };
      })
    );

    setMovies(moviesWithRatings);
    setLoading(false);
  }

  const removeFromWatchlist = async (e, movieId) => {
    e.stopPropagation();
    if (!mail) return;

    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('email', mail)
      .eq('movie_id', movieId);

    if (error) {
      console.error('Error removing from watchlist:', error);
      return;
    }

    // Remove locally so UI updates immediately
    setMovies(prev => prev.filter(m => m.id !== movieId));

    // Notify other components to refresh their watchlist state
    window.dispatchEvent(new Event('watchlistChanged'));
  }

  useEffect(() => {
    fetchWatchlist();

    const onWatchlistChanged = () => fetchWatchlist();
    window.addEventListener('watchlistChanged', onWatchlistChanged);
    return () => window.removeEventListener('watchlistChanged', onWatchlistChanged);
  }, []);

  return (
    <>
      <UserHeader />
      <main className="main-content">
        <div className="content-wrapper">
          <section className="movies-section">
            <div className="movies-grid">
              {loading ? (
                <p>Loading...</p>
              ) : movies.length === 0 ? (
                <p>Your watchlist is empty.</p>
              ) : (
                movies.map(movie => (
                  <div key={movie.id} className="movie-card" onClick={() => navigate(`/movie/${movie.id}`)} onMouseEnter={() => setHoveredMovie(movie.id)} onMouseLeave={() => setHoveredMovie(null)} style={{ position: 'relative' }}>
                    <button
                      onClick={(e) => removeFromWatchlist(e, movie.id)}
                      className="watchlist-heart-btn"
                      style={{
                        position: 'absolute',
                        top: '0.75rem',
                        right: '0.75rem',
                        width: '37px',
                        height: '37px',
                        borderRadius: '50%',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.25rem',
                        opacity: 1,
                        transition: 'opacity 0.3s, transform 0.2s',
                        zIndex: 2,
                        boxShadow: window.innerWidth <= 768?'0 2px 8px rgba(0,0,0,0)':'0 2px 8px rgba(0,0,0,1)',
                        backgroundColor:window.innerWidth <= 768?'rgba(255, 255, 255, 0)': 'rgba(255, 255, 255, 0.8)'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      <img src={filledImg} alt="Remove" style={{ width: '26px', height: '26px' }} />
                    </button>

                    <img src={movie.poster_url} alt={`Movie poster for ${movie.title}`} className="movie-poster" loading="lazy" />
                    <div className="movie-info">
                      <p className="movie-title">{movie.title}</p>
                      {movie.ratingSummary ? (
                        <p className="movie-rating">{movie.ratingSummary.emoji_pic} {movie.ratingSummary.category} ({movie.ratingSummary.percentage}%)</p>
                      ) : (
                        <p className="movie-rating">No ratings yet</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    </>
  )
}

export default Watchlist