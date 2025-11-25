import React, { useState, useEffect } from 'react';
import "./AddMovies.css";
import { supabase } from "./supabase";

const AddMovies = () => {
  const [activeTab, setActiveTab] = useState("core");
  const [errors, setErrors] = useState({});

  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    releaseYear: "",
    description: "",
    duration: "",
    streamingLinks: {},
    genres: [],
    poster: ""
  });

  const [genres, setGenres] = useState([]);
  const [urlnames, setUrlNames] = useState([]);

  // Fetch genres
  const fetchGenres = async () => {
    const { data, error } = await supabase.from("genre").select("*").order("genre_name", { ascending: true });
    if (error) {
      console.error("Error fetching genres:", error);
      setGenres([]);
      return;
    }
    setGenres(data || []);
  };

  // Fetch streaming URLs
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

  const handleGenreToggle = (genreName) => {
    setFormData(prev => ({
      ...prev,
      genres: prev.genres.includes(genreName)
        ? prev.genres.filter(g => g !== genreName)
        : [...prev.genres, genreName]
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDynamicUrlChange = (urlName, value) => {
    setFormData(prev => ({
      ...prev,
      streamingLinks: { ...prev.streamingLinks, [urlName]: value }
    }));
  };

  // Poster upload
  const handlePosterUpload = (e) => {
    const file = e.target.files?.[0];
    if (file && file.size <= 1 * 1024 * 1024) {
      setPosterFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPosterPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.size <= 1 * 1024 * 1024) {
      setPosterFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPosterPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // ✅ Validation function
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = "Movie title is required.";
    if (!formData.releaseYear.trim()) newErrors.releaseYear = "Release year is required.";
    else if (isNaN(formData.releaseYear) || formData.releaseYear < 1888)
      newErrors.releaseYear = "Enter a valid year.";
    if (!formData.duration.trim()) newErrors.duration = "Duration is required.";
    else if (isNaN(formData.duration) || formData.duration <= 0)
      newErrors.duration = "Enter a valid duration.";
    if (!formData.description.trim()) newErrors.description = "Description is required.";
    if (!posterFile) newErrors.poster = "Poster image is required.";
    if (!formData.genres || formData.genres.length === 0) newErrors.genres = "Select at least one genre.";

    for (const [key, value] of Object.entries(formData.streamingLinks)) {
      if (value && !/^https?:\/\/\S+\.\S+/.test(value)) {
        newErrors.streamingLinks = "Enter valid URLs for streaming platforms.";
        break;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return; // Stop submission if validation fails

    let posterUrl = null;

    if (posterFile) {
      const fileExt = posterFile.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `posters/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("PosterBucket")
        .upload(filePath, posterFile, { cacheControl: "3600", upsert: false });

      if (uploadError) console.log("Poster upload failed:", uploadError);
      else {
        const { data } = supabase.storage.from("PosterBucket").getPublicUrl(filePath);
        posterUrl = data.publicUrl;
      }
    }

    const { data, error } = await supabase.from('movies').insert([{
      title: formData.title,
      year: formData.releaseYear,
      desc: formData.description,
      duration: formData.duration,
      poster_url: posterUrl
    }]).select();

    if (error) console.log(error);
    else {
      const movieid = data[0].id;

      // Insert genres
      if (formData.genres.length > 0) {
        const genreInserts = formData.genres.map(genre_name => ({ movie_id: movieid, genre_name }));
        await supabase.from('genre_in_movies').insert(genreInserts);
      }

      // Insert streaming links
      for (const ott_name in formData.streamingLinks) {
        const ott_link = formData.streamingLinks[ott_name];
        if (!ott_link?.trim()) continue;
        await supabase.from("url_in_movies").insert([{ movie_id: movieid, ott_name, ott_link }]);
      }

      // Reset form
      setFormData({ title: "", releaseYear: "", description: "", duration: "", streamingLinks: {}, genres: [] });
      setPosterFile(null);
      setPosterPreview(null);
      setErrors({});
      alert("Movie added successfully!");
    }
  };

  return (
    <div className="add-movie-container">
      <h1 className="page-title">Add New Movie</h1>

      <div className="content-card">
        {/* Tabs */}
        <div className="tabs">
          <button className={`tab ${activeTab === "core" ? "active" : ""}`} onClick={() => setActiveTab("core")}>Core Details</button>
          <button className={`tab ${activeTab === "crew" ? "active" : ""}`} onClick={() => setActiveTab("crew")}>Crew & Cast</button>
        </div>

        {/* CORE DETAILS */}
        {activeTab === "core" && (
          <div className="form-content">
            <div className="form-row">
              <div className="title-year-group">
                <div className="form-group">
                  <label>Movie Title</label>
                  <input type="text" name="title" value={formData.title} onChange={handleInputChange} className="input-field" />
                  {errors.title && <p className="error-text">{errors.title}</p>}
                </div>

                <div className="form-group">
                  <label>Release Year</label>
                  <input type="number" name="releaseYear" value={formData.releaseYear} onChange={handleInputChange} className="input-field" />
                  {errors.releaseYear && <p className="error-text">{errors.releaseYear}</p>}
                </div>

                <div className="form-group">
                  <label>Duration (minutes)</label>
                  <input type="number" name="duration" value={formData.duration} onChange={handleInputChange} className="input-field" />
                  {errors.duration && <p className="error-text">{errors.duration}</p>}
                </div>
              </div>

              {/* Poster Upload */}
              <div className="form-group poster-upload">
                <label>Poster Image</label>
                <div className="upload-area" onDragOver={handleDragOver} onDrop={handleDrop} onClick={() => document.getElementById("poster-input")?.click()}>
                  {posterPreview ? <img src={posterPreview} alt="Poster preview" className="poster-preview" /> : <><div className="upload-icon">🎬</div><p>Drop poster here or click to browse</p></>}
                  <input type="file" id="poster-input" accept="image/png,image/jpeg,image/webp" onChange={handlePosterUpload} style={{ display: "none" }} />
                </div>
                {errors.poster && <p className="error-text">{errors.poster}</p>}
              </div>
            </div>

            {/* Description */}
            <div className="form-group">
              <label>Description</label>
              <textarea name="description" value={formData.description} onChange={handleInputChange} rows="6" className="textarea-field" />
              {errors.description && <p className="error-text">{errors.description}</p>}
            </div>

            {/* Genres */}
            <div className="form-group full-width">
              <label>Genre</label>
              <div className="genre-buttons">
                {genres.map(genre => (
                  <button key={genre.genre_name} type="button" className={`genre-btn ${formData.genres.includes(genre.genre_name) ? "selected" : ""}`} onClick={() => handleGenreToggle(genre.genre_name)}>{genre.genre_name}</button>
                ))}
              </div>
              {errors.genres && <p className="error-text">{errors.genres}</p>}
            </div>

            {/* Streaming Links */}
            <div className="streaming-section">
              <h2 className="section-title">Streaming Platform Links</h2>
              <div className="form-row">
                {urlnames.map(platform => (
                  <div className="form-group" key={platform.ott_name}>
                    <label>{platform.ott_name}</label>
                    <input type="url" placeholder="Enter url" value={formData.streamingLinks?.[platform.ott_name] || ""} onChange={(e) => handleDynamicUrlChange(platform.ott_name, e.target.value)} className="input-field" />
                  </div>
                ))}
              </div>
              {errors.streamingLinks && <p className="error-text">{errors.streamingLinks}</p>}
            </div>

            {/* Buttons */}
            <div className="form-actions">
              <button type="button" className="btn-next" onClick={() => setActiveTab("crew")}>Next: Crew & Cast →</button>
              <button type="button" className="btn-next" onClick={handleSubmit}>Submit movie details</button>
            </div>
          </div>
        )}

        {/* CREW TAB */}
        {activeTab === "crew" && (
          <div className="form-content">
            <p className="placeholder-text">Crew & Cast section content goes here...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddMovies;
