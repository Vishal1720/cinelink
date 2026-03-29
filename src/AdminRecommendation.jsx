import React, { useEffect, useState } from "react";
import { supabase } from "./supabase";
import "./AdminRecommendation.css";
import AdminHeader from "./AdminHeader";

const AdminRecommendation = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, []);

 const fetchRecommendations = async () => {
  setLoading(true);

  // 1. Get recommendations
  const { data: recs, error: recError } = await supabase
    .from("user_recommendation")
    .select("*");

  // 2. Get movies
  const { data: movies, error: movieError } = await supabase
    .from("movies")
    .select("id, title");

  // 3. Get users (IMPORTANT)
  const { data: users, error: userError } = await supabase
    .from("user")
    .select("email, name, avatar_url");

  if (recError || movieError || userError) {
    console.log(recError || movieError || userError);
    setLoading(false);
    return;
  }

  // Movie map
  const movieMap = {};
  movies.forEach((m) => {
    movieMap[m.id] = m.title;
  });

  // User map
  const userMap = {};
  users.forEach((u) => {
    userMap[u.email] = {
      name: u.name,
      avatar: u.avatar_url,
    };
  });

  // Attach everything
  const updated = recs.map((rec) => ({
    ...rec,
    movie1_title: movieMap[rec.movie_id1],
    movie2_title: movieMap[rec.movie_id2],
    user_name: userMap[rec.email]?.name || "Unknown",
    user_avatar: userMap[rec.email]?.avatar || null,
  }));

  setRecommendations(updated);
  setLoading(false);
};

  const deleteRecommendation = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this recommendation?"
    );

    if (!confirmDelete) return;

    const { error } = await supabase
      .from("user_recommendation")
      .delete()
      .eq("id", id);

    if (!error) {
      setRecommendations((prev) => prev.filter((rec) => rec.id !== id));
    } else {
      alert("Error deleting recommendation");
    }
  };

  return (
    <div className="admin-rec-container">
    <AdminHeader />
      <h2 className="admin-rec-title">Recommendations</h2>

      {loading ? (
        <p className="loading-text">Loading...</p>
      ) : recommendations.length === 0 ? (
        <p className="no-data">No recommendations found</p>
      ) : (
       <div className="analytics-table-wrapper">
  <div className="analytics-table">

    {/* Header */}
    <div className="table-header">
      <div className="col-user">User</div>
      <div className="col-center">Date</div>
      <div className="col-center">Movies</div>
      <div className="col-engagement">Message</div>
      <div className="col-center">Action</div>
    </div>

    {/* Body */}
    <div className="table-body">
      {recommendations.map((rec) => (
        <div key={rec.id} className="table-row">

          {/* USER */}
          <div className="col-user">
            <div className="user-cell">
              <img
  src={
    rec.user_avatar ||
    "https://wiggitkoxqislzddubuk.supabase.co/storage/v1/object/public/AvatarBucket/defaultavatar.jpg"
  }
  alt="avatar"
  className="user-avatar"
/>

<div className="user-info">
  <strong>{rec.user_name}</strong>
  <small>{rec.email}</small>
</div>
             
            </div>
          </div>

          {/* DATE */}
          <div className="col-center">
            <span className="value-muted">
              {new Date(rec.created_at).toLocaleDateString()}
            </span>
          </div>

          {/* MOVIES */}
          <div className="col-center">
            <span className="value-muted">
              🎬 {rec.movie1_title}
            </span>
            {rec.movie2_title && (
              <span className="value-muted">
                {" "} | {rec.movie2_title}
              </span>
            )}
          </div>

          {/* MESSAGE */}
          <div className="col-engagement">
            <p className="value-normal">
              {rec.message}
            </p>
          </div>

          {/* ACTION */}
          <div className="col-center">
            <button
              className="btn-secondary"
              onClick={() => deleteRecommendation(rec.id)}
            >
              🗑 Delete
            </button>
          </div>

        </div>
      ))}
    </div>

  </div>
</div>
      )}
    </div>
  );
};

export default AdminRecommendation;