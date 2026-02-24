import React, { useEffect, useState } from 'react'
import './Watchlist.css'
import UserHeader from './UserHeader'
import { supabase } from './supabase'
import { useNavigate } from 'react-router-dom'
import emptyImg from "./assets/icons/unfilled.png"
import filledImg from "./assets/icons/filled.png"
import MovieSearchModal from './MovieSearchModal'

const Watchlist = () => {
  const mail = localStorage.getItem("userEmail")?.trim();
  const navigate = useNavigate();
  const [groupedMovies, setGroupedMovies] = useState({});
  const [loading, setLoading] = useState(true);
  const [hoveredMovie, setHoveredMovie] = useState(null);

  // Modal states
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeListForSearch, setActiveListForSearch] = useState(null);
  const [newListName, setNewListName] = useState("");
  const [isCreatingList, setIsCreatingList] = useState(false);

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
      setGroupedMovies({});
      setLoading(false);
      return;
    }

    const { data: watchRows, error: watchError } = await supabase
      .from('watchlist')
      .select('movie_id, type')
      .eq('email', mail);

    if (watchError) {
      console.error('Error fetching watchlist:', watchError);
      setLoading(false);
      return;
    }

    if (watchRows.length === 0) {
      setGroupedMovies(prev => {
        const emptyKeys = Object.keys(prev).filter(k => prev[k].length === 0);
        const newObj = {};
        emptyKeys.forEach(k => newObj[k] = []);
        return newObj;
      });
      setLoading(false);
      return;
    }

    // sanitize movie ids: remove falsy values and ensure numeric IDs
    const ids = [...new Set(
      watchRows
        .map(r => r.movie_id)
        .filter(Boolean)
        .map(id => (typeof id === 'number' ? id : Number(id)))
        .filter(id => !isNaN(id))
    )];

    if (ids.length === 0) {
      // no valid movie ids to query
      setGroupedMovies({});
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

    const movieMap = {};
    moviesWithRatings.forEach(m => movieMap[m.id] = m);

    const groups = {};

    watchRows.forEach(row => {
      if (!row.type || row.type === "Default") return;

      const listName = row.type;
      if (!groups[listName]) groups[listName] = [];

      const movie = movieMap[row.movie_id];
      if (movie) {
        groups[listName].push(movie);
      }
    });

    setGroupedMovies(prev => {
      const merged = { ...groups };
      Object.keys(prev).forEach(key => {
        if (!merged[key] && prev[key].length === 0) {
          merged[key] = [];
        }
      });
      return merged;
    });

    setLoading(false);
  }

  const removeFromWatchlist = async (e, movieId, listName) => {
    e.stopPropagation();
    if (!mail) return;

    await supabase
      .from('watchlist')
      .delete()
      .eq('email', mail)
      .eq('movie_id', movieId)
      .eq('type', listName);

    setGroupedMovies(prev => {
      const newGroup = [...(prev[listName] || [])].filter(m => m.id !== movieId);
      return { ...prev, [listName]: newGroup };
    });

    window.dispatchEvent(new Event('watchlistChanged'));
  }

  const deleteList = async (listName) => {
    if (!window.confirm(`Are you sure you want to delete the "${listName}" collection?`)) return;

    if (!mail) {
      setGroupedMovies(prev => {
        const newState = { ...prev };
        delete newState[listName];
        return newState;
      });
      return;
    }

    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('email', mail)
      .eq('type', listName);

    if (error) {
      console.error("Error deleting list:", error);
      alert("Failed to delete list.");
    } else {
      setGroupedMovies(prev => {
        const newState = { ...prev };
        delete newState[listName];
        return newState;
      });
      window.dispatchEvent(new Event('watchlistChanged'));
    }
  }

  const handleAddMovieToList = async (movie) => {
    if (!mail || !activeListForSearch) return;

    if (groupedMovies[activeListForSearch]?.some(m => m.id === movie.id)) {
      alert("Movie already in this list!");
      return;
    }

    const { error } = await supabase
      .from('watchlist')
      .insert({
        email: mail,
        movie_id: movie.id,
        type: activeListForSearch
      });

    if (error) {
      console.error("Error adding to list:", error);
      alert("Failed to add movie. It might already be in this list.");
    } else {
      fetchWatchlist();
      window.dispatchEvent(new Event('watchlistChanged'));
      setIsSearchOpen(false);
    }
  }

  const createNewList = () => {
    if (!newListName.trim()) return;
    if (newListName.toLowerCase() === "default") {
      alert("Cannot create a list named 'Default'");
      return;
    }
    if (groupedMovies[newListName]) {
      alert("List already exists!");
      return;
    }

    setGroupedMovies(prev => ({
      ...prev,
      [newListName]: []
    }));

    setNewListName("");
    setIsCreatingList(false);
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

          {/* <div className="watchlist-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
           */}
           <h2 style={{ color: 'white', fontSize: '2rem', fontWeight: 'bold' }}>My Collections</h2>
           <div className="watchlist-header" >

            
            <div className="watchlist-header-actions">
  {!isCreatingList ? (
    <button
      className="new-collection-btn"
      onClick={() => setIsCreatingList(true)}
    >
      <span style={{ fontSize: '1.2rem' }}>+</span> New Collection
    </button>
  ) : (
  <div className="create-list-form">
  <input
    type="text"
    value={newListName}
    onChange={(e) => setNewListName(e.target.value)}
    placeholder="Collection name"
    autoFocus
    onKeyDown={(e) => e.key === "Enter" && createNewList()}
  />

  <button
    className="watchlist-create-btn"
    onClick={createNewList}
    title="Create collection"
  >
    ✓
  </button>

  <button
    className="watchlist-cancel-btn"
    onClick={() => {
      setIsCreatingList(false);
      setNewListName("");
    }}
    title="Cancel"
  >
    ✕
  </button>
</div>

  )}
</div>

          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}><div className="loader"></div></div>
          ) : (
            <div className="lists-container">
              {Object.keys(groupedMovies).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
                  <p style={{ fontSize: '1.2rem', marginBottom: '20px' }}>You haven't created any collections yet.</p>
                  <p>Click "New Collection" to categorize your favorite movies.</p>
                </div>
              ) : (
                Object.keys(groupedMovies).map(listName => (
                  <section key={listName} className="list-section" style={{ marginBottom: '50px', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '16px' }}>
                    <div className="list-title-row" style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                      <h3 style={{ margin: 0, color: '#fff', fontSize: '1.5rem', borderLeft: '4px solid #E50914', paddingLeft: '12px' }}>{listName}</h3>
                      <button
                        onClick={() => { setActiveListForSearch(listName); setIsSearchOpen(true); }}
                        style={{
                          background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        title="Add movie"
                      >
                        +
                      </button>

                      <button
                        onClick={() => deleteList(listName)}
                        style={{
                          background: 'transparent', border: '1px solid #444', color: '#aaa', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
                          marginLeft: 'auto',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#E50914'; e.currentTarget.style.color = '#E50914'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#444'; e.currentTarget.style.color = '#aaa'; }}
                        title="Delete collection"
                      >
                        🗑
                      </button>

                      <span style={{ color: '#888', fontSize: '0.9rem', fontWeight: '500', minWidth: '60px', textAlign: 'right' }}>{groupedMovies[listName].length} items</span>
                    </div>

                    <div className="movies-grid">
                      {groupedMovies[listName].length === 0 ? (
                        <div style={{ width: '100%', padding: '30px', textAlign: 'center', border: '2px dashed #333', borderRadius: '12px', color: '#555', cursor: 'pointer' }} onClick={() => { setActiveListForSearch(listName); setIsSearchOpen(true); }}>
                          + Add a movie to {listName}
                        </div>
                      ) : (
                        groupedMovies[listName].map(movie => (
                          <div key={movie.id} className="movie-card" onClick={() => navigate(`/movie/${movie.id}`)} onMouseEnter={() => setHoveredMovie(movie.id)} onMouseLeave={() => setHoveredMovie(null)} style={{ position: 'relative' }}>
                            <button
                              onClick={(e) => removeFromWatchlist(e, movie.id, listName)}
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
                                boxShadow: '0 2px 8px rgba(0,0,0,1)',
                                backgroundColor: 'rgba(255, 255, 255, 0.8)'
                              }}
                              title="Remove from this list"
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
                ))
              )}
            </div>
          )}
        </div>
      </main>

      {isSearchOpen && (
        <MovieSearchModal
          listName={activeListForSearch}
          onClose={() => setIsSearchOpen(false)}
          onSelectMovie={handleAddMovieToList}
        />
      )}
    </>
  )
}

export default Watchlist