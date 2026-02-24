import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import './UserMovieListPage.css'; // Re-use existing styles where possible
import './Watchlist.css'; // New styles for the modal if needed

const MovieSearchModal = ({ onClose, onSelectMovie, listName }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Debounce search to avoid too many requests
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim()) {
        searchMovies();
      } else {
        setMovies([]);
        setError(null);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const searchMovies = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('movies')
        .select(`
            *,
            genre_in_movies (
              genre_name
            )
          `)
        .ilike('title', `%${searchTerm}%`)
        .limit(20);

      if (error) throw error;
      setMovies(data || []);
    } catch (err) {
      console.error("Error searching movies:", err);
      setError(err.message || "Search failed");
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '680px', width: '100%', maxHeight: '80vh', overflowY: 'auto', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>Add to "{listName}"</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
        </div>

        <input
          type="text"
          placeholder="Search for a movie..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') searchMovies(); }}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #333',
            background: '#2a2a2a',
            color: 'white',
            marginBottom: '20px',
            fontSize: '1rem'
          }}
          autoFocus
        />

        {loading && <p>Searching...</p>}
        {error && <p style={{ color: '#ffb4b4' }}>{error}</p>}

        <div className="search-results" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {!loading && movies.length === 0 && searchTerm && (
            <p style={{ color: '#cbd5f5' }}>No movies found.</p>
          )}

          {movies.map(movie => (
            <div
              key={movie.id}
              onClick={() => onSelectMovie(movie)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                padding: '10px',
                background: '#252525',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#333'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#252525'}
            >
              <img
                src={movie.poster_url || 'https://via.placeholder.com/50'}
                alt={movie.title}
                style={{ width: '50px', height: '75px', objectFit: 'cover', borderRadius: '4px' }}
              />
              <div>
                <p style={{ margin: 0, fontWeight: 'bold' }}>{movie.title}</p>
                <p style={{ margin: '5px 0 0', fontSize: '0.85rem', color: '#aaa' }}>
                  {movie.year} • {movie.language}
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onSelectMovie(movie); }}
                style={{ marginLeft: 'auto', background: '#e50914', color: 'white', border: 'none', padding: '5px 15px', borderRadius: '4px', cursor: 'pointer' }}
              >
                Add
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MovieSearchModal;
