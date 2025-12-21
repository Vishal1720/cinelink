import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from './supabase';
import UserHeader from './UserHeader';
import OttMovieRecommendation from './OttMovieRecommendation';
import './MovieDetails.css';
import ReviewsSection from './ReviewsSection';
import RatingDonutChart from "./RatingDonutChart";
import GenreRecommendationSection from './GenreRecommendationSection';
const MovieDetails = () => {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [genres, setGenres] = useState([]);
  const [cast, setCast] = useState([]);
  const [ottPlatforms, setOttPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRating, setSelectedRating] = useState(null);
  const [reviewCounts, setReviewCounts] = useState({});




  const [ratingCategories, setRatingCategories] = useState([]);//for pie chart
const pieData = ratingCategories.map((cat) => ({
  id: cat.id ,
  name: cat.cat_name,
  value: reviewCounts[cat.id] || 0,
  emoji: cat.cat_emoji
})).filter((item) => item.value > 0); // ❗ remove zero-value categories;

const totalReviews = Object.values(reviewCounts).reduce((a, b) => a + b, 0);


const fetchRatingCategories = async () => {//rating details for pie chart
  const { data, error } = await supabase
    .from("ratingnames")
    .select("id, cat_name, cat_emoji")
    .order("id", { ascending: true });

  if (!error) setRatingCategories(data);
};

  
const countCategoryById = async (movieId, catId) => {
  const { count } = await supabase
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("movie_id", movieId)
    .eq("rating_cat", catId);

  return count || 0;
};

const fetchReviewCounts = async () => {
        const counts = {};
        for (let catId = 1; catId <= 4; catId++) {
          counts[catId] = await countCategoryById(id, catId);
        }
        setReviewCounts(counts);
     
      };

  useEffect(() => {
    if (id) {
      fetchMovieDetails();
      // Fetch review counts for each category
      fetchReviewCounts();
       fetchRatingCategories(); 
       
    }
  }, [id]);

  const fetchMovieDetails = async () => {
    try {
      setLoading(true);

      // 1️⃣ Fetch movie base data
      const { data: movieData, error: movieError } = await supabase
        .from("movies")
        .select("*")
        .eq("id", id)
        .single();
      
      if (movieError) throw movieError;

      // 2️⃣ Fetch genres 
      const { data: genreData, error: genreError } = await supabase
        .from("genre_in_movies")
        .select(`
            genre_name
        `)
        .eq("movie_id", id).order('genre_name', { ascending: true });

      if (genreError) throw genreError;

      

      // 3️⃣ Fetch cast (join cast table)
    const { data: castData, error: castError } = await supabase
  .from("cast_in_movies")
  .select(`
    role_in_movie,
    cast:cast_id (
      id,
      cast_name,
      avatar_url
    )
  `)
  .eq("movie_id", id);


         
      if (castError) throw castError;

      // 4️⃣ Fetch OTT platforms (join with urls table)
      const { data: ottData, error: ottError } = await supabase
        .from("url_in_movies")
        .select("urls(ott_name, logo_url), ott_link,ott_name")
        .eq("movie_id", id);

      if (ottError) throw ottError;

      setMovie(movieData);
      setGenres(genreData || []);
      setCast(castData || []);
      setOttPlatforms(ottData || []);
      
    } catch (error) {
      console.error("Error fetching movie details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRating = (rating) => {
    setSelectedRating(rating);

  };

  const getOttIcon = (ottName) => {
    const icons = {
      'Netflix': (
        <svg className="w-6 h-6" fill="currentColor" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <title>Netflix</title>
          <path d="M10.597.439L.918 23.332h3.895l1.854-4.855h5.996l1.94 4.855h3.931L13.403.439h-2.806zm-.124 4.047h.062l3.41 9.42h-6.95l3.478-9.42z"></path>
        </svg>
      ),
      'Amazon Prime': (
        <svg className="w-6 h-6" fill="currentColor" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <title>Amazon Prime Video</title>
          <path d="M2.52 23.364l5.424-5.364h2.52l-5.652 5.616A11.952 11.952 0 010 12C0 5.376 5.376 0 12 0s12 5.376 12 12-5.376 12-12 12a12.012 12.012 0 01-9.48-2.636zM11.7 13.056c.48.24 1.224.624 1.836.84.432.144.936.216 1.344.216.744 0 1.224-.168 1.488-.504.24-.312.288-.792.192-1.488l-.504-2.88c-.096-.6-.096-1.128.048-1.512.144-.408.552-.696 1.2-.696.576 0 1.056.216 1.416.624.048.048.096.072.12.12l-1.128 1.44c-.216-.312-.48-.528-.84-.528-.312 0-.48.168-.528.48-.024.168-.024.504.048 1.008l.504 2.88c.144.816.12 1.512-.12 2.04-.24.552-.744.9-1.536.9-1.008 0-1.872-.36-2.52-.96l-2.424 2.376c.744.576 1.584.984 2.52 1.224a7.32 7.32 0 003.36.336c2.472 0 4.224-.96 5.232-2.856.36-1.2.36-3.384.36-3.816v-2.112h-3.624l-1.056-5.328H20.4V.024h-5.904l-.84 4.2H11.4v4.44h2.304L11.7 13.056z"></path>
        </svg>
      )
    };
    return icons[ottName] || icons['Netflix'];
  };

  if (loading) {
    return (
      <div className="moviedetails-container">
        <UserHeader />
        <div className="moviedetails-loading">Loading...</div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="moviedetails-container">
        <UserHeader />
        <div className="moviedetails-error">Movie not found</div>
      </div>
    );
  }

  const ottNames = ottPlatforms.map(
  (ott) => ott.ott_name || ott.urls?.ott_name
);

const uniqueOttNames = [...new Set(ottNames)];

  return (
    <div className="moviedetails-container">
      <UserHeader />
      
      <div className="moviedetails-content">
        <div className="moviedetails-hero">
          <div className="moviedetails-poster">
            <img 
              src={movie.poster_url || 'https://via.placeholder.com/350x500'} 
              alt={`${movie.title} poster`}
            />
          </div>

          <div className="moviedetails-info">
            <h1 className="moviedetails-title">{movie.title}</h1>

            <div className="moviedetails-genre-tags">
              {genres.map((item, index) => (
                <span key={index} className="moviedetails-genre-tag">
                  {item.genre?.genre_name || item.genre_name}
                </span>
              ))}
            </div>

            <div className="moviedetails-meta">
              <span>{movie.duration || '2h 15m'}</span>
              <span className="moviedetails-dot"></span>
              <span>{movie.year || '2024'}</span>
              <span className="moviedetails-dot"></span>
              <span>{movie.language || 'Hindi'}</span>
            </div>

            <p className="moviedetails-description">
              {movie.desc || 'No description available.'}
            </p>

            <div className="moviedetails-actions">
              {movie.trailer_link && (
                <a 
                  href={movie.trailer_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="moviedetails-btn-primary"
                >
                  <span className="material-symbols-outlined">play_arrow</span>
                  <span>Watch Trailer</span>
                </a>
              )}

              <div className="moviedetails-ott-buttons">
                {ottPlatforms.map((ott, index) => (
                  <a 
                    key={index}
                    href={ott.ott_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="moviedetails-btn-ott"
                    title={ott.urls?.ott_name}
                  >
                    {ott.urls?.logo_url ? (
                      <img src={ott.urls.logo_url}  loading="lazy" alt={ott.urls.ott_name} className="moviedetails-ott-logo" />
                    ) : (
                      getOttIcon(ott.urls?.ott_name)
                    )}
                  </a>
                ))}
              </div>
            </div>

          </div>
        </div>
       

        {cast.length > 0 && (
        <div className="moviedetails-cast-section">
          <h3 className="moviedetails-section-title">Cast</h3>
          <div className="moviedetails-cast-list">
            {cast.map((member, index) => (
              <div key={index} className="moviedetails-cast-member">
            <img
  className="moviedetails-cast-avatar"
  src={member.cast?.avatar_url || 'https://via.placeholder.com/144'}
  alt={member.cast?.cast_name || "Cast member"}
  loading="lazy"
/>

                <p className="moviedetails-cast-name">{member.cast?.cast_name}</p>
               { member.role_in_movie && (
                <p className="moviedetails-cast-role">as {member.role_in_movie}</p>)}
              </div>
            ))}
          </div>
        </div>)}

        <ReviewsSection movieId={id} pieData={pieData} totalreviews={totalReviews} summary={movie.ai_summary} moviename={movie.title} type={movie.type}/>
      </div>
      <GenreRecommendationSection genres={genres.map(g => g.genre_name || g.genre?.genre_name)} movieid={id}/> 
   {uniqueOttNames.map((ott) => (
  <OttMovieRecommendation key={ott} ottname={ott} movieid={id}
  />
))}
    </div>
  );
};

export default MovieDetails;