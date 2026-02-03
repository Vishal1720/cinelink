import { useState, useEffect } from 'react';
import { supabase } from './supabase.js';
import UserHeader from './UserHeader';
import { useNavigate } from 'react-router-dom';
import './CastDetails.css';
import { useParams } from 'react-router-dom';
const CastDetails = () => {
const { castId } = useParams();
const navigate = useNavigate();
  const [cast, setCast] = useState(null);
  const [movies, setMovies] = useState([]);
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCastDetails = async () => {
      try {
        setLoading(true);

        // Fetch cast details
        const { data: castData, error: castError } = await supabase
          .from('cast')
          .select('*')
          .eq('id', castId)
          .single();

        if (castError) throw castError;
        setCast(castData);

        // Fetch movies featuring this cast using the junction table
        const { data: castMoviesData, error: castMoviesError } = await supabase
          .from('cast_in_movies')
          .select('movie_id')
          .eq('cast_id', castId);

        if (castMoviesError) throw castMoviesError;

        if (castMoviesData && castMoviesData.length > 0) {
          const movieIds = castMoviesData.map(item => item.movie_id);

          // Fetch actual movie details for movies (type = 'movie')
          const { data: moviesData, error: moviesError } = await supabase
            .from('movies')
            .select('*')
            .in('id', movieIds)
            .eq('type', 'Movie')
            .order('year', { ascending: false })
            ;

          if (moviesError) throw moviesError;
          setMovies(moviesData || []);

          // Fetch actual movie details for series (type = 'series')
          const { data: seriesData, error: seriesError } = await supabase
            .from('movies')
            .select('*')
            .in('id', movieIds)
            .eq('type', 'Series')
            .order('year', { ascending: false })
            ;

          if (seriesError) throw seriesError;
          setSeries(seriesData || []);
        }

      } catch (error) {
        console.error('Error fetching cast details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (castId) {
      fetchCastDetails();
    }
  }, [castId]);

  if (loading) {
    return (
      <div className="cast-details-loading">
        <div className="cast-details-spinner"></div>
      </div>
    );
  }

  if (!cast) {
    return (
      <div className="cast-details-error">
        <p>Cast member not found</p>
      </div>
    );
  }

  return (
    <div className="cast-details-container" style={{marginTop:"12vh"}}>
      <UserHeader />
      
      <div className="cast-details-layout">
        {/* Sidebar */}
        <aside className="cast-details-sidebar">
          <div className="cast-details-sidebar-content">
            {/* Profile Image */}
            <div className="cast-details-profile-wrapper">
              <div className="cast-details-profile-glow"></div>
              <div className="cast-details-profile-image">
                <div 
                  className="cast-details-profile-bg"
                  style={{ backgroundImage: `url(${cast.avatar_url || 'https://via.placeholder.com/400x600'})` }}
                ></div>
               
              </div>
            </div>

            {/* Name and Role */}
            <div className="cast-details-header">
              <h1 className="cast-details-name">{cast.cast_name}</h1>
              <div className="cast-details-roles">
              </div>
            </div>

            {/* Biography */}
            {/* <div className="cast-details-bio-section">
              <h3 className="cast-details-bio-title">Biography</h3>
              <p className="cast-details-bio-text">
                {cast.ai_summary || 'No biography available.'}
              </p>
              <button className="cast-details-bio-expand">
                Read full bio 
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div> */}

            
          </div>
        </aside>

        {/* Main Content */}
        <main className="cast-details-main">
          <div className="cast-details-main-bg"></div>
          
          {/* Breadcrumb */}
          <div className="cast-details-breadcrumb">
            <a href="#" className="cast-details-breadcrumb-link">Home</a>
            <span className="cast-details-breadcrumb-sep">/</span>
            <a href="#" className="cast-details-breadcrumb-link">People</a>
            <span className="cast-details-breadcrumb-sep">/</span>
            <span className="cast-details-breadcrumb-current">{cast.cast_name}</span>
          </div>
        {movies.length > 0 && (
          <>
          {/* Feature Films Section */}
          <section className="cast-details-section">
            <div className="cast-details-section-header" >
              <h3 className="cast-details-section-title">Feature Movies</h3>
              
            </div>
            <div className="cast-details-scroll-container">
              {movies.map((movie) => (
                <div key={movie.id} className="cast-details-card" onClick={()=>{navigate(`/movie/${movie.id}`)}} style={{cursor:"pointer"}}>
                  <div className="cast-details-card-image">
                    <div 
                      className="cast-details-card-bg"
                      style={{ backgroundImage: `url(${movie.poster_url || 'https://via.placeholder.com/300x450'})` }}
                    ></div>
                  
                  </div>
                  <h4 className="cast-details-card-title">{movie.title}</h4>
                  <p className="cast-details-card-year">{movie.year}</p>
                </div>
              ))}
            </div>
          </section>
          </>)}

          {/* TV Series Section */}
            {series.length > 0 && (<>
          <section className="cast-details-section cast-details-section-alt">
            <div className="cast-details-section-header">
              <h3 className="cast-details-section-title">Feature Series</h3>
             
            </div>
            <div className="cast-details-scroll-container">
              {series.map((show) => (
                <div key={show.id} className="cast-details-card">
                  <div className="cast-details-card-image">
                    <div 
                      className="cast-details-card-bg"
                      style={{ backgroundImage: `url(${show.poster_url || 'https://via.placeholder.com/300x450'})` }}
                    ></div>
                   
                  </div>
                  <h4 className="cast-details-card-title">{show.title}</h4>
                  <p className="cast-details-card-year">{show.year}</p>
                </div>
              ))}
            </div>
          </section>
          </>)}
        </main>
      </div>
    </div>
  );
};

export default CastDetails;