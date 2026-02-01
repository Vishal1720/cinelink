import React, { useEffect, useState } from "react";
import "./AddMovies.css";
import "./EditMovies.css";
import { supabase } from "./supabase";
import Select from "react-select";
import AdminHeader from "./AdminHeader";

const EditMovies = () => {
  const [activeTab, setActiveTab] = useState("core");

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);

  const [genres, setGenres] = useState([]);
  const [allCast, setAllCast] = useState([]);

  const [formData, setFormData] = useState({
    title: "",
    year: "",
    duration: "",
    desc: "",
    trailer_link: "",
    language: "",
    type: "",
    genres: [],
    castList: []
  });

  /* ================= FETCH BASE DATA ================= */

  useEffect(() => {
    fetchGenres();
    fetchCast();
  }, []);

  const fetchGenres = async () => {
    const { data } = await supabase
      .from("genre")
      .select("*")
      .order("genre_name");
    setGenres(data || []);
  };

  const fetchCast = async () => {
    const { data } = await supabase
      .from("cast")
      .select("*")
      .order("cast_name");
    setAllCast(data || []);
  };

  /* ================= SEARCH MOVIES ================= */

  const searchMovies = async (value) => {
    setSearchTerm(value);

    if (!value.trim()) {
      setSearchResults([]);
      return;
    }

    const { data } = await supabase
      .from("movies")
      .select("id, title, year, poster_url")
      .ilike("title", `%${value}%`)
      .limit(10);

    setSearchResults(data || []);
  };

  /* ================= LOAD MOVIE DETAILS ================= */

  const loadMovieDetails = async (movie) => {
    setSelectedMovie(movie);

    const { data: movieData } = await supabase
      .from("movies")
      .select("*")
      .eq("id", movie.id)
      .single();

    const { data: genreData } = await supabase
      .from("genre_in_movies")
      .select("genre_name")
      .eq("movie_id", movie.id);

    const { data: castData } = await supabase
      .from("cast_in_movies")
      .select("cast_id, role_in_movie")
      .eq("movie_id", movie.id);

    setFormData({
      title: movieData.title,
      year: movieData.year,
      duration: movieData.duration,
      desc: movieData.desc,
      trailer_link: movieData.trailer_link || "",
      language: movieData.language,
      type: movieData.type,
      genres: genreData.map(g => g.genre_name),
      castList: castData || []
    });

    setSearchResults([]);
    setSearchTerm(movie.title);
  };

  /* ================= HANDLERS ================= */

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleGenre = (genre) => {
    setFormData(prev => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre]
    }));
  };

  const addCast = () => {
    setFormData(prev => ({
      ...prev,
      castList: [...prev.castList, { cast_id: "", role_in_movie: "" }]
    }));
  };

  const updateCast = (index, field, value) => {
    const updated = [...formData.castList];
    updated[index][field] = value;
    setFormData(prev => ({ ...prev, castList: updated }));
  };

  const removeCast = (index) => {
    setFormData(prev => ({
      ...prev,
      castList: prev.castList.filter((_, i) => i !== index)
    }));
  };

  /* ================= UPDATE MOVIE (FULLY SAFE) ================= */

  const updateMovie = async () => {
    if (!selectedMovie) return;

    /* ---------- UPDATE MOVIE ---------- */
    const { error: movieError } = await supabase
      .from("movies")
      .update({
        title: formData.title,
        year: formData.year,
        duration: formData.duration,
        desc: formData.desc,
        trailer_link: formData.trailer_link,
        language: formData.language,
        type: formData.type
      })
      .eq("id", selectedMovie.id);

    if (movieError) {
      alert(movieError.message);
      return;
    }

    /* ---------- GENRES (DEDUP + REPLACE) ---------- */
    const uniqueGenres = [...new Set(formData.genres)];

    await supabase
      .from("genre_in_movies")
      .delete()
      .eq("movie_id", selectedMovie.id);

    if (uniqueGenres.length > 0) {
      await supabase
        .from("genre_in_movies")
        .insert(
          uniqueGenres.map(g => ({
            movie_id: selectedMovie.id,
            genre_name: g
          }))
        );
    }

    /* ---------- CAST (SYNC DB WITH UI) ---------- */
    const activeCast = formData.castList.filter(c => c.cast_id);
    const activeCastIds = activeCast.map(c => c.cast_id);

    // delete removed cast
    if (activeCastIds.length > 0) {
      await supabase
        .from("cast_in_movies")
        .delete()
        .eq("movie_id", selectedMovie.id)
        .not("cast_id", "in", `(${activeCastIds.join(",")})`);
    } else {
      await supabase
        .from("cast_in_movies")
        .delete()
        .eq("movie_id", selectedMovie.id);
    }

    // upsert remaining cast
    await supabase
      .from("cast_in_movies")
      .upsert(
        activeCast.map(c => ({
          movie_id: selectedMovie.id,
          cast_id: c.cast_id,
          role_in_movie: c.role_in_movie
        })),
        { onConflict: "movie_id,cast_id" }
      );

    alert("Movie / Series updated successfully!");
  };

  /* ================= CAST SELECT (TEXT ONLY) ================= */

  const usedCastIds = formData.castList.map(c => c.cast_id);

  const castOptions = allCast
    .filter(c => !usedCastIds.includes(c.id))
    .map(c => ({
      value: c.id,
      label: c.cast_name
    }));

  /* ================= UI ================= */

  return (
    <div style={{ display: "flex" }}>
      <AdminHeader />

      <div className="add-movie-container edit-movie-container">
        <h1 className="page-title">Edit Movie / Series</h1>

        {/* SEARCH */}
        <div className="form-group edit-search-wrapper">
          <input
            className="input-field edit-search-input"
            placeholder="Search movie or series..."
            value={searchTerm}
            onChange={(e) => searchMovies(e.target.value)}
          />

          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map(m => (
                <div
                  key={m.id}
                  className="search-result-item"
                  onClick={() => loadMovieDetails(m)}
                >
                  <img
                    src={m.poster_url || "/placeholder-poster.png"}
                    className="edit-search-poster"
                  />
                  <div>
                    <p className="search-result-title">{m.title}</p>
                    <p className="search-result-year">{m.year}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedMovie && (
          <div className="content-card edit-form-card">

            {/* PREVIEW */}
            <div className="edit-movie-preview">
              <img
                src={selectedMovie.poster_url || "/placeholder-poster.png"}
                className="edit-movie-poster"
              />
              <div className="edit-movie-info">
                <h3>{selectedMovie.title}</h3>
                <p>{selectedMovie.year}</p>
              </div>
            </div>

            {/* TABS */}
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

            {/* CORE */}
            {activeTab === "core" && (
              <div className="form-content">
                <input className="input-field" name="title" value={formData.title} onChange={handleInputChange} />
                <input className="input-field" name="year" value={formData.year} onChange={handleInputChange} />
                <input className="input-field" name="duration" value={formData.duration} onChange={handleInputChange} />
                <textarea className="textarea-field" name="desc" value={formData.desc} onChange={handleInputChange} />

                <select className="input-field" name="type" value={formData.type} onChange={handleInputChange}>
                  <option value="">Select Type</option>
                  <option value="Movie">Movie</option>
                  <option value="Series">Series</option>
                </select>

                <input className="input-field" name="language" value={formData.language} onChange={handleInputChange} />

                <div className="genre-buttons">
                  {genres.map(g => (
                    <button
                      type="button"
                      key={g.genre_name}
                      className={`genre-btn ${formData.genres.includes(g.genre_name) ? "selected" : ""}`}
                      onClick={() => toggleGenre(g.genre_name)}
                    >
                      {g.genre_name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CREW */}
            {activeTab === "crew" && (
              <div className="form-content">
                {formData.castList.map((c, i) => {
                  const selectedCast = allCast.find(ac => ac.id === c.cast_id);

                  return (
                    <div className="cast-card" key={i}>
                      <div className="edit-cast-preview">
                        {selectedCast ? (
                          <>
                            <img
                              src={selectedCast.avatar_url || "/avatar-placeholder.png"}
                              className="edit-cast-avatar"
                            />
                            <p className="cast-name-display">{selectedCast.cast_name}</p>
                          </>
                        ) : (
                          <p className="cast-placeholder">Select cast</p>
                        )}
                      </div>

                      <Select
                        options={castOptions}
                        value={castOptions.find(o => o.value === c.cast_id) || null}
                        onChange={(opt) => updateCast(i, "cast_id", opt ? opt.value : "")}
                        className="react-select-container"
                        classNamePrefix="react-select"
                        isClearable
                      />

                      <input
                        className="input-field"
                        placeholder="Role"
                        value={c.role_in_movie}
                        onChange={(e) => updateCast(i, "role_in_movie", e.target.value)}
                      />

                      <button className="remove-cast-btn" onClick={() => removeCast(i)}>
                        Remove
                      </button>
                    </div>
                  );
                })}

                <button className="add-cast-btn" onClick={addCast}>
                  + Add Cast
                </button>
              </div>
            )}

            <div className="form-actions">
              <button className="btn-next" onClick={updateMovie}>
                Update Movie / Series
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default EditMovies;
