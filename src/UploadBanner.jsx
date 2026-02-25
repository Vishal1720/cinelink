import { useState, useEffect } from 'react';
import { supabase } from './supabase.js';
import AdminHeader from './AdminHeader';
import './UploadBanner.css';

const UploadBanner = () => {
  const [banners, setBanners] = useState([]);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [movieId, setMovieId] = useState('');
  const [movieSearch, setMovieSearch] = useState('');
  const [bannerDesc, setBannerDesc] = useState('');
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [showMovieDropdown, setShowMovieDropdown] = useState(false);

  const [editingBannerId, setEditingBannerId] = useState(null);
const [isEditMode, setIsEditMode] = useState(false);

const handleEditBanner = (banner) => {
  setIsEditMode(true);
  setEditingBannerId(banner.id);

  setPreviewUrl(banner.banner_url);
  setSelectedFile(null); // new image optional

  setMovieId(banner.movie_id);
  setMovieSearch(banner.movies?.title || '');
  setBannerDesc(banner.banner_desc || '');

  window.scrollTo({ top: 0, behavior: 'smooth' });
};

  useEffect(() => {
    fetchBanners();
    fetchMovies();
  }, []);

  useEffect(() => {
    if (movieSearch) {
      const filtered = movies.filter(movie => 
        movie.title.toLowerCase().includes(movieSearch.toLowerCase()) ||
        movie.id.toString().includes(movieSearch)
      );
      setFilteredMovies(filtered);
    } else {
      setFilteredMovies([]);
    }
  }, [movieSearch, movies]);

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('bannerdetails')
        .select(`
          *,
          movies (
            id,
            title,
            year,
            type,
            poster_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error('Error fetching banners:', error);
      alert('Failed to load banners');
    }
  };

  const fetchMovies = async () => {
    try {
      const { data, error } = await supabase
        .from('movies')
        .select('id, title, year, type, poster_url')
        .order('title');

      if (error) throw error;
      setMovies(data || []);
    } catch (error) {
      console.error('Error fetching movies:', error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const uploadBannerImage = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `banner-${Date.now()}.${fileExt}`;
    const filePath = `banner/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('PosterBucket')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('PosterBucket')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSaveBanner = async (e) => {
  e.preventDefault();

  if (!movieId) {
    alert('Please select a movie');
    return;
  }

  setLoading(true);

  try {
    let bannerUrl = previewUrl;

    // Upload new image ONLY if user selected a file
    if (selectedFile) {
      bannerUrl = await uploadBannerImage(selectedFile);
    }

    if (isEditMode) {
      // 🔄 UPDATE
      const { error } = await supabase
        .from('bannerdetails')
        .update({
          banner_url: bannerUrl,
          movie_id: parseInt(movieId),
          banner_desc: bannerDesc,
        })
        .eq('id', editingBannerId);

      if (error) throw error;
      alert('Banner updated successfully!');
    } else {
      // ➕ ADD
      const { error } = await supabase
        .from('bannerdetails')
        .insert([
          {
            banner_url: bannerUrl,
            movie_id: parseInt(movieId),
            banner_desc: bannerDesc,
          },
        ]);

      if (error) throw error;
      alert('Banner added successfully!');
    }

    resetForm();
    fetchBanners();
  } catch (err) {
    console.error(err);
    alert(err.message);
  } finally {
    setLoading(false);
  }
};
const resetForm = () => {
  setIsEditMode(false);
  setEditingBannerId(null);
  setSelectedFile(null);
  setPreviewUrl('');
  setMovieId('');
  setMovieSearch('');
  setBannerDesc('');
};


  const handleDeleteBanner = async (bannerId, bannerUrl) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;

    try {
      // Extract file path from URL
      const filePath = bannerUrl.split('/PosterBucket/')[1];
      
      if (filePath) {
        await supabase.storage
          .from('PosterBucket')
          .remove([filePath]);
      }

      const { error } = await supabase
        .from('bannerdetails')
        .delete()
        .eq('id', bannerId);

      if (error) throw error;

      alert('Banner deleted successfully!');
      fetchBanners();
    } catch (error) {
      console.error('Error deleting banner:', error);
      alert('Failed to delete banner');
    }
  };

  const selectMovie = (movie) => {
    setMovieId(movie.id);
    setMovieSearch(movie.title);
    setShowMovieDropdown(false);
  };

  const filteredBanners = banners.filter(banner => 
    !searchQuery || 
    banner.movies?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    banner.banner_desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="banner-management" >
      <AdminHeader />
      
      <div className="main-content" >
        <div className="page-header" >
          <div>
            <h1>Banner Management</h1>
            <p>Upload and manage promotional banners for the home screen.</p>
          </div>
          <div className="header-actions">
            <button className="btn-filter">
              <span className="material-icons-round">filter_list</span> Filter
            </button>

            <button className="btn-primary" onClick={handleSaveBanner} disabled={loading}>
              <span className="material-icons-round">save</span> 
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        <section className="upload-section">
          <div className="glass-card">
            <h2 className="section-title">
              <span className="accent-bar"></span>
              Add New Banner
            </h2>
            
            <form onSubmit={handleSaveBanner} className="upload-form">
              <div className="upload-area">
                <div className="file-upload-box">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                    className="file-input"
                  />
                  <div className="upload-content">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview" className="preview-image" />
                    ) : (
                      <>
                        <div className="upload-icon">
                          <span className="material-icons-round">cloud_upload</span>
                        </div>
                        <h3>Upload Banner Image</h3>
                        <p>1920x1080 recommended (JPG, PNG)</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-fields" >
                <div className="form-group">
                  <label>Associate Movie</label>
                  <div className="input-wrapper">
                    <span className="input-icon">
                      <span className="material-icons-round">movie</span>
                    </span>
                    <input
                      type="text"
                      placeholder="Search by Movie ID or Title..."
                      value={movieSearch}
                      disabled={isEditMode}
                      onChange={(e) => {
                        setMovieSearch(e.target.value);
                        setShowMovieDropdown(true);
                      }}
                      onFocus={() => setShowMovieDropdown(true)}
                    />
                    {showMovieDropdown && filteredMovies.length > 0 && (
                      <div className="movie-dropdown">
                        {filteredMovies.slice(0, 5).map(movie => (
                          <div 
                            key={movie.id} 
                            className="movie-option"
                            onClick={() => selectMovie(movie)}
                          >
                            <span className="movie-id">#{movie.id}</span>
                            <span className="movie-title">{movie.title}</span>
                            <span className="movie-year">({movie.year})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="field-hint">Links the banner to the specific movie detail page.</p>
                </div>

                <div className="form-group">
                  <label>Banner Description</label>
                  <textarea
                    placeholder="Enter a short description or promotional text for this banner..."
                    rows="4"
                    value={bannerDesc}
                    onChange={(e) => setBannerDesc(e.target.value)}
                  />
                </div>

                <div className="form-actions">
                    {isEditMode && (
  <button
    type="button"
    className="btn-secondary"
    onClick={resetForm}
  >
    Cancel Edit
  </button>
)}

                <button type="submit" className="btn-add" disabled={loading}>
  <span className="material-icons-round">
    {isEditMode ? 'save' : 'add_circle'}
  </span>
  {isEditMode ? 'Update Banner' : 'Add to Rotation'}
</button>

                </div>
              </div>
            </form>
          </div>
        </section>

        <div className="banners-list">
          <div className="list-header">
            <h2 className="section-title">
              <span className="accent-bar primary"></span>
              Active Banners
            </h2>
            <div className="search-box">
              <span className="material-icons-round">search</span>
              <input
                type="text"
                placeholder="Search banners..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Preview</th>
                  <th>Movie Details</th>
                  <th>Description</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBanners.map((banner) => (
                  <tr key={banner.id}>
                    <td>
                      <div className="banner-preview">
                        <img src={banner.banner_url} alt={banner.movies?.title} />
                        <div className="preview-overlay">
                          <span className="material-icons-round">visibility</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="movie-info">
                        <span className="movie-id">ID: #{banner.movie_id}</span>
                        <h3>{banner.movies?.title || 'Unknown Movie'}</h3>
                        <div className="movie-meta">
                          <span className="genre-tag">{banner.movies?.type}</span>
                          <span>•</span>
                          <span>{banner.movies?.year}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="banner-description">{banner.banner_desc}</p>
                    </td>
                   
                    <td className="text-right">
                      <div className="action-buttons">
                       <button
  className="btn-icon edit"
  onClick={() => handleEditBanner(banner)}
>
  <span className="material-icons-round">edit</span>
</button>

                        <button 
                          className="btn-icon delete"
                          onClick={() => handleDeleteBanner(banner.id, banner.banner_url)}
                        >
                          <span className="material-icons-round">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredBanners.length === 0 && (
              <div className="empty-state">
                <span className="material-icons-round">movie_filter</span>
                <p>No banners found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      
    </div>
  );
};

export default UploadBanner;