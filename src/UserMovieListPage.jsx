import React, { useEffect, useState, useRef } from "react";
import "./UserMovieListPage.css";
import UserHeader from "./UserHeader";
import { supabase } from './supabase';
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";

import levenshtein from "fast-levenshtein";

const PAGE_SIZE = 24;

const UserMovieListPage = () => {
  const [genres, setGenres] = useState([]);
  const [movies, setMovies] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState("All Genres");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedFilter, setExpandedFilter] = useState(null);
  const navigate = useNavigate();
  const [selectedLanguage, setSelectedLanguage] = useState("All Languages");
  const [languages, setLanguages] = useState([]);
  const [suggestedMovie, setSuggestedMovie] = useState(null);
  const [showRequestBox, setShowRequestBox] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [contentType, setContentType] = useState("All");
  const [sortBy, setSortBy] = useState("name-asc");
  const [currentPage, setCurrentPage] = useState(1);

  // ── Watchlist multi-list state ───────────────────────────────
  // watchlistMap: { [movieId]: string[] }  — lists each movie belongs to
  const [watchlistMap, setWatchlistMap] = useState({});
  // openWlMovieId: which card's dropdown is currently open
  const [openWlMovieId, setOpenWlMovieId] = useState(null);
  // per-movie available lists cache (fetched once per open)
  const [wlAllLists, setWlAllLists] = useState([]);
  const [wlNewName, setWlNewName] = useState('');
  const [wlShowInput, setWlShowInput] = useState(false);
  const [wlLoading, setWlLoading] = useState(false);
  const [wlToast, setWlToast] = useState(null);
  const wlDropdownRef = useRef(null);

  const wlShowToast = (msg, type = 'success') => {
    setWlToast({ msg, type });
    setTimeout(() => setWlToast(null), 2200);
  };

  // Fetch all distinct watchlist types for the user + which lists each movie is in
  const fetchWatchlistData = async () => {
    const mail = localStorage.getItem("userEmail")?.trim();
    if (!mail) return;
    const { data, error } = await supabase
      .from("watchlist")
      .select("movie_id, type")
      .eq("email", mail);
    if (!error && data) {
      // Build map: movieId -> [type, ...]
      const map = {};
      data.forEach(row => {
        if (!map[row.movie_id]) map[row.movie_id] = [];
        if (row.type) map[row.movie_id].push(row.type);
      });
      setWatchlistMap(map);
      // All distinct list names
      const allTypes = [...new Set(data.map(d => d.type).filter(Boolean))];
      setWlAllLists(allTypes);
    }
  };

  // Open dropdown for a card
  const handleWlOpen = async (e, movieId) => {
    e.stopPropagation();
    if (openWlMovieId === movieId) {
      setOpenWlMovieId(null);
      setWlShowInput(false);
      setWlNewName('');
      return;
    }
    // Re-fetch fresh list names on open
    const mail = localStorage.getItem("userEmail")?.trim();
    if (mail) {
      const { data } = await supabase
        .from("watchlist").select("type").eq("email", mail).not('type', 'is', null);
      if (data) setWlAllLists([...new Set(data.map(d => d.type).filter(Boolean))]);
    }
    setWlShowInput(false);
    setWlNewName('');
    setOpenWlMovieId(movieId);
  };

  // Toggle a list for a movie
  const wlToggleList = async (e, movieId, listName) => {
    e.stopPropagation();
    const mail = localStorage.getItem("userEmail")?.trim();
    if (!mail) { wlShowToast('Please log in', 'error'); return; }
    setWlLoading(true);
    const currentLists = watchlistMap[movieId] || [];
    const isAdded = currentLists.includes(listName);
    if (isAdded) {
      await supabase.from("watchlist").delete()
        .eq("email", mail).eq("movie_id", movieId).eq("type", listName);
      setWatchlistMap(prev => ({
        ...prev,
        [movieId]: (prev[movieId] || []).filter(l => l !== listName)
      }));
      wlShowToast(`Removed from "${listName}"`);
    } else {
      await supabase.from("watchlist").insert({
        email: mail, movie_id: movieId, type: listName,
        status: 'pending', created_at: new Date().toISOString()
      });
      setWatchlistMap(prev => ({
        ...prev,
        [movieId]: [...(prev[movieId] || []), listName]
      }));
      wlShowToast(`Added to "${listName}"`);
    }
    window.dispatchEvent(new Event('watchlistChanged'));
    setWlLoading(false);
  };

  // Create new list and add movie to it
  const wlCreateList = async (e, movieId) => {
    e.stopPropagation();
    const name = wlNewName.trim();
    if (!name) return;
    const mail = localStorage.getItem("userEmail")?.trim();
    if (!mail) { wlShowToast('Please log in', 'error'); return; }
    setWlLoading(true);
    const { error } = await supabase.from("watchlist").insert({
      email: mail, movie_id: movieId, type: name,
      status: 'pending', created_at: new Date().toISOString()
    });
    if (!error) {
      setWlAllLists(prev => [...new Set([...prev, name])]);
      setWatchlistMap(prev => ({
        ...prev,
        [movieId]: [...(prev[movieId] || []), name]
      }));
      wlShowToast(`Created & added to "${name}"`);
      window.dispatchEvent(new Event('watchlistChanged'));
    } else {
      wlShowToast('Failed to create list', 'error');
    }
    setWlNewName('');
    setWlShowInput(false);
    setWlLoading(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wlDropdownRef.current && !wlDropdownRef.current.contains(e.target)) {
        setOpenWlMovieId(null);
        setWlShowInput(false);
        setWlNewName('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  // ── end Watchlist ────────────────────────────────────────────

  const sortMovies = (list) => {
    return [...list].sort((a, b) => {
      switch (sortBy) {
        case "name-asc": return a.title.localeCompare(b.title);
        case "name-desc": return b.title.localeCompare(a.title);
        case "year-asc": return (a.year || 0) - (b.year || 0);
        case "year-desc": return (b.year || 0) - (a.year || 0);
        case "rating-asc": {
          const catDiff = (a.ratingSummary?.ratingCatId ?? 0) - (b.ratingSummary?.ratingCatId ?? 0);
          if (catDiff !== 0) return catDiff;
          return (a.ratingSummary?.percentage ?? 0) - (b.ratingSummary?.percentage ?? 0);
        }
        case "rating-desc": {
          const catDiff = (b.ratingSummary?.ratingCatId ?? 0) - (a.ratingSummary?.ratingCatId ?? 0);
          if (catDiff !== 0) return catDiff;
          return (b.ratingSummary?.percentage ?? 0) - (a.ratingSummary?.percentage ?? 0);
        }
        default: return 0;
      }
    });
  };

  const fetchRatingSummary = async (movieId) => {
    const { data, error } = await supabase
      .from("reviews")
      .select(`id, rating_cat, rating_cat:rating_cat (id, cat_name, cat_emoji)`)
      .eq("movie_id", movieId);
    if (error || !data || data.length === 0) return null;
    const total = data.length;
    const countMap = {}, emojiMap = {}, idMap = {};
    data.forEach((r) => {
      const cat = r.rating_cat.cat_name;
      countMap[cat] = (countMap[cat] || 0) + 1;
      emojiMap[cat] = r.rating_cat.cat_emoji;
      idMap[cat] = r.rating_cat.id;
    });
    let bestCat = null, bestCount = 0, emoji = "";
    for (const cat in countMap) {
      if (countMap[cat] > bestCount) { bestCat = cat; bestCount = countMap[cat]; emoji = emojiMap[cat]; }
    }
    return { category: bestCat, percentage: Math.round((bestCount / total) * 100), emoji_pic: emoji, ratingCatId: idMap[bestCat] };
  };

  function showmovieDetails(id) { navigate(`/movie/${id}`); }

  useEffect(() => {
    const fetchGenres = async () => {
      const { data, error } = await supabase.from('genre').select('*').order('genre_name', { ascending: true });
      if (!error) setGenres(["All Genres", ...data.map(g => g.genre_name)]);
    };
    const fetchMovies = async () => {
      let query = supabase.from("movies").select(`*, genre_in_movies ( genre_name )`).order("title", { ascending: true });
      if (contentType !== "All") query = query.eq("type", contentType);
      const { data: movdata, error: moverror } = await query;
      if (!moverror) {
        const moviesWithRatings = await Promise.all(
          movdata.map(async (m) => ({ ...m, ratingSummary: await fetchRatingSummary(m.id) }))
        );
        setMovies(moviesWithRatings);
        setLanguages(["All Languages", ...new Set(moviesWithRatings.map(m => m.language))]);
      }
    };
    fetchGenres();
    fetchMovies();
    fetchWatchlistData();
  }, [contentType]);

  useEffect(() => {
    const onWatchlistChanged = () => fetchWatchlistData();
    window.addEventListener('watchlistChanged', onWatchlistChanged);
    return () => window.removeEventListener('watchlistChanged', onWatchlistChanged);
  }, []);

  const findClosestMatch = (search, movieList) => {
    if (!search) return null;
    const lowerSearch = search.toLowerCase().trim();
    let bestMatch = null, lowestDistance = Infinity;
    movieList.forEach(movie => {
      const distance = levenshtein.get(lowerSearch, movie.title.toLowerCase());
      if (distance < lowestDistance) { lowestDistance = distance; bestMatch = movie; }
    });
    return lowestDistance <= 2 ? bestMatch : null;
  };

  const filteredMovies = sortMovies(
    movies.filter(movie => {
      const movieGenres = movie.genre_in_movies.map(g => g.genre_name);
      const matchesGenre = selectedGenre === "All Genres" || movieGenres.some(g => g.toLowerCase().includes(selectedGenre.toLowerCase()));
      const matchesSearch =
        movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movie.language?.toLowerCase() === searchTerm.toLowerCase() ||
        movieGenres.some(g => g.toLowerCase() === searchTerm.toLowerCase()) ||
        movie.year?.toString() === searchTerm;
      const matchesLanguage = selectedLanguage === "All Languages" || movie.language === selectedLanguage;
      return matchesGenre && matchesSearch && matchesLanguage;
    })
  );

  useEffect(() => { setCurrentPage(1); }, [searchTerm, selectedGenre, selectedLanguage, contentType, sortBy]);

  useEffect(() => {
    if (searchTerm.trim() && filteredMovies.length === 0) {
      setSuggestedMovie(findClosestMatch(searchTerm, movies));
      setShowRequestBox(true);
    } else {
      setSuggestedMovie(null);
      setShowRequestBox(false);
    }
  }, [searchTerm, filteredMovies, movies]);

  const totalPages = Math.ceil(filteredMovies.length / PAGE_SIZE);
  const paginatedMovies = filteredMovies.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div>
      <UserHeader />

      {/* Global toast */}
      {wlToast && (
        <div className={`uml-wl-toast uml-wl-toast--${wlToast.type}`}>
          {wlToast.type === 'success' ? '✓' : '✕'} {wlToast.msg}
        </div>
      )}

      <main className="main-content">
        <div className="content-wrapper">
          <section className="filter-section">
            <div className="filter-row" style={{display:"flex",justifyContent:"center",alignItems:"center"}}>
              <div className="firstline" style={{width:"100vw"}}>
                <div className="content-type-tabs">
                  {["All", "Movie", "Series"].map(t => (
                    <button key={t} className={contentType === t ? "tab active" : "tab"} onClick={() => setContentType(t)}>{t}</button>
                  ))}
                </div>
                <div style={{display:'flex', gap:'12px', flexWrap:'wrap'}}>
                  <button className="genre-toggle-button" onClick={() => setExpandedFilter(expandedFilter === 'genres' ? null : 'genres')}>
                    <span className="material-symbols-rounded btn-icon">category</span>
                    <span className={`toggle-icon ${expandedFilter === 'genres' ? 'expanded' : ''}`}>▼</span>
                  </button>
                  <button className="genre-toggle-button" onClick={() => setExpandedFilter(expandedFilter === 'language' ? null : 'language')}>
                    <span className="material-symbols-rounded btn-icon">language</span>
                    <span className={`toggle-icon ${expandedFilter === 'language' ? 'expanded' : ''}`}>▼</span>
                  </button>
                </div>
              </div>
              <div className="search-section">
                <div className="search-container">
                  <input
                    className="search-input"
                    placeholder="Search movies..."
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="sort-wrapper">
                  <button className="sort-icon-btn" onClick={() => setExpandedFilter(expandedFilter === "sort" ? null : "sort")} title="Sort">⬍</button>
                  {expandedFilter === "sort" && (
                    <div className="sort-menu">
                      <button onClick={() => {setSortBy("name-asc");setExpandedFilter(null)}}>Name ↑</button>
                      <button onClick={() => {setSortBy("name-desc");setExpandedFilter(null)}}>Name ↓</button>
                      <button onClick={() => {setSortBy("year-asc");setExpandedFilter(null)}}>Year ↑</button>
                      <button onClick={() => {setSortBy("year-desc");setExpandedFilter(null)}}>Year ↓</button>
                      <button onClick={() => {setSortBy("rating-asc");setExpandedFilter(null)}}>Rating ↑</button>
                      <button onClick={() => {setSortBy("rating-desc");setExpandedFilter(null)}}>Rating ↓</button>
                    </div>
                  )}
                </div>
                {showRequestBox && (
                  <div className="request-box">
                    <p>No results found for: <strong>{searchTerm}</strong></p>
                    {suggestedMovie && (
                      <p className="suggestion-text">
                        Did you mean{" "}
                        <span className="suggestion-link" onClick={() => showmovieDetails(suggestedMovie.id)} style={{cursor:"pointer",fontWeight:"bold"}}>
                          {suggestedMovie.title}
                        </span>?
                      </p>
                    )}
                    <button className="request-btn" onClick={() => setShowRequestModal(true)}>Request this movie/series</button>
                  </div>
                )}
              </div>
            </div>

            <div className={`genre-scroll-wrapper ${expandedFilter === 'genres' ? 'expanded' : 'collapsed'}`}>
              <div className="genre-scroll">
                <div className="genre-buttons">
                  {genres.map((genre, index) => (
                    <button key={index} className={selectedGenre === genre ? "genre-button active" : "genre-button"} onClick={() => setSelectedGenre(genre)}>
                      <p className="genre-text">{genre}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className={`genre-scroll-wrapper ${expandedFilter === 'language' ? 'expanded' : 'collapsed'}`}>
              <div className="genre-scroll">
                <div className="genre-buttons">
                  {languages.map((lang, index) => (
                    <button key={index} className={selectedLanguage === lang ? "genre-button active" : "genre-button"} onClick={() => setSelectedLanguage(lang)}>
                      <p className="genre-text">{lang}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="movies-section">
            <div className="movies-grid">
              {paginatedMovies.map((movie) => {
                const movieLists = watchlistMap[movie.id] || [];
                const isInAnyList = movieLists.length > 0;
                const isOpen = openWlMovieId === movie.id;

                return (
                  <div
                    key={movie.id}
                    className="movie-card"
                    onClick={() => showmovieDetails(movie.id)}
                    style={{ position: 'relative' }}
                  >
                    {/* ── Watchlist bookmark button ── */}
                    <div
                      className={`uml-wl-wrapper ${isOpen ? 'uml-wl-wrapper--open' : ''}`}
                      ref={isOpen ? wlDropdownRef : null}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className={`uml-wl-btn ${isInAnyList ? 'uml-wl-btn--active' : ''}`}
                        onClick={(e) => handleWlOpen(e, movie.id)}
                        title="Add to Watchlist"
                      >
                        <svg viewBox="0 0 24 24" fill={isInAnyList ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                          {!isInAnyList && <line x1="12" y1="8" x2="12" y2="14"/>}
                          {!isInAnyList && <line x1="9" y1="11" x2="15" y2="11"/>}
                        </svg>
                      </button>

                      {isOpen && (
                        <div className="uml-wl-dropdown">
                          <div className="uml-wl-dropdown-header">Add to list</div>

                          {wlAllLists.length === 0 && !wlShowInput && (
                            <p className="uml-wl-empty">No lists yet.</p>
                          )}

                          <div className="uml-wl-list-items">
                            {wlAllLists.map(listName => {
                              const checked = movieLists.includes(listName);
                              return (
                                <button
                                  key={listName}
                                  className={`uml-wl-list-item ${checked ? 'uml-wl-list-item--checked' : ''}`}
                                  onClick={(e) => wlToggleList(e, movie.id, listName)}
                                  disabled={wlLoading}
                                >
                                  <span className="uml-wl-list-icon">
                                    {checked ? (
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                    ) : (
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><rect x="3" y="3" width="18" height="18" rx="3"/></svg>
                                    )}
                                  </span>
                                  <span className="uml-wl-list-name">{listName}</span>
                                </button>
                              );
                            })}
                          </div>

                          {wlShowInput ? (
                            <div className="uml-wl-input-row" onClick={e => e.stopPropagation()}>
                              <input
                                autoFocus
                                className="uml-wl-input"
                                type="text"
                                placeholder="List name..."
                                value={wlNewName}
                                onChange={e => setWlNewName(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') wlCreateList(e, movie.id);
                                  if (e.key === 'Escape') { setWlShowInput(false); setWlNewName(''); }
                                }}
                                maxLength={40}
                              />
                              <button className="uml-wl-confirm" onClick={(e) => wlCreateList(e, movie.id)} disabled={!wlNewName.trim() || wlLoading}>
                                Add
                              </button>
                            </div>
                          ) : (
                            <button className="uml-wl-new-btn" onClick={e => { e.stopPropagation(); setWlShowInput(true); }}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                              Add in new list
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    {/* ── end Watchlist ── */}

                    <img
                      src={movie.poster_url}
                      alt={`Movie poster for ${movie.title}`}
                      className="movie-poster"
                      loading="lazy"
                    />
                    <div className="movie-info">
                      <p className="movie-title">{movie.title}</p>
                      {movie.ratingSummary ? (
                        <p className="movie-rating">{movie.ratingSummary.emoji_pic} {movie.ratingSummary.category} ({movie.ratingSummary.percentage}%)</p>
                      ) : (
                        <p className="movie-rating">No ratings yet</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button className="pagination-btn" onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }} disabled={currentPage === 1}>‹</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2)
                  .reduce((acc, page, idx, arr) => { if (idx > 0 && page - arr[idx - 1] > 1) acc.push('...'); acc.push(page); return acc; }, [])
                  .map((item, idx) =>
                    item === '...' ? (
                      <span key={`ellipsis-${idx}`} className="pagination-ellipsis">…</span>
                    ) : (
                      <button key={item} className={`pagination-btn ${currentPage === item ? 'active' : ''}`} onClick={() => { setCurrentPage(item); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>{item}</button>
                    )
                  )}
                <button className="pagination-btn" onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }} disabled={currentPage === totalPages}>›</button>
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="footer">
        <p className="footer-text">© 2025 CineVerse. All rights reserved.</p>
      </footer>

      {showRequestModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Request Movie/Series</h3>
            <p>Requested Title</p>
            <input type="text" value={searchTerm} readOnly className="modal-input"/>
            <p>Message (optional)</p>
            <textarea className="modal-textarea" value={requestMessage} onChange={(e) => setRequestMessage(e.target.value)}/>
            <div className="modal-buttons">
              <button className="send-btn" onClick={async () => {
                const mail = localStorage.getItem("userEmail");
                const { error } = await supabase.from("movie_req").insert({ email: mail, subject: searchTerm, desc: requestMessage });
                if (error) { alert(`Error submitting request.`); }
                else { setSearchTerm(""); setRequestMessage(""); alert("Request submitted!"); }
                setShowRequestModal(false); setRequestMessage("");
              }}>Send Request</button>
              <button className="cancel-btn" onClick={() => setShowRequestModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMovieListPage;