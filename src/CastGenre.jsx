import React, { useState, useEffect } from 'react';
import './CastGenre.css';
import AdminHeader from './AdminHeader';
import { supabase } from './supabase';
import { useNavigate } from 'react-router-dom';

const CastGenre = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "admin") navigate("/Login");
  }, [navigate]);

  const [genreName, setGenreName] = useState('');
  const [castName, setCastName] = useState('');
  const [genreSearch, setGenreSearch] = useState('');
  const [castSearch, setCastSearch] = useState('');
  const [castImageFile, setCastImageFile] = useState(null);

  // Temporary UI lists
  const [genres, setGenres] = useState([]);

  const [showConfirm, setShowConfirm] = useState(false);
const [confirmConfig, setConfirmConfig] = useState({
  title: "",
  message: "",
  onConfirm: null
});

const openConfirmPopup = ({ title, message, onConfirm }) => {
  setConfirmConfig({ title, message, onConfirm });
  setShowConfirm(true);
};

const closeConfirmPopup = () => {
  setShowConfirm(false);
  setConfirmConfig({ title: "", message: "", onConfirm: null });
};

const deleteGenre = (genreId) => {
  openConfirmPopup({
    title: "Delete Genre?",
    message:
      "This is a destructive action. Deleting this genre will remove all related movie data. This cannot be undone.",
    onConfirm: async () => {
      const { error } = await supabase
        .from("genre")
        .delete()
        .eq("genre_name", genreId);

      if (error) {
        alert(error.message);
      } else {
        setGenres(genres.filter(g => g.id !== genreId));
      }

      closeConfirmPopup();
    }
  });
};

const deleteCastMember = (castId, imageUrl) => {
  openConfirmPopup({
    title: "Delete Cast Member?",
    message:
      "This is a destructive action. Deleting this cast member will remove them from all related movies.",
    onConfirm: async () => {
      if (imageUrl) {
        const fileName = imageUrl.split("/").pop();
        await supabase.storage.from("CastBucket").remove([fileName]);
      }

      const { error } = await supabase
        .from("cast")
        .delete()
        .eq("id", castId);

      if (error) {
        alert(error.message);
      } else {
        setCastMembers(castMembers.filter(c => c.id !== castId));
      }

      closeConfirmPopup();
    }
  });
};

  const [castMembers, setCastMembers] = useState([]);
useEffect(() => {
  const fetchGenres = async () => {
    const { data, error } = await supabase.from("genre").select("*");

    if (error) {
      console.error("Error fetching genres:", error);
      return;
    }

    setGenres(data.map(g => ({
      id: g.id,
      name: g.genre_name
    })));
  };

  fetchGenres();
}, []);

useEffect(() => {
  const fetchCast = async () => {
    const { data, error } = await supabase.from("cast").select("*");

    if (error) {
      console.error("Error fetching cast:", error);
      return;
    }

    setCastMembers(data.map(c => ({
      id: c.id,
      name: c.cast_name,
      image: c.avatar_url
    })));
  };

  fetchCast();
}, []);

  // -------------------------------
  // ADD GENRE → SUPABASE
  // -------------------------------
  const addGenre = async () => {
    if (!genreName.trim()) return;

    const { data, error } = await supabase
      .from("genre")
      .insert([{ genre_name: genreName }])
      .select();

    if (error) {
      alert("Error adding genre: " + error.message);
      return;
    }

    setGenres([...genres, { id: data[0].id, name: data[0].genre_name }]);
    setGenreName("");
  };

  // -------------------------------
  // ADD CAST → UPLOAD + SUPABASE
  // -------------------------------
  const addCastMember = async () => {
    if (!castName.trim()) return;

    let avatar_url = null;

    if (castImageFile) {
      const ext = castImageFile.name.split('.').pop();
      const fileName = `${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("CastBucket")
        .upload(fileName, castImageFile);

      if (uploadErr) {
        alert("Upload failed: " + uploadErr.message);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("CastBucket")
        .getPublicUrl(fileName);

      avatar_url = urlData.publicUrl;
    }

    const { data, error } = await supabase
      .from("cast")
      .insert([{ cast_name: castName, avatar_url }])
      .select();

    if (error) {
      alert("Error adding cast: " + error.message);
      return;
    }

    setCastMembers([
      ...castMembers,
      {
        id: data[0].id,
        name: data[0].cast_name,
        image: data[0].avatar_url
      }
    ]);

    setCastName("");
    setCastImageFile(null);
  };

  // Filtering
  const filteredGenres = genres.filter(g =>
    g.name.toLowerCase().includes(genreSearch.toLowerCase())
  );

  const filteredCastMembers = castMembers.filter(c =>
    c.name.toLowerCase().includes(castSearch.toLowerCase())
  );

  return (
    <div className="cast-genre-container" style={{ display: "flex", flexDirection: "row" }}>
      <AdminHeader />
      <main className="main-content">
        <div className="grid-container">

          {/* ---------------- GENRE SECTION ---------------- */}
          <section className="section">
            <div className="panel">
              <h2>Manage Genres</h2>

              <div className="input-group">
                <label className="input-label">
                  <p>Genre Name</p>
                  <input
                    type="text"
                    className="text-input"
                    placeholder="e.g., Science Fiction"
                    value={genreName}
                    onChange={(e) => setGenreName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addGenre()}
                  />
                </label>

                <button className="btn-primary" onClick={addGenre}>
                  Add Genre
                </button>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <h3>Existing Genres</h3>

                <div className="search-box">
                  <span className="material-symbols-outlined search-icon">search</span>
                  <input
                    type="search"
                    className="search-input"
                    placeholder="Search genres..."
                    value={genreSearch}
                    onChange={(e) => setGenreSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Genre Name</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredGenres.map(genre => (
                      <tr key={genre.id}>
                        <td>{genre.name}</td>
                        <td>
                          <div className="action-buttons">
                            <button className="btn-icon btn-edit">
                              <span className="material-symbols-outlined">edit</span>
                            </button>
                            <button className="btn-icon btn-delete" onClick={() => deleteGenre(genre.name)}>
                              <span className="material-symbols-outlined" onClick={() => deleteGenre(genre.name)}>delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>

                </table>
              </div>
            </div>
          </section>

          {/* ---------------- CAST SECTION ---------------- */}
          <section className="section">
            <div className="panel">
              <h2>Manage Cast Members</h2>

              <div className="form-group">
                <label className="input-label">
                  <p>Cast Member Name</p>
                  <input
                    type="text"
                    className="text-input"
                    placeholder="e.g., Keanu Reeves"
                    value={castName}
                    onChange={(e) => setCastName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addCastMember()}
                  />
                </label>

                {/* ---- Upload Image ---- */}
                <input
                  type="file"
                  accept="image/*"
                  id="cast-upload"
                  style={{ display: "none" }}
                  onChange={(e) => setCastImageFile(e.target.files[0])}
                />

                <label htmlFor="cast-upload" className="upload-area">
                  <div className="upload-content">
                    <span className="material-symbols-outlined upload-icon">cloud_upload</span>
                    <p className="upload-text">
                      <span className="upload-highlight">Click to upload</span> or drag and drop
                    </p>
                    <p className="upload-hint">PNG, JPG, GIF up to 10MB</p>
                  </div>
                </label>

                <button className="btn-primary" onClick={addCastMember}>
                  Add Cast Member
                </button>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <h3>Existing Cast Members</h3>

                <div className="search-box">
                  <span className="material-symbols-outlined search-icon">search</span>
                  <input
                    type="search"
                    className="search-input"
                    placeholder="Search cast..."
                    value={castSearch}
                    onChange={(e) => setCastSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Cast Member</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredCastMembers.map(cast => (
                      <tr key={cast.id}>
                        <td>
                          <div className="cast-info">
                            <div
                              className="cast-avatar"
                              style={{ backgroundImage: `url(${cast.image})` }}
                            ></div>
                            <span>{cast.name}</span>
                          </div>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button className="btn-icon btn-edit">
                              <span className="material-symbols-outlined">edit</span>
                            </button>

                            <button className="btn-icon btn-delete"  onClick={() => deleteCastMember(cast.id, cast.image)}>
                              <span className="material-symbols-outlined">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>

                </table>
              </div>
            </div>
          </section>

        </div>
      </main>
      {showConfirm && (
  <div className="confirm-overlay">
    <div className="confirm-modal">
      <h3 className="confirm-title">{confirmConfig.title}</h3>
      <p className="confirm-message">{confirmConfig.message}</p>

      <div className="confirm-actions">
        <button className="btn-secondary" onClick={closeConfirmPopup}>
          Cancel
        </button>
        <button
          className="btn-danger"
          onClick={confirmConfig.onConfirm}
        >
          Yes, Delete
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default CastGenre;
