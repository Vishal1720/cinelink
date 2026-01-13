import { useEffect, useState } from "react";
import "./Reviews.css";
import AdminHeader from "./AdminHeader";
import { supabase } from "./supabase";

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [search, setSearch] = useState("");

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from("review_details_view")
      .select("*")
      .order("review_created_at", { ascending: false });

    if (!error) setReviews(data || []);
  };

  const deleteReview = async (id) => {
    if (!window.confirm("Delete this review?")) return;

    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", id);

    if (!error) fetchReviews();
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const filteredReviews = reviews.filter((r) =>
    `${r.movie_title} ${r.reviewer_email} ${r.review_text}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="admin-layout">
      <AdminHeader />

      <main className="admin-content reviews-ui">
        <div className="reviews-topbar">
          <input
            type="text"
            placeholder="Search reviews..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="reviews-title">
          <h1>Review Management</h1>
          <p>Moderate and manage user-submitted movie reviews</p>
        </div>

        <div className="reviews-card">
          <div className="reviews-header-row">
            <span>Movie</span>
            <span>User</span>
            <span>Rating</span>
            <span>Review Content</span>
            <span>Actions</span>
          </div>

          {filteredReviews.map((r) => (
            <div className="review-row" key={r.review_id}>
              
              {/* Movie */}
              <div className="movie-cell">
                <img src={r.poster_url} alt="poster" />
                <div>
                  <strong>{r.movie_title}</strong>
                  <span>
                    {r.type} • {r.language} • {r.release_year}
                  </span>
                </div>
              </div>

              {/* User */}
              {/* User */}
<div className="user-cell">
  <span className="user-email">{r.reviewer_email}</span>
  <span className="user-date">
    {new Date(r.review_created_at).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })}
  </span>
</div>


              {/* ✅ FIXED RATING */}
              <div className="rating-cell">
                <strong>{"⭐".repeat(r.rating_value)}</strong>

                <div className="rating-meta">
                  <span className="rating-emoji">{r.rating_emoji}</span>
                  <span className="rating-text">{r.rating_name}</span>
                </div>
              </div>

              {/* ✅ FIXED REVIEW CONTENT */}
              <div
                className={`review-text ${
                  r.review_text?.toLowerCase().includes("http") ? "spam" : ""
                }`}
              >
                {r.review_text}
              </div>

              {/* Action */}
              <div className="action-cell">
                <button onClick={() => deleteReview(r.review_id)}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Reviews;
