import React, { useEffect, useState } from "react";
import "./UserMovieListPage.css";
import UserHeader from "./UserHeader";
import { supabase } from './supabase';

const UserMovieListPage = () => {
  const [genres, setGenres] = useState([]);
  const [movies, setMovies] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState("All Genres");
  const [searchTerm, setSearchTerm] = useState("");

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
     const { data, error } = await supabase
  .from("movies")
  .select(`
    *,
    genre_in_movies (
      genre_name
    )
  `).order('title', { ascending: true });
console.log(data);//genre_name comes as array of objects
      if (error) {
        console.error('Error fetching movies:', error);
      } else {
        setMovies(data);
      }
    };

    fetchGenres();
    fetchMovies();
  }, []);

  // Filter movies based on selected genre and search text
const filteredMovies = movies.filter(movie => {

  // Extract all genres for the current movie
  // Example: ["Action", "Drama", "Comedy"]
  const movieGenres = movie.genre_in_movies.map(g => g.genre_name);

  // Check if the selected genre matches:
  // - "All Genres" means show everything
  // - otherwise check if selectedGenre exists in this movie's genres
  const matchesGenre =
    selectedGenre === "All Genres" || movieGenres.includes(selectedGenre);

  // Check if movie title contains the search text (case-insensitive)
  const matchesSearch = movie.title
    .toLowerCase()
    .includes(searchTerm.toLowerCase());

  // Include this movie only if BOTH genre and search match
  return matchesGenre && matchesSearch;
});

  return (
    <div>
      <UserHeader />
      <main className="main-content">
        <div className="content-wrapper">
          <section className="filter-section">
            <div className="filter-row">
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
                {/* <button className="filter-button" title="Advanced Filters">
                  <span className="filter-icon">filter_alt</span>
                </button> */}
              </div>
            </div>
          </section>
          <section className="movies-section">
            <div className="movies-grid">
              {filteredMovies.map((movie, index) => (
                <div key={movie.id} className="movie-card">
                  <img
                    src={movie.poster_url}
                    alt={`Movie poster for ${movie.title}`}
                    className="movie-poster"
                  />
                  <div className="movie-info">
                    <p className="movie-title">{movie.title}</p>
                    <p className="movie-rating">Unrated</p>
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