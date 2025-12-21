import React, { useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";
import "./GenreRecommendationSection.css";
import { useNavigate } from "react-router-dom";
export default function OttMovieRecommendation({ ottname ,movieid}) {
  const [suggested, setSuggested] = useState([]);
  const scrollRef = useRef(null);
 const navigate=useNavigate();

 const fetchSuggestions = async () => {
  const { data: ottMovies, error: gError } = await supabase
    .from("url_in_movies")
    .select("movie_id")
    .eq("ott_name", ottname).neq("movie_id", movieid);

  if (gError) {
    console.log(gError);
    return;
  }

  // Extract movie IDs
  const movieIds = [...new Set(ottMovies.map(row => row.movie_id))];

  if (movieIds.length === 0) {
    setSuggested([]);
    return;
  }

  //Fetch actual movie data
  const { data: moviesData, error: mError } = await supabase
    .from("movies")
    .select("*, url_in_movies(ott_name)")
    .in("id", movieIds)

    ;
    if(mError)
    {
          return;
    }
const randomTen =[...moviesData] 
  .sort(() => Math.random() - 0.5)
  .slice(0, 10);

  
    setSuggested(randomTen);

  
};

useEffect(() => {
  if (!ottname) return;
  fetchSuggestions();
}, [ottname, movieid]);

const scrollLeft = () => {
  scrollRef.current?.scrollBy({ left: -300, behavior: "smooth" });
};

const scrollRight = () => {
  scrollRef.current?.scrollBy({ left: 300, behavior: "smooth" });
};


  if (suggested.length === 0) return null;

  return (
    <div className="genre-rec-section">
      <h2 className="genre-rec-title"><span className="part1">More on</span> <span className="part2"> {ottname}</span></h2>

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
