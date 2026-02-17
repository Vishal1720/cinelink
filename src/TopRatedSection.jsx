import React, { useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";
import "./GenreRecommendationSection.css";
import { useNavigate } from "react-router-dom";

export default function TopRatedSection({
  movieid,
  limit = 10,
  title = "Top Rated Picks",
  type = "all"
}) {
  const [suggested, setSuggested] = useState([]);
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  const fetchSuggestions = async () => {
    // 1️⃣ Fetch movies
    let query=supabase
      .from("movies")
      .select(`
        id,
        title,
        poster_url,
        genre_in_movies ( genre_name )
      `)
      .neq("id", movieid ?? -1);
      if(type!=="all"){
        query=query.eq("type", type);
      }
    const { data: movies, error } = await query;

    

    if (error || !movies) {
      console.error(error);
      return;
    }

    // 2️⃣ Attach rating summary (same logic as your list page)
    const moviesWithRatings = await Promise.all(
      movies.map(async (movie) => {
        const { data: reviews } = await supabase
          .from("reviews")
          .select(`
            rating_cat:rating_cat (
              id,
              cat_name,
              cat_emoji
            )
          `)
          .eq("movie_id", movie.id);

        if (!reviews || reviews.length === 0) return null;

        const total = reviews.length;
        const countMap = {};
        const emojiMap = {};
        const idMap = {};

        reviews.forEach(r => {
          const name = r.rating_cat.cat_name;
          countMap[name] = (countMap[name] || 0) + 1;
          emojiMap[name] = r.rating_cat.cat_emoji;
          idMap[name] = r.rating_cat.id;
        });

        let bestCat = null;
        let bestCount = 0;

        for (const cat in countMap) {
          if (countMap[cat] > bestCount) {
            bestCat = cat;
            bestCount = countMap[cat];
          }
        }

        return {
          ...movie,
          ratingCatId: idMap[bestCat],
          ratingPercentage: Math.round((bestCount / total) * 100),
          ratingEmoji: emojiMap[bestCat]
        };
      })
    );

    // 3️⃣ Sort & take top N
    const topRated = moviesWithRatings
      .filter(Boolean)
      .sort((a, b) => {
        if (b.ratingCatId !== a.ratingCatId) {
          return b.ratingCatId - a.ratingCatId;
        }
        return b.ratingPercentage - a.ratingPercentage;
      })
      .slice(0, limit);

    setSuggested(topRated);
  };

  useEffect(() => {
    fetchSuggestions();
  }, [movieid, limit]);

  const scrollLeft = () => {
    scrollRef.current.scrollBy({ left: -300, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollRef.current.scrollBy({ left: 300, behavior: "smooth" });
  };

  if (suggested.length === 0) return null;

  return (
    <div className="genre-rec-section" style={{ width: "100%" }}>
      <div className="genre-rec-title">
        <span className="part2">{title}</span>
      </div>

      <div className="scroll-wrapper">
        <button className="scroll-btn left" onClick={scrollLeft}>❮</button>

        <div className="genre-rec-scroll" ref={scrollRef}>
          {suggested.map(movie => (
            <div
              key={movie.id}
              className="genre-rec-card"
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
