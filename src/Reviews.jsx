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

    if (error) {
      console.error("Supabase error:", error.message, error.details);
    } else {
      setReviews(data || []);
    }
  };

  // ✅ DELETE MUST BE FROM BASE TABLE
  const deleteReview = async (id) => {
    if (!window.confirm("Delete this review?")) return;

    const { error } = await supabase
      .from("reviews") // ✅ correct table
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete error:", error.message);
    } else {
      fetchReviews();
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  // ✅ FIXED SEARCH FIELDS
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
              <div className="user-cell">
                <strong>{r.reviewer_email}</strong>
                <span>
  {r.review_created_at
    ? new Date(r.review_created_at).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—"}
</span>

              </div>

              {/* Rating */}
              <div className="rating-cell">
                {"⭐".repeat(r.rating_value)}
              </div>

              {/* Review */}
              <div
                className={`review-text ${
                  r.review_text?.toLowerCase().includes("http")
                    ? "spam"
                    : ""
                }`}
              >
                {r.review_text}
                <div className="emoji-row">
                  <span title={r.rating_name}>{r.rating_emoji}</span>
                  <span className="rating-text">{r.rating_name}</span>
                </div>
              </div>

              {/* Action */}
              <div className="action-cell">
                <button onClick={() => deleteReview(r.review_id)}>
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Reviews;
