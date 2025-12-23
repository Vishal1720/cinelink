import React, { useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";
import "./GenreRecommendationSection.css";
import { useNavigate } from "react-router-dom";

export default function LikeBasedRecommendationSection({ movieid }) {
  const [suggested, setSuggested] = useState([]);
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  const fetchSuggestions = async () => {
    // 1️⃣ Get recommended movie IDs from VIEW
    const { data: recRows, error: recError } = await supabase
      .from("movie_positive_recommendations")
      .select("recommended_movie_id, total_score")
      .eq("source_movie_id", movieid)
      .order("total_score", { ascending: false })
      .gt("total_score", 5) // only strong recommendations
      .limit(10);

    if (recError || !recRows || recRows.length === 0) {
      setSuggested([]);
      return;
    }

    const movieIds = recRows.map(r => r.recommended_movie_id);

    // 2️⃣ Fetch movie details
    const { data: moviesData, error: mError } = await supabase
      .from("movies")
      .select("*")
      .in("id", movieIds);

    if (!mError) {
      setSuggested(moviesData || []);
    }
  };

  useEffect(() => {
    if (!movieid) return;
    fetchSuggestions();
  }, [movieid]);

  const scrollLeft = () => {
    scrollRef.current.scrollBy({ left: -300, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollRef.current.scrollBy({ left: 300, behavior: "smooth" });
  };

  if (suggested.length === 0) return null;

  return (
    <div className="genre-rec-section">
      <h2 className="genre-rec-title">
        <span className="part1">If you liked this,</span>{" "}
        <span className="part2">try these</span>
      </h2>

      <div className="scroll-wrapper">
        <button className="scroll-btn left" onClick={scrollLeft}>❮</button>

        <div className="genre-rec-scroll" ref={scrollRef}>
          {suggested.map((movie) => (
            <div
              className="genre-rec-card"
              key={movie.id}
              onClick={() => navigate(`/movie/${movie.id}`)}
            >
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
