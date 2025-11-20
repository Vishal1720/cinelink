import React, { useState } from 'react';
import './AddMovies.css';
import { supabase } from './supabase';
import { useEffect } from 'react';
const AddMovies = () => {
  const [activeTab, setActiveTab] = useState('core');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [posterPreview, setPosterPreview] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    releaseYear: '',
    description: '',
    duration: '',
    primeVideoLink: '',
    jioHotstarLink: '',
    netflixLink: ''
  });

  const [genres, setGenres] = useState([]);
const fetchGenres = async () => {
const {data,error}=await supabase.from('genre').select('*');

  if (error) {
    console.error(error);
    setGenres([]);
    return;
  }

setGenres(data||[]);
}

useEffect(() => {
fetchGenres();
}, []);

  // const handleGenreToggle = (genre) => {
  //   setSelectedGenres(prev =>
  //     prev.includes(genre)
  //       ? prev.filter(g => g !== genre)
  //       : [...prev, genre]
  //   );
  // };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePosterUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 5 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPosterPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.size <= 5 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPosterPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="add-movie-container">
      <h1 className="page-title">Add New Movie</h1>

      <div className="content-card">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'core' ? 'active' : ''}`}
            onClick={() => setActiveTab('core')}
          >
            Core Details
          </button>
          <button
            className={`tab ${activeTab === 'crew' ? 'active' : ''}`}
            onClick={() => setActiveTab('crew')}
          >
            Crew & Cast
          </button>
        </div>

        {activeTab === 'core' && (
          <div className="form-content">
            <div className="form-row">
              <div className="title-year-group">
                <div className="form-group">
                  <label>Movie Title</label>
                  <input
                    type="text"
                    name="title"
                    placeholder="Enter the official movie title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="input-field"
                  />
                </div>

                <div className="form-group">
                  <label>Release Year</label>
                  <input
                    type="text"
                    name="releaseYear"
                    placeholder="e.g., 2023"
                    value={formData.releaseYear}
                    onChange={handleInputChange}
                    className="input-field"
                  />
                </div>

                <div className="form-group">
                  <label>Duration (minutes)</label>
                  <input
                    type="number"
                    name="duration"
                    placeholder="e.g., 120"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="form-group poster-upload">
                <label>Poster Image</label>
                <div
                  className="upload-area"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('poster-input').click()}
                >
                  {posterPreview ? (
                    <img src={posterPreview} alt="Poster preview" className="poster-preview" />
                  ) : (
                    <>
                      <div className="upload-icon">🎬</div>
                      <p className="upload-text">Drop poster here</p>
                      <p className="upload-info">or click to browse</p>
                      <p className="upload-size">Max 5MB</p>
                    </>
                  )}
                  <input
                    type="file"
                    id="poster-input"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handlePosterUpload}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
            </div>

            <div className="description-poster-row">
              <div className="form-group description-group">
                <label>Description</label>
                <textarea
                  name="description"
                  placeholder="Enter a brief synopsis of the movie"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="textarea-field"
                  rows="6"
                />
              </div>
            </div>

            <div className="form-group full-width">
              <label>Genre</label>
              <div className="genre-buttons">
                {genres.map(genre => (
                  <button
                    key={genre.id}
                    type="button"
                    className={`genre-btn ${selectedGenres.includes(genre) ? 'selected' : ''}`}
                    onClick={() => handleGenreToggle(genre)}
                  >
                    {genre.genre_name}
                  </button>
                ))}
              </div>
            </div>

            <div className="streaming-section">
              <h2 className="section-title">Streaming Platform Links</h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Prime Video Link</label>
                  <input
                    type="url"
                    name="primeVideoLink"
                    placeholder="Enter URL"
                    value={formData.primeVideoLink}
                    onChange={handleInputChange}
                    className="input-field"
                  />
                </div>
                <div className="form-group">
                  <label>JioHotstar Link</label>
                  <input
                    type="url"
                    name="jioHotstarLink"
                    placeholder="Enter URL"
                    value={formData.jioHotstarLink}
                    onChange={handleInputChange}
                    className="input-field"
                  />
                </div>

                 <div className="form-group">
                <label>Netflix Link</label>
                <input
                  type="url"
                  name="netflixLink"
                  placeholder="Enter URL"
                  value={formData.netflixLink}
                  onChange={handleInputChange}
                  className="input-field"
                />
              </div>
              </div>

             
            </div>

            <div className="form-actions">
              <button className="btn-next">
                Next: Crew & Cast →
              </button>
            </div>
          </div>
        )}

        {activeTab === 'crew' && (
          <div className="form-content">
            <p className="placeholder-text">Crew & Cast section content goes here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddMovies;