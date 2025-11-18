import React, { useState } from 'react';
import './CastGenre.css';
import AdminHeader from './AdminHeader';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
const CastGenre = () => {
  const navigate = useNavigate();
    useEffect(() => {
      // Get the user's role stored in sessionStorage
      const role = sessionStorage.getItem("role");
  
      // If role is not "admin" OR role does not exist,
      // the user is not allowed to access this page.
      // So redirect them to the login page.
      if (role !== "admin") {
        
        navigate("/Login");
      }
    }, [navigate]); // dependency ensures navigate is available
  const [genreName, setGenreName] = useState('');
  const [castName, setCastName] = useState('');
  const [genreSearch, setGenreSearch] = useState('');
  const [castSearch, setCastSearch] = useState('');
  
  const [genres, setGenres] = useState([
    { id: 1, name: 'Action' },
    { id: 2, name: 'Comedy' },
    { id: 3, name: 'Thriller' }
  ]);

  const [castMembers, setCastMembers] = useState([
    { id: 1, name: 'Scarlett Johansson', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAD-cvPmjTNNMTrPh-RHOHuTJybWPjbKIGZ0uoxdHc_7wO6valS97wT7gakRaSfNjKzB7ltDCdWQSjoOz1RriOfdf5QylBb79I_GuzUELkFlynrx0u76nvhPea17TInhFdVvvlm1dUPyZoEcuWi0TpwKuXJxEKca6T5-aXtONMWrPGEKuxM42m6aW7pq2Nem0ycKyHVRNquFmJ-tB-EaV4iTJrF5YeLPrdZGDYqVcEgKzqBgYzp5BJ10-UC9jG03b92mmdLuofCm0N8' },
    { id: 2, name: 'Robert Downey Jr.', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD-UkS-ZfUepHAJPPufYJh7xeP7O0UyfDiNR5K0D3pZ70GxRuIMwcpZYWS62i_p4RVk4EerOf2rt9Wx3LEV6aj4bTCQMy8aqZgoKHdbmx9wULBJM-oe7LLSU7vOX902finyq3DZ77X463NO_XMC5xDN-qruLeSx1ituRE2SEaVp6TkDz8EZ7yzSWttKfWMTQ593Qi76zf2r-70lxfxzNB96lFxOmlnTI3TjX4TsS-CJoHY2pVJhe86KSO7m6TKZuTI10gbO6Qu0IsyV' },
    { id: 3, name: 'Chris Evans', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBaIuNYaD2rVBydEnKzbZpjQV4CaMxdXXp5UrHOfSpovyFP1ed7RTtrcR9IA5-AvezUFoCO_Q9eziHgC5m_zeP15K0zuBz-4EK-r25uYDAUxJfSQlkWDWaXzGJrItmBx25aEbyhh32jjtVkKDXZIhn-KqGd6-Jy0UDcogFBRNYSqygxQKwl36he1xAyJKlw6A8E16IqZrlFJhf3xUt4YqX4UbhFXLhJ4WuFMAepQFYU-qHIzVx8zVPcwHKScSFQKv6BHjyY63D2Lr_e' }
  ]);

  const addGenre = () => {
    if (genreName.trim()) {
      setGenres([...genres, { id: Date.now(), name: genreName }]);
      setGenreName('');
    }
  };

  const deleteGenre = (id) => {
    setGenres(genres.filter(g => g.id !== id));
  };

  const addCastMember = () => {
    if (castName.trim()) {
      setCastMembers([...castMembers, { 
        id: Date.now(), 
        name: castName,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC6-hzgFHGEgMmWh-dDKnRk8_sFXKRc46FQ_HyvxLx7lIHcSqE7sEV-Kc02af2av5u_eybGVlj53rR1UV4xzcMJ3MncNkODzv6GsyqDmhUFmi5rCpsRjpMfSJXfA7xk1ztgYTagVwSx8_P-YQnnr2MwfWi3_P9gmmOBqwVjHOm61JGd5747CcXUc0vrF9MZW27xjRv6duCn9X7jbqzrAHo2jdjQwBfSHqiIcQY-5yn4T5gi8jyVVQovlZDUfcjqyqVJklWh7-TGQdgX'
      }]);
      setCastName('');
    }
  };

  const deleteCastMember = (id) => {
    setCastMembers(castMembers.filter(c => c.id !== id));
  };

  const filteredGenres = genres.filter(g => 
    g.name.toLowerCase().includes(genreSearch.toLowerCase())
  );

  const filteredCastMembers = castMembers.filter(c => 
    c.name.toLowerCase().includes(castSearch.toLowerCase())
  );

  return (
    <div className="cast-genre-container" style={{display:"flex",flexDirection:"row"}}>
     
<AdminHeader />
      <main className="main-content">
        

        <div className="grid-container">
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

            <div className="panel" >
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
                            <button className="btn-icon btn-delete" onClick={() => deleteGenre(genre.id)}>
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
                
                <div className="upload-section">
                  <p className="upload-label">Profile Picture</p>
                  <div className="upload-area">
                    <div className="upload-content">
                      <span className="material-symbols-outlined upload-icon">cloud_upload</span>
                      <p className="upload-text">
                        <span className="upload-highlight">Click to upload</span> or drag and drop
                      </p>
                      <p className="upload-hint">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  </div>
                </div>
                
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
                            <button className="btn-icon btn-delete" onClick={() => deleteCastMember(cast.id)}>
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
    </div>
  );
};

export default CastGenre;