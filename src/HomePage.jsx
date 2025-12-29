import React, { useState, useEffect,useRef } from 'react';
import UserHeader from './UserHeader';
import {supabase} from './supabase.js';
import './HomePage.css';
import { useNavigate } from 'react-router-dom';
import TopRatedSection from './TopRatedSection.jsx';
import GenreRecommendationSection from './GenreRecommendationSection';
import OttMovieRecommendation from './OttMovieRecommendation.jsx';

const HomePage = () => {
    const navigate = useNavigate();
  const [currentBanner, setCurrentBanner] = useState(0);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
const [homeGenres, setHomeGenres] = useState([]);
const [ottnames, setOttnames] = useState([]);
// fetch banners ONCE
useEffect(() => {
  fetchBanners();
}, []);

 // fetch random home genres ONLY ONCE
useEffect(() => {
  fetchHomeGenres();
}, []);

const fetch_ottnames = async () => {
  const { data, error } = await supabase
    .from("urls")
    .select("ott_name")
    
  if (error || !data) return;

  const names = data.map(item => item.ott_name);

  const randomFour = [...names]
    .sort(() => Math.random() - 0.5)
    .slice(0, 4);

  setOttnames(names);
};

useEffect(() => {
  fetch_ottnames();
}, []);

const fetchHomeGenres = async () => {
  const { data, error } = await supabase
    .from("genre")
    .select("genre_name");

  if (error || !data) return;

  const shuffled = [...data]
    .map(g => g.genre_name)// converts objects → array of genre names
    .sort(() => Math.random() - 0.5)// shuffles the array randomly
    .slice(0, 5); // takes the first 4 items
  setHomeGenres(shuffled);
};

  const fetchBanners = async () => {
    try {
      setLoading(true);
      
      // Fetch banners with related movie information
      const { data, error } = await supabase
        .from('bannerdetails')
        .select(`
          id,
          created_at,
          banner_url,
          banner_desc,
          movie_id,
          movies (
            id,
            title,
            year,
            duration,
            poster_url,
            desc,
            trailer_link,
            language,
            type
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
 console.log('Fetched banners:', data);
      setBanners(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching banners:', err);
      setError('Failed to load banners');
      
      // Fallback demo data
      setBanners([
        {
          id: 1,
          banner_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBTOSgo53glsFfWNctlIh1bxADQnOF-dM2PjEO1rKGUbwrQnuA7jzdk6YB2NaJ9VpYzi-H1cqSWoJ6O08K6u6zp6fKfgSL60NVWneJJhGw3EH49jlEREbav_MkYvaE0mVDY3Fdw0VW8YcDQljmtsTJlpRbQP6YKYC3Gg8GtJOjZIvksmGjj3WwjDWkY3fSZ35uRfFgS3GjMU6u9I3R2otH3upL2A4bzTp6V2qzkVFxPuZo8y4HbtalRnXNGDCcKYui9N1CkEFZaFv8e',
          movie_id: 1,
          
          movies: {
            title: 'Interstellar Odyssey',
            year: '2024',
            duration: '2h 45m',
            desc: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
            type: 'Sci-Fi, Adventure'
          }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentBanner((prev) => (prev + 1) % banners.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [banners.length]);

  const handleBannerNav = (index) => {
    setCurrentBanner(index);
  };

  if (loading) {
    return (
      <div className="homepage">
        <UserHeader />
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading amazing content...</p>
        </div>
      </div>
    );
  }

  if (error && banners.length === 0) {
    return (
      <div className="homepage">
        <UserHeader />
        <div className="error-state">
          <span className="material-icons-round error-icon">error_outline</span>
          <p>{error}</p>
          <button onClick={fetchBanners} className="btn-retry">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (banners.length === 0) {
    return (
      <div className="homepage">
        <UserHeader />
        <div className="loading">No banners available</div>
      </div>
    );
  }

  const activeBanner = banners[currentBanner];
  const movieInfo = activeBanner?.movies;

  return (
    <>
    <UserHeader />
    <div className="homepage">
      
      
      <div className="hero-banner">
        <div className="banner-image-container">
          <img
            src={activeBanner?.banner_url || ''}
            alt={movieInfo?.title || 'Featured Movie'}
            className="banner-image"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/1920x1080/0f172a/06b6d4?text=CineVerse';
            }}
          />
          <div className="banner-gradient-overlay"></div>
          <div className="banner-side-gradient"></div>
        </div>

        <div className="banner-content">
          <div className="banner-info">
            {/* <span className="banner-badge">Featured Premiere</span> */}
            <h1 className="banner-title">
              {movieInfo?.title ? (
                <>
                  {movieInfo.title.split(' ').slice(0, -1).join(' ')} <br />
                  <span className="banner-highlight">
                    {movieInfo.title.split(' ').slice(-1)}
                  </span>
                </>
              ) : (
                <>
                  Discover Amazing <br />
                  <span className="banner-highlight">Cinema</span>
                </>
              )}
            </h1>
            
            {movieInfo && (
              <div className="banner-meta">
                {movieInfo.year && <span>{movieInfo.year}</span>}
                {movieInfo.duration && (
                  <>
                    <span>•</span>
                    <span>{movieInfo.duration}</span>
                  </>
                )}
                {movieInfo.type && (
                  <>
                    <span>•</span>
                    <span>{movieInfo.type}</span>
                  </>
                )}
                {movieInfo.language && (
                  <>
                    <span>•</span>
                    <span>{movieInfo.language}</span>
                  </>
                )}
              </div>
            )}

            <p className="banner-description">
             {activeBanner?.banner_desc || movieInfo?.desc}
              
            </p>
            
            <div className="banner-actions">
              {movieInfo?.trailer_link ? (
                <a 
                  href={movieInfo.trailer_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-primary"
                >
                 <span className="material-icons-round">play_arrow</span>

                  Watch Trailer
                </a>
              ) : (
                <button className="btn-primary">
                  <span className="material-symbols-outlined">play_arrow</span>
                  Explore Now
                </button>
              )}
              <button
  className="btn-secondary"
  onClick={() => navigate(`/movie/${activeBanner.movie_id}`)}
>
  <span className="material-symbols-outlined">info</span>
  View Details
</button>
            </div>
          </div>
        </div>

        {banners.length > 1 && (
          <div className="banner-navigation">
            {banners.map((_, index) => (
              <button
                key={index}
                className={`banner-dot ${index === currentBanner ? 'active' : ''}`}
                onClick={() => handleBannerNav(index)}
                aria-label={`Go to banner ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
     {homeGenres.map((genre) => (
  <GenreRecommendationSection
    key={genre}
    genres={[genre]}
    title={`${genre}`}
    width='all'
    genre_name={genre}
    general
  />
))}
    </div>
    <TopRatedSection
    limit={10}
    title="Top Rated Picks"
  />
  {ottnames.map((ottname) => {
    return <OttMovieRecommendation key={ottname} ottname={ottname}  width='all' />;
  })  
  }
 
 
    </>
  );
};

export default HomePage;