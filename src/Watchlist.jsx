import React, { useEffect, useState } from 'react'
import './Watchlist.css'
import UserHeader from './UserHeader'
import { supabase } from './supabase'
import { useNavigate } from 'react-router-dom'
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

  // Rename states
  const [renamingList, setRenamingList] = useState(null);
  const [renameValue, setRenameValue] = useState("");

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

    const ids = [...new Set(
      watchRows
        .map(r => r.movie_id)
        .filter(Boolean)
        .map(id => (typeof id === 'number' ? id : Number(id)))
        .filter(id => !isNaN(id))
    )];

    if (ids.length === 0) {
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

  const startRename = (listName) => {
    setRenamingList(listName);
    setRenameValue(listName);
  }

  const cancelRename = () => {
    setRenamingList(null);
    setRenameValue("");
  }

  const confirmRename = async () => {
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === renamingList) { cancelRename(); return; }
    if (trimmed.toLowerCase() === "default") {
      alert("Cannot rename to 'Default'");
      return;
    }
    if (groupedMovies[trimmed]) {
      alert("A collection with that name already exists!");
      return;
    }

    if (mail) {
      const { error } = await supabase
        .from('watchlist')
        .update({ type: trimmed })
        .eq('email', mail)
        .eq('type', renamingList);

      if (error) {
        console.error("Error renaming list:", error);
        alert("Failed to rename collection.");
        return;
      }
    }

    setGroupedMovies(prev => {
      const entries = Object.entries(prev);
      const newState = {};
      entries.forEach(([key, val]) => {
        newState[key === renamingList ? trimmed : key] = val;
      });
      return newState;
    });

    window.dispatchEvent(new Event('watchlistChanged'));
    cancelRename();
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

          <h2 style={{ color: 'white', fontSize: '2rem', fontWeight: 'bold' }}>My Collections</h2>
          <div className="watchlist-header">
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
            <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
              <div className="loader"></div>
            </div>
          ) : (
            <div className="lists-container">
              {Object.keys(groupedMovies).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
                  <p style={{ fontSize: '1.2rem', marginBottom: '20px' }}>You haven't created any collections yet.</p>
                  <p>Click "New Collection" to categorize your favorite movies.</p>
                </div>
              ) : (
                Object.keys(groupedMovies).map(listName => (
                  <section key={listName} className="list-section">
                    <div className="list-title-row">
                      {renamingList === listName ? (
                        <div className="rename-list-form">
                          <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") confirmRename();
                              if (e.key === "Escape") cancelRename();
                            }}
                          />
                          <button className="watchlist-create-btn" onClick={confirmRename} title="Save">✓</button>
                          <button className="watchlist-cancel-btn" onClick={cancelRename} title="Cancel">✕</button>
                        </div>
                      ) : (
                        <h3 className="list-title">{listName}</h3>
                      )}

                      {renamingList !== listName && (
                        <button
                          className="list-rename-btn"
                          onClick={() => startRename(listName)}
                          title="Rename collection"
                        >
                          <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" width="14" height="14">
                            <path d="M11.5 1.5a1.414 1.414 0 0 1 2 2L5 12H3v-2L11.5 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      )}

                      {renamingList !== listName && (
                        <button
                          className="list-add-btn"
                          onClick={() => { setActiveListForSearch(listName); setIsSearchOpen(true); }}
                          title="Add movie"
                        >
                          +
                        </button>
                      )}

                      {renamingList !== listName && (
                        <button
                          className="list-delete-btn"
                          onClick={() => deleteList(listName)}
                          title="Delete collection"
                        >
                          <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" width="15" height="15">
                            <path d="M2 4h12M5 4V2.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 .5.5V4M6 7v5M10 7v5M3 4l.8 9.1A1 1 0 0 0 4.8 14h6.4a1 1 0 0 0 1-.9L13 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      )}

                      <span className="list-count">{groupedMovies[listName].length} items</span>
                    </div>

                    <div className="movies-grid">
                      {groupedMovies[listName].length === 0 ? (
                        <div
                          className="empty-list-placeholder"
                          onClick={() => { setActiveListForSearch(listName); setIsSearchOpen(true); }}
                        >
                          + Add a movie to {listName}
                        </div>
                      ) : (
                        groupedMovies[listName].map(movie => (
                          <div
                            key={movie.id}
                            className="movie-card"
                            onClick={() => navigate(`/movie/${movie.id}`)}
                            onMouseEnter={() => setHoveredMovie(movie.id)}
                            onMouseLeave={() => setHoveredMovie(null)}
                          >
                            {/* ── Remove button: dark circle with SVG × ── */}
                            <button
                              onClick={(e) => removeFromWatchlist(e, movie.id, listName)}
                              className="watchlist-remove-btn"
                              title="Remove from this list"
                            >
                              <svg viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <line x1="1.5" y1="1.5" x2="11.5" y2="11.5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                                <line x1="11.5" y1="1.5" x2="1.5" y2="11.5" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                              </svg>
                            </button>

                            <img
                              src={movie.poster_url}
                              alt={`Movie poster for ${movie.title}`}
                              className="movie-poster"
                              loading="lazy"
                            />
                            <div className="movie-info">
                              <p className="movie-title">{movie.title}</p>
                              {movie.ratingSummary ? (
                                <p className="movie-rating">
                                  {movie.ratingSummary.emoji_pic} {movie.ratingSummary.category} ({movie.ratingSummary.percentage}%)
                                </p>
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