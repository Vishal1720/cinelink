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
    poster: "",
    trailer_link: "",
    language: "",
    castList: []   // { cast_id, role_in_movie }

  });

  const languageOptions = [
    "English", "Hindi", "Kannada", "Tulu","Tamil", "Telugu", "Malayalam",
    "Marathi", "Gujarati", "Bengali", "Punjabi",
    "Korean", "Japanese", "French", "Spanish", "German", "Chinese"
  ];

  const [genres, setGenres] = useState([]);
  const [urlnames, setUrlNames] = useState([]);
const [allCast, setAllCast] = useState([]);


const addCastMember = () => {
  setFormData(prev => ({
    ...prev,
    castList: [...prev.castList, { cast_id: "", role_in_movie: "" }]
  }));
};

const removeCastMember = (index) => {
  setFormData(prev => ({
    ...prev,
    castList: prev.castList.filter((_, i) => i !== index)
  }));
};

const updateCastField = (index, field, value) => {
  const updated = [...formData.castList];
  updated[index][field] = value;
  setFormData(prev => ({ ...prev, castList: updated }));
};

const fetchAllCast = async () => {
  const { data, error } = await supabase.from("cast").select("*").order("cast_name");
  if (!error) setAllCast(data);
};

  const fetchGenres = async () => {
    const { data, error } = await supabase.from("genre").select("*").order("genre_name", { ascending: true });
    if (error) {
      console.error("Error fetching genres:", error);
      setGenres([]);
      return;
    }
    setGenres(data || []);
  };

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
      fetchAllCast();   
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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = "Movie title is required.";
    if (!formData.releaseYear.trim()) newErrors.releaseYear = "Release year is required.";
    else if (isNaN(formData.releaseYear) || formData.releaseYear < 1888)
      newErrors.releaseYear = "Enter a valid year.";

    if (!formData.duration.trim()) newErrors.duration = "Duration is required.";
    else if (!formData.duration)
      newErrors.duration = "Enter duration";

    if (!formData.description.trim()) newErrors.description = "Description is required.";
    if (!posterFile) newErrors.poster = "Poster image is required.";

    if (!formData.genres || formData.genres.length === 0) 
      newErrors.genres = "Select at least one genre.";

    if (formData.trailer_link && !/^https?:\/\/\S+\.\S+/.test(formData.trailer_link))
      newErrors.trailer_link = "Enter a valid trailer link.";

    if (!formData.language.trim())
      newErrors.language = "Movie language is required.";

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

    if (!validateForm()) return;

    let posterUrl = null;

    if (posterFile) {
      const fileExt = posterFile.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `posters/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("PosterBucket")
        .upload(filePath, posterFile, { cacheControl: "3600", upsert: false });

      if (!uploadError) {
        const { data } = supabase.storage.from("PosterBucket").getPublicUrl(filePath);
        posterUrl = data.publicUrl;
      }
    }

    const { data, error } = await supabase.from('movies').insert([{
      title: formData.title,
      year: formData.releaseYear,
      desc: formData.description,
      duration: formData.duration,
      poster_url: posterUrl,
      trailer_link: formData.trailer_link,
      language: formData.language
    }]).select();

    if (!error) {
      const movieid = data[0].id;

      if (formData.genres.length > 0) {
        const genreInserts = formData.genres.map(genre_name => ({ movie_id: movieid, genre_name }));
        await supabase.from('genre_in_movies').insert(genreInserts);
      }

      for (const ott_name in formData.streamingLinks) {
        const ott_link = formData.streamingLinks[ott_name];
        if (ott_link?.trim()) {
          await supabase.from("url_in_movies").insert([{ movie_id: movieid, ott_name, ott_link }]);
        }
      }

      // Insert selected cast into cast_in_movies
for (const castItem of formData.castList) {
  if (!castItem.cast_id) continue;

  await supabase.from("cast_in_movies").insert([
    {
      movie_id: movieid,
      cast_id: castItem.cast_id,
      role_in_movie: castItem.role_in_movie
    }
  ]);
}

      setFormData({
        title: "",
        releaseYear: "",
        description: "",
        duration: "",
        streamingLinks: {},
        genres: [],
        poster: "",
        trailer_link: "",
        language: ""
      });

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

        <div className="tabs">
          <button className={`tab ${activeTab === "core" ? "active" : ""}`} onClick={() => setActiveTab("core")}>Core Details</button>
          <button className={`tab ${activeTab === "crew" ? "active" : ""}`} onClick={() => setActiveTab("crew")}>Crew & Cast</button>
        </div>

        {activeTab === "core" && (
          <div className="form-content">

            <div className="three-col">

              {/* COLUMN 1 — TITLE, YEAR, DURATION */}
              <div className="col col-left">

                <div className="form-group">
                  <label>Movie Title</label>
                  <input type="text" name="title" placeholder="Enter movie title"
                    value={formData.title} onChange={handleInputChange} className="input-field" />
                  {errors.title && <p className="error-text">{errors.title}</p>}
                </div>

                <div className="form-group">
                  <label>Release Year</label>
                  <input type="number" name="releaseYear"
                    placeholder="e.g. 1999"
                    value={formData.releaseYear}
                    onChange={handleInputChange}
                    className="input-field" />
                  {errors.releaseYear && <p className="error-text">{errors.releaseYear}</p>}
                </div>

                <div className="form-group">
                  <label>Duration </label>
                  <input type="text" name="duration" placeholder="e.g.2h 15m"
                    value={formData.duration} onChange={handleInputChange} className="input-field" />
                  {errors.duration && <p className="error-text">{errors.duration}</p>}
                </div>

              </div>

              {/* COLUMN 2 — TRAILER + LANGUAGE */}
              <div className="col col-middle">

                <div className="form-group">
                  <label>Trailer Link</label>
                  <input
                    type="url"
                    name="trailer_link"
                    placeholder="https://youtube.com/..."
                    value={formData.trailer_link}
                    onChange={handleInputChange}
                    className="input-field"
                  />
                  {errors.trailer_link && <p className="error-text">{errors.trailer_link}</p>}
                </div>

                <div className="form-group">
                  <label>Language</label>
                  <input
                    list="language-list"
                    name="language"
                    placeholder="Enter or choose language"
                    value={formData.language}
                    onChange={handleInputChange}
                    className="input-field"
                  />
                  <datalist id="language-list">
                    {languageOptions.map(lang => (
                      <option key={lang} value={lang} />
                    ))}
                  </datalist>
                  {errors.language && <p className="error-text">{errors.language}</p>}
                </div>

              </div>

              {/* COLUMN 3 — POSTER */}
              <div className="col col-right poster-upload">

                <label>Poster Image</label>

                <div
                  className="upload-area"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById("poster-input")?.click()}
                >
                  {posterPreview ? (
                    <img src={posterPreview} alt="Poster preview" className="poster-preview" />
                  ) : (
                    <>
                      <div className="upload-icon">🎬</div>
                      <p>Drop poster here or click to browse</p>
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

                {errors.poster && <p className="error-text">{errors.poster}</p>}
              </div>

            </div>

            {/* Description */}
            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                placeholder="Description of the movie/series"
                value={formData.description}
                onChange={handleInputChange}
                rows="6"
                className="textarea-field"
              />
              {errors.description && <p className="error-text">{errors.description}</p>}
            </div>

            {/* Genres */}
            <div className="form-group full-width">
              <label>Genre</label>
              <div className="genre-buttons">
                {genres.map(genre => (
                  <button
                    key={genre.genre_name}
                    type="button"
                    className={`genre-btn ${formData.genres.includes(genre.genre_name) ? "selected" : ""}`}
                    onClick={() => handleGenreToggle(genre.genre_name)}
                  >
                    {genre.genre_name}
                  </button>
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
                    <input
                      type="url"
                      placeholder="Enter url"
                      value={formData.streamingLinks?.[platform.ott_name] || ""}
                      onChange={(e) =>
                        handleDynamicUrlChange(platform.ott_name, e.target.value)
                      }
                      className="input-field"
                    />
                  </div>
                ))}
              </div>

              {errors.streamingLinks &&
                <p className="error-text">{errors.streamingLinks}</p>}
            </div>

            {/* Buttons */}
            <div className="form-actions">
              <button type="button" className="btn-next" onClick={() => setActiveTab("crew")}>
                Next: Crew & Cast →
              </button>

              <button type="button" className="btn-next" onClick={handleSubmit}>
                Submit movie details
              </button>
            </div>

          </div>
        )}

        {/* CREW TAB */}
       {/* CREW TAB */}
{activeTab === "crew" && (
  <div className="form-content">

    <h2 className="section-title">Select Cast Members</h2>

    {formData.castList.map((item, index) => {
      const selectedCast = allCast.find(c => c.id === Number(item.cast_id));

      return (
        <div className="cast-card" key={index}>

          {/* Avatar + Name Preview */}
          <div className="cast-preview">
            {selectedCast ? (
              <>
                <img src={selectedCast.avatar_url} className="cast-avatar-preview" />
                <p className="cast-name-display">{selectedCast.cast_name}</p>
              </>
            ) : (
              <p className="cast-placeholder">Select cast</p>
            )}
          </div>

          {/* Cast Selector */}
          <div className="cast-field">
            <label>Select Cast</label>
            <select
              className="input-field"
              value={item.cast_id}
              onChange={(e) => updateCastField(index, "cast_id", e.target.value)}
            >
              <option value="">-- Choose Cast --</option>
              {allCast.map(c => (
                <option key={c.id} value={c.id}>
                  {c.cast_name}
                </option>
              ))}
            </select>
          </div>

          {/* Role */}
          <div className="cast-field">
            <label>Role in Movie</label>
            <input
              className="input-field"
              type="text"
              placeholder="Hero, Villain, Director..."
              value={item.role_in_movie}
              onChange={(e) => updateCastField(index, "role_in_movie", e.target.value)}
            />
          </div>

          <button className="remove-cast-btn" onClick={() => removeCastMember(index)}>
            Remove
          </button>
        </div>
      );
    })}

    <button className="add-cast-btn" onClick={addCastMember}>
      + Add Cast Member
    </button>

  </div>
)}


      </div>
    </div>
  );
};

export default AddMovies;
