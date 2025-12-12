import React, { useEffect, useState } from "react";
import "./UserMovieListPage.css";
import UserHeader from "./UserHeader";
import { supabase } from './supabase';
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";

const UserMovieListPage = ({type}) => {
  const [genres, setGenres] = useState([]);
  const [movies, setMovies] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState("All Genres");
  const [searchTerm, setSearchTerm] = useState("");
  const [genresExpanded, setGenresExpanded] = useState(true);
  const [expandedFilter, setExpandedFilter] = useState(null);
  const navigate = useNavigate();
const [selectedLanguage, setSelectedLanguage] = useState("All Languages");

const [languages, setLanguages] = useState([]);


const [languageExpanded, setLanguageExpanded] = useState(false);


  const fetchRatingSummary = async (movieId) => {
    const { data, error } = await supabase
      .from("reviews")
      .select(`
        id,
        rating_cat,
        rating_cat:rating_cat (
          id,
          cat_name,
          cat_emoji
        )
      `)
      .eq("movie_id", movieId);

    if (error) return null;
    if (!data || data.length === 0) return null;

    const total = data.length;
    const countMap = {};
    const emojiMap = {};
    
    data.forEach((r) => {
      const cat = r.rating_cat.cat_name;
      countMap[cat] = (countMap[cat] || 0) + 1;
      emojiMap[cat] = r.rating_cat.cat_emoji;
    });

    // Find highest
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
      emoji_pic: emoji
    };
  };

  function showmovieDetails(id){
    navigate(`/movie/${id}`);
  }

  useEffect(() => {
    const fetchGenres = async () => {
      const { data, error } = await supabase.from('genre').select('*').order('genre_name', { ascending: true });
      if (error) {
        console.error('Error fetching genres:', error);
      } else {
        setGenres(["All Genres", ...data.map(g => g.genre_name)]);
      }
    };

    const fetchMovies = async () => {
      let movdata, moverror;
      if(type === "Movie" || type === "Series"){
        ({ data: movdata, error: moverror } = await supabase
          .from("movies")
          .select(`
            *,
            genre_in_movies (
              genre_name
            )
          `).eq("type", type).order('title', { ascending: true }));
      } else {
        ({ data: movdata, error: moverror } = await supabase
          .from("movies")
          .select(`
            *,
            genre_in_movies (
              genre_name
            )
          `).order('title', { ascending: true }));
      }

      if (moverror) {
        console.error('Error fetching movies:', moverror);
      } else {
        const moviesWithRatings = await Promise.all(
          movdata.map(async (m) => {
            const summary = await fetchRatingSummary(m.id);
            return { ...m, ratingSummary: summary };
          })
        );
        setMovies(moviesWithRatings);
        const uniqueLanguages = ["All Languages", ...new Set(moviesWithRatings.map(m => m.language))];
setLanguages(uniqueLanguages);


      }
    };

    fetchGenres();
    fetchMovies();
  }, [type]);

  // Filter movies based on selected genre and search text
  const filteredMovies = movies.filter(movie => {
    const movieGenres = movie.genre_in_movies.map(g => g.genre_name);
    const matchesGenre = selectedGenre === "All Genres" || movieGenres.includes(selectedGenre);
    const matchesSearch = movie.title.toLowerCase().includes(searchTerm.toLowerCase());
     const matchesLanguage = selectedLanguage === "All Languages" || movie.language === selectedLanguage;
  
 
  
return matchesGenre && matchesSearch && matchesLanguage;
  });

  return (
    <div>
      <UserHeader />
      <main className="main-content">
        <div className="content-wrapper">
          <section className="filter-section">
  <div className="filter-row">
    <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1}}>
      <button 
        className="genre-toggle-button" 
        onClick={() => setExpandedFilter(expandedFilter === 'genres' ? null : 'genres')}
      >
        <span>Genres</span>
        <span className={`toggle-icon ${expandedFilter === 'genres' ? 'expanded' : ''}`}>
          ▼
        </span>
      </button>

      <button 
        className="genre-toggle-button" 
        onClick={() => setExpandedFilter(expandedFilter === 'language' ? null : 'language')}
      >
        <span>Language</span>
        <span className={`toggle-icon ${expandedFilter === 'language' ? 'expanded' : ''}`}>
          ▼
        </span>
      </button>
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
    </div>
  </div>

  {/* Genres Content */}
  <div className={`genre-scroll-wrapper ${expandedFilter === 'genres' ? 'expanded' : 'collapsed'}`}>
    <div className="genre-scroll">
      <div className="genre-buttons">
        {genres.map((genre, index) => (
          <button
            key={index}
            className={selectedGenre === genre ? "genre-button active" : "genre-button"}
            onClick={() => setSelectedGenre(genre)}
          >
            <p className="genre-text">{genre}</p>
          </button>
        ))}
      </div>
    </div>
  </div>

  {/* Language Content */}
  <div className={`genre-scroll-wrapper ${expandedFilter === 'language' ? 'expanded' : 'collapsed'}`}>
    <div className="genre-scroll">
      <div className="genre-buttons">
        {languages.map((lang, index) => (
          <button 
            key={index} 
            className={selectedLanguage === lang ? "genre-button active" : "genre-button"} 
            onClick={() => setSelectedLanguage(lang)}
          >
            <p className="genre-text">{lang}</p>
          </button>
        ))}
      </div>
    </div>
  </div>
</section>

          <section className="movies-section">
            <div className="movies-grid">
              {filteredMovies.map((movie) => (
                console.log(movie),
                <div key={movie.id} className="movie-card" onClick={() => showmovieDetails(movie.id)}>
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
              ))}
            </div>
          </section>
        </div>
      </main>
      <footer className="footer">
        <p className="footer-text">© 2025 CineVerse. All rights reserved.</p>
        <div className="footer-links">
          <a className="footer-link" href="#">About Us</a>
          <a className="footer-link" href="#">Contact</a>
          <a className="footer-link" href="#">Privacy Policy</a>
        </div>
      </footer>
    </div>
  );
};

export default UserMovieListPage;