import React, { useState, useEffect } from 'react';
import UserHeader from './UserHeader';
import { supabase } from './supabase';
import RatingDonutChart from './RatingDonutChart';
import './EditUserPage.css';

const EditUserPage = () => {
  const [userDetails, setUserDetails] = useState(null);
  const [userStatDetails, setUserStatDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Editable form state
  const [displayName, setDisplayName] = useState('');
  const [gender, setGender] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const fetchProfileDetails = async () => {
    const email = localStorage.getItem("userEmail");
    const { data, error } = await supabase
      .from("user")
      .select("*")
      .eq("email", email)
      .single();
    
    if (data) {
      setUserDetails(data);
      setDisplayName(data.name);
      setGender(data.gender || 'Male');
      setPreviewUrl(data.avatar_url);
    }
  };

  const fetchStats = async () => {
    const email = localStorage.getItem("userEmail");
    const { data, error } = await supabase
      .from("user_analytics")
      .select("*")
      .eq("email", email)
      .single();
    
    if (data) {
      setUserStatDetails(data);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchProfileDetails(), fetchStats()]);
      setLoading(false);
    };
    loadData();
  }, []);

  // Prepare data for donut chart
  const getRatingsData = () => {
    if (!userStatDetails) return [];
    return [
      { 
        id: 4, 
        name: 'Masterpiece', 
        value: userStatDetails.masterpiece,
        emoji: '🏆'
      },
      { 
        id: 3, 
        name: 'Amazing', 
        value: userStatDetails.amazing,
        emoji: '😍'
      },
      { 
        id: 2, 
        name: 'One Time', 
        value: userStatDetails.one_time,
        emoji: '😐'
      },
      { 
        id: 1, 
        name: 'Unbearable', 
        value: userStatDetails.unbearable,
        emoji: '🤮'
      },
    ];
  };




  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = async () => {
    if (!selectedFile) return null;

    // TODO: Upload to Supabase Storage
    // 1. Generate unique filename
    // 2. Upload to 'avatars' bucket
    // 3. Get public URL
    // Example:
   
    const fileExt = selectedFile.name.split('.').pop();
    const fileName = `${userDetails.email}-${Date.now()}.${fileExt}`;
    const filePath = `profiles/${fileName}`;
    const { data, error } = await supabase.storage
      .from('AvatarBucket')
      .upload(filePath, selectedFile);
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('AvatarBucket')
      .getPublicUrl(filePath);
    
    return publicUrl;
    
    return previewUrl; // Temporary: return preview URL
  };

  const deleteOldAvatar = async (oldUrl) => {
  const filePath = getStoragePathFromUrl(oldUrl);
  if (!filePath) return;

  const { error } = await supabase.storage
    .from('AvatarBucket')
    .remove([filePath]);

  if (error) {
    console.warn('Failed to delete old avatar:', error.message);
  }
};

  const getStoragePathFromUrl = (url) => {
  if (!url) return null;

  const marker = '/storage/v1/object/public/AvatarBucket/';
  const index = url.indexOf(marker);

  if (index === -1) return null;

  return url.substring(index + marker.length);
};

  // Handle remove avatar
  const handleRemoveAvatar = async () => {
    // TODO: Delete from Supabase Storage bucket
    // Example:
    /*
    if (userDetails.avatar_url) {
      const fileName = userDetails.avatar_url.split('/').pop();
      await supabase.storage.from('avatars').remove([fileName]);
    }
    */
    
    // Set to default avatar
    const defaultAvatar = 'https://wiggitkoxqislzddubuk.supabase.co/storage/v1/object/public/AvatarBucket/defaultavatar.jpg';
    setPreviewUrl(defaultAvatar);
    setSelectedFile(null);
  };

  // Handle save changes
  const handleSaveChanges = async () => {
    setSaving(true);
    
    try {
      let avatarUrl = userDetails.avatar_url;
      
      // Upload new avatar if selected
      if (selectedFile) {

        //removing old avatar
        if (userDetails.avatar_url) {
    await deleteOldAvatar(userDetails.avatar_url);
    alert("Deleted old avatara")
  }
            //new avatar adding
        avatarUrl = await handleAvatarUpload();
      }
      
      // TODO: Update user profile in database
      const { error } = await supabase
        .from('user')
        .update({
          name: displayName,
          gender: gender,
          avatar_url: avatarUrl
        })
        .eq('email', userDetails.email);
      
      if (error) throw error;
      
      // Update local storage
      localStorage.setItem('username', displayName);
      localStorage.setItem('userimage', avatarUrl);
      
      alert('Profile updated successfully!');
      await fetchProfileDetails(); // Refresh data
      
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="edit-user-page">
        <UserHeader />
        <div className="eup-loading-container">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-user-page">
      <UserHeader />
      
      <main className="eup-main-content">
        {/* Decorative background elements */}
        <div className="eup-bg-blur eup-bg-blur-1"></div>
        <div className="eup-bg-blur eup-bg-blur-2"></div>
        
        {/* Hero Banner */}
        <section className="eup-hero-banner">
          <div className="eup-hero-overlay"></div>
          <div className="eup-hero-content">
            {/* Avatar */}
            <div className="eup-avatar-container">
              <div className="eup-avatar-ring">
                <div 
                  className="eup-avatar-image"
                  style={{ backgroundImage: `url('${previewUrl}')` }}
                >
                  <label className="eup-avatar-edit-overlay" htmlFor="avatar-input">
                    <span className="material-symbols-outlined">edit</span>
                  </label>
                  <input 
                    type="file" 
                    id="avatar-input"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
              <div className="eup-rank-badge">
                <span className="material-symbols-outlined">military_tech</span>
              </div>
            </div>

            {/* User Info */}
            <div className="eup-user-info">
              <h1 className="eup-user-name">{userDetails?.name}</h1>
              <div className="eup-user-meta">
                <p className="eup-username">@{userDetails?.email.split('@')[0]}</p>
                <div className="eup-rank-badge-inline">
                  <span className="material-symbols-outlined">trophy</span>
                  <span>Community Rank</span>
                  <span className="eup-rank-number">#{userStatDetails?.position || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Member Since */}
            <div className="eup-member-badge">
              Member since {new Date(userDetails?.timestamp).getFullYear()}
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="eup-stats-grid">
          <div className="eup-stat-card">
            <div className="eup-stat-icon eup-stat-icon-primary">
              <span className="material-symbols-outlined">movie</span>
            </div>
            <div className="eup-stat-info">
              <h4 className="eup-stat-value">{userStatDetails?.total_reviews || 0}</h4>
              <p className="eup-stat-label">Movies Reviewed</p>
            </div>
          </div>

          <div className="eup-stat-card">
            <div className="eup-stat-icon eup-stat-icon-pink">
              <span className="material-symbols-outlined">favorite</span>
            </div>
            <div className="eup-stat-info">
              <h4 className="eup-stat-value">{userStatDetails?.likes_received || 0}</h4>
              <p className="eup-stat-label">Likes Received</p>
            </div>
          </div>

          <div className="eup-stat-card">
            <div className="eup-stat-icon eup-stat-icon-blue">
              <span className="material-symbols-outlined">thumb_up</span>
            </div>
            <div className="eup-stat-info">
              <h4 className="eup-stat-value">{userStatDetails?.likes_given || 0}</h4>
              <p className="eup-stat-label">Likes Given</p>
            </div>
          </div>
        </section>

        {/* Main Grid */}
        <section className="eup-content-grid">
          {/* Ratings Chart */}
          <div className="eup-chart-panel">
            <div className="eup-panel-header">
              <span className="material-symbols-outlined">pie_chart</span>
              <h3>Ratings Distribution</h3>
            </div>
            
            <div className="eup-chart-container">
              <RatingDonutChart data={getRatingsData()} width={150} height={150} className="chart"/>
            </div>

            <div className="eup-rating-legend" >
              {getRatingsData().map((item) => {
                const total = userStatDetails?.total_reviews || 0;
                const percent = total > 0 ? ((item.value / total) * 100).toFixed(0) : 0;
                return (
                  <div key={item.id} className="eup-legend-item">
                    <span className="eup-legend-emoji">{item.emoji}</span>
                    <span className="eup-legend-name">{item.name}</span>
                    <span className="eup-legend-percent">{percent}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Edit Form */}
          <div className="eup-edit-panel">
            <div className="eup-panel-header">
              <div className="eup-header-icon">
                <span className="material-symbols-outlined">tune</span>
              </div>
              <div>
                <h3>Edit Profile</h3>
                <p>Update your public persona</p>
              </div>
            </div>

            <div className="eup-form-container">
              {/* Display Name */}
              <div className="eup-form-group">
                <label>Display Name</label>
                <div className="eup-input-wrapper">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter full name"
                    className="eup-glass-input"
                  />
                  <span className="material-symbols-outlined eup-input-icon">badge</span>
                </div>
              </div>

              {/* Email (Readonly) */}
              <div className="eup-form-group">
                <label className="eup-locked-label">
                  Email Address
                  <span className="eup-locked-badge">Locked</span>
                </label>
                <div className="eup-input-wrapper">
                  <input
                    type="email"
                    value={userDetails?.email}
                    readOnly
                    disabled
                    className="eup-glass-input eup-locked-input"
                  />
                  <span className="material-symbols-outlined eup-input-icon">lock</span>
                </div>
              </div>

              {/* Gender */}
              <div className="eup-form-group">
                <label>Gender Identity</label>
                <div className="eup-input-wrapper">
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="eup-glass-input"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Others">Others</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                  <span className="material-symbols-outlined eup-input-icon">unfold_more</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="eup-action-buttons">
              <button 
                className="eup-btn-primary"
                onClick={handleSaveChanges}
                disabled={saving}
              >
                <span className="material-symbols-outlined">save</span>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>

           
                <label className="eup-btn-secondary" style={{width:""}} htmlFor="avatar-input">
                  <span className="material-symbols-outlined">upload</span>
                  <span>New Avatar</span>
                </label>

                
          
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default EditUserPage;