import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import './UserMovieListPage.css'; // Re-use existing styles where possible
import './Watchlist.css'; // New styles for the modal if needed

const MovieSearchModal = ({ onClose, onSelectMovie, listName }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);

  // Debounce search to avoid too many requests
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim()) {
        searchMovies();
      } else {
        setMovies([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const searchMovies = async () => {
    setLoading(true);
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
    } catch (error) {
      console.error("Error searching movies:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto', background: '#1a1a1a', color: 'white', borderRadius: '12px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>Add to "{listName}"</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
        </div>

        <input
          type="text"
          placeholder="Search for a movie..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
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

        <div className="search-results" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {!loading && movies.length === 0 && searchTerm && (
            <p>No movies found.</p>
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
