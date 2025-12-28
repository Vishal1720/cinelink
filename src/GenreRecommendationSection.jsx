import React, { useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";

import "./GenreRecommendationSection.css";
import { useNavigate } from "react-router-dom";
export default function GenreRecommendationSection({ genres ,movieid,general=false,title="More From these Genres",width="1"}) {
  const [suggested, setSuggested] = useState([]);
  const scrollRef = useRef(null);
  const hasFetchedRef = useRef(false);
 const navigate=useNavigate();

 const fetchSuggestions = async () => {
   let query = supabase
    .from("genre_in_movies")
    .select("movie_id")
    .in("genre_name", genres);

  // ❗ Only exclude current movie if NOT general
  if (!general && movieid) {
    query = query.neq("movie_id", movieid);
  }

  const { data: genreRows, error: gError } = await query;
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

  //Fetch actual movie data
  const { data: moviesData, error: mError } = await supabase
    .from("movies")
    .select("*, genre_in_movies (genre_name)")
    .in("id", movieIds)

    ;
     if (!moviesData || moviesData.length === 0) return;
const randomTen = [...moviesData] 
  .sort(() => Math.random() - 0.5)
  .slice(0, 10);

  if (!mError && moviesData.length > 6) {
    setSuggested(randomTen);

  }
};

  useEffect(() => {
    if (hasFetchedRef.current) return;
    if (!genres || genres.length === 0) return;

   fetchSuggestions();
 hasFetchedRef.current = true;
  }, [genres, movieid, general]);


  const scrollLeft = () => {
    scrollRef.current.scrollBy({ left: -300, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollRef.current.scrollBy({ left: 300, behavior: "smooth" });
  };

  if (suggested.length === 0) return null;

  return (
    <div className="genre-rec-section" style={{width:width==="1"?"89%":"100%"}}>
       {title ? (
    <div className="genre-rec-title">
      <span className="part2">{title}</span>
    </div>
  ) : (
    <div className="genre-rec-title">
      <span className="part1">More From these</span>
      <span className="part2"> Genres</span>
    </div>
  )}
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
