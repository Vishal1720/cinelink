import React, { useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";
import "./GenreRecommendationSection.css";
import { useNavigate } from "react-router-dom";
export default function GenreRecommendationSection({ genres ,movieid}) {
  const [suggested, setSuggested] = useState([]);
  const scrollRef = useRef(null);
 const navigate=useNavigate();

 const fetchSuggestions = async () => {
  const { data: genreRows, error: gError } = await supabase
    .from("genre_in_movies")
    .select("movie_id")
    .in("genre_name", genres).neq("movie_id", movieid);

  if (gError) {
    console.log(gError);
    return;
  }

  // Extract movie IDs
  const movieIds = [...new Set(genreRows.map(row => row.movie_id))];

  if (movieIds.length === 0) {
    setSuggested([]);
    return;
  }

  // Step 2: Fetch actual movie data
  const { data: moviesData, error: mError } = await supabase
    .from("movies")
    .select("*, genre_in_movies (genre_name)")
    .in("id", movieIds)
    .limit(10);

  if (!mError) {
    setSuggested(moviesData);
    console.log(moviesData);
  }
};

  useEffect(() => {
    
    if (!genres || genres.length === 0) return;

   fetchSuggestions();

  }, [genres]);

  const scrollLeft = () => {
    scrollRef.current.scrollBy({ left: -300, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollRef.current.scrollBy({ left: 300, behavior: "smooth" });
  };

  if (suggested.length === 0) return null;

  return (
    <div className="genre-rec-section">
      <h2 className="genre-rec-title">More From These Genres</h2>

      <div className="scroll-wrapper">
        <button className="scroll-btn left" onClick={scrollLeft}>❮</button>

        <div className="genre-rec-scroll" ref={scrollRef}>
          {suggested.map((movie) => (
            <div className="genre-rec-card" key={movie.id}  onClick={() => navigate(`/movie/${movie.id}`)}> 
              <img
                src={movie.poster_url}
                className="genre-rec-poster"
                alt={movie.title}
              />
              <p className="genre-rec-name">{movie.title}</p>
            </div>
          ))}
        </div>

        <button className="scroll-btn right" onClick={scrollRight}>❯</button>
      </div>
    </div>
  );
}
