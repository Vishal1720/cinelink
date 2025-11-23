import React, { useState, useEffect } from 'react';
import "./AddMovies.css";
import { supabase } from "./supabase";

const AddMovies = () => {
  const [activeTab, setActiveTab] = useState("core");

  // Store selected genres by primary key (genre_name)
  const [selectedGenres, setSelectedGenres] = useState([]);

  const [posterPreview, setPosterPreview] = useState(null);
const handleDynamicUrlChange = (urlName, value) => {
  setFormData(prev => ({
    ...prev,
    streamingLinks: {
      ...prev.streamingLinks,
      [urlName]: value
    }
  }));
};


  const [formData, setFormData] = useState({
    title: "",
    releaseYear: "",
    description: "",
    duration: "",
   streamingLinks: {} // dynamic URLs go here
  });

  const [genres, setGenres] = useState([]);
  const [urlnames, setUrlNames] = useState([]);

  // Fetch genres from Supabase
  const fetchGenres = async () => {
    const { data, error } = await supabase.from("genre").select("*");
    if (error) {
      console.error("Error fetching genres:", error);
      setGenres([]);
      return;
    }
    setGenres(data || []);
  };

  // Fetch URL list from table
  const fetchUrlNames = async () => {
    const { data, error } = await supabase.from("urls").select("*");
    if (error) {
      console.error("Error fetching URL names:", error);
      setUrlNames([]);
      return;
    }
    setUrlNames(data || []);
  };

  useEffect(() => {
    fetchGenres();
    fetchUrlNames();
  }, []);

  // Toggle genre using PK (genre_name)
  const handleGenreToggle = (genreName) => {
    setSelectedGenres((prev) =>
      prev.includes(genreName)
        ? prev.filter((g) => g !== genreName) // remove
        : [...prev, genreName] // add
    );
  };

  // Form input handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Poster upload - click
  const handlePosterUpload = (e) => {
    const file = e.target.files?.[0];
    if (file && file.size <= 5 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onloadend = () => setPosterPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Drag & drop poster
  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.size <= 5 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onloadend = () => setPosterPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="add-movie-container">
      <h1 className="page-title">Add New Movie</h1>

      <div className="content-card">
        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === "core" ? "active" : ""}`}
            onClick={() => setActiveTab("core")}
          >
            Core Details
          </button>

          <button
            className={`tab ${activeTab === "crew" ? "active" : ""}`}
            onClick={() => setActiveTab("crew")}
          >
            Crew & Cast
          </button>
        </div>

        {/* CORE DETAILS */}
        {activeTab === "core" && (
          <div className="form-content">

            <div className="form-row">
              {/* Title, Year, Duration */}
              <div className="title-year-group">

                <div className="form-group">
                  <label>Movie Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    placeholder="Enter official movie title"
                    onChange={handleInputChange}
                    className="input-field"
                  />
                </div>

                <div className="form-group">
                  <label>Release Year</label>
                  <input
                    type="number"
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
                    placeholder="e.g., 150"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Poster Upload */}
              <div className="form-group poster-upload">
                <label>Poster Image</label>
                <div
                  className="upload-area"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById("poster-input")?.click()}
                >
                  {posterPreview ? (
                    <img
                      src={posterPreview}
                      alt="Poster preview"
                      className="poster-preview"
                    />
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
                    style={{ display: "none" }}
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="description-poster-row">
              <div className="form-group description-group">
                <label>Description</label>
                <textarea
                  name="description"
                  placeholder="Enter the movie description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="6"
                  className="textarea-field"
                />
              </div>
            </div>

            {/* GENRE */}
            <div className="form-group full-width">
              <label>Genre</label>

              <div className="genre-buttons">
                {genres.map((genre) => (
                  <button
                    key={genre.genre_name} // PK used as key
                    type="button"
                    className={`genre-btn ${
                      selectedGenres.includes(genre.genre_name)
                        ? "selected"
                        : ""
                    }`}
                    onClick={() => handleGenreToggle(genre.genre_name)}
                  >
                    {genre.genre_name}
                  </button>
                ))}
              </div>
            </div>

            {/* STREAMING LINKS */}
            <div className="streaming-section">
              <h2 className="section-title">Streaming Platform Links</h2>

              <div className="form-row">
                {urlnames.map(platform => (
      <div className="form-group" key={platform.ott_name}>
        <label>{platform.ott_name}</label>
        <input
          type="url"
          placeholder="Enter URL"
          value={formData.streamingLinks?.[platform.ott_name] || ""}
          onChange={(e) => handleDynamicUrlChange(platform.ott_name, e.target.value)}
          className="input-field"
        />
      </div>
    ))}
              </div>
            </div>

            {/* NEXT BTN */}
            <div className="form-actions">
              <button
                className="btn-next"
                onClick={() => setActiveTab("crew")}
              >
                Next: Crew & Cast →
              </button>
            </div>
          </div>
        )}

        {/* CREW TAB */}
        {activeTab === "crew" && (
          <div className="form-content">
            <p className="placeholder-text">
              Crew & Cast section content goes here...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddMovies;
