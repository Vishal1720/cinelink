import { useEffect, useState } from "react";
import "./Reviews.css";
import AdminHeader from "./AdminHeader";
import { supabase } from "./supabase";

// ── Preset reasons ──────────────────────────────────────────────
const DELETE_REASONS = [
  { label: "Spam or advertisement", value: "spam" },
  { label: "Hate speech or harassment", value: "hate_speech" },
  { label: "Inappropriate or offensive content", value: "inappropriate" },
  { label: "Spoilers without warning", value: "spoilers" },
  { label: "Fake or misleading review", value: "fake" },
  { label: "Other (custom reason)", value: "custom" },
];

// ── Delete Reason Popup ─────────────────────────────────────────
const DeleteReasonPopup = ({ review, onConfirm, onCancel }) => {
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [sending, setSending] = useState(false);

  const finalReason =
    selectedReason === "custom"
      ? customReason.trim()
      : DELETE_REASONS.find((r) => r.value === selectedReason)?.label || "";

  const handleConfirm = async () => {
    if (!finalReason) return;
    setSending(true);
    await onConfirm(review, finalReason);
    setSending(false);
  };

  return (
    <div className="popup-overlay">
      <div className="popup-box">
        {/* Header */}
        <div className="popup-header">
          <span className="popup-icon">🗑️</span>
          <div>
            <h2>Delete Review</h2>
            <p>
              Review by <strong>{review.reviewer_email}</strong> on{" "}
              <strong>{review.movie_title}</strong>
            </p>
          </div>
        </div>

        {/* Reasons */}
        <div className="popup-body">
          <label className="popup-label">Select a reason for deletion</label>
          <div className="reason-list">
            {DELETE_REASONS.map((r) => (
              <button
                key={r.value}
                className={`reason-btn ${selectedReason === r.value ? "active" : ""}`}
                onClick={() => setSelectedReason(r.value)}
              >
                {r.label}
              </button>
            ))}
          </div>

          {selectedReason === "custom" && (
            <textarea
              className="custom-reason-input"
              placeholder="Describe the reason..."
              rows={3}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
            />
          )}

          <div className="popup-notification-hint">
            <span>📧</span>
            <span>
              A notification will be sent to <strong>{review.reviewer_email}</strong> with
              this reason.
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="popup-actions">
          <button className="popup-cancel" onClick={onCancel} disabled={sending}>
            Cancel
          </button>
          <button
            className="popup-confirm"
            onClick={handleConfirm}
            disabled={!finalReason || sending}
          >
            {sending ? "Deleting..." : "Delete & Notify"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ──────────────────────────────────────────────
const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [search, setSearch] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null); // review object waiting for reason

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from("review_details_view")
      .select("*")
      .order("review_created_at", { ascending: false });

    if (!error) setReviews(data || []);
  };

  const handleDeleteWithReason = async (review, reason) => {
    try {
      // 1️⃣ Send notification to the user
      const notificationText = `Your review for "${review.movie_title}" has been removed by our moderation team. Reason: ${reason}. If you believe this was a mistake, please contact support.`;

      const { error: notifError } = await supabase.from("notification").insert([
        {
          email: review.reviewer_email,
          type: "review_deleted",
          notification_text: notificationText,
          movie_id: review.movie_id || null,
          status: "unread",
        },
      ]);

      if (notifError) {
        console.error("Notification error:", notifError);
        // Non-fatal — still proceed with delete
      }

      // 2️⃣ Delete the review
      const { error: deleteError } = await supabase
        .from("reviews")
        .delete()
        .eq("id", review.review_id);

      if (deleteError) throw deleteError;

      setPendingDelete(null);
      fetchReviews();
    } catch (err) {
      console.error(err);
      alert("Failed to delete review: " + err.message);
    }
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

              {/* Rating */}
              <div className="rating-cell">
                <strong>{"⭐".repeat(r.rating_value)}</strong>
                <div className="rating-meta">
                  <span className="rating-emoji">{r.rating_emoji}</span>
                  <span className="rating-text">{r.rating_name}</span>
                </div>
              </div>

              {/* Review Content */}
              <div
                className={`review-text ${
                  r.review_text?.toLowerCase().includes("http") ? "spam" : ""
                }`}
              >
                {r.review_text}
              </div>

              {/* Action */}
              <div className="action-cell">
                <button
                  className="delete-btn"
                  onClick={() => setPendingDelete(r)}
                  title="Delete review"
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Delete Reason Popup */}
      {pendingDelete && (
        <DeleteReasonPopup
          review={pendingDelete}
          onConfirm={handleDeleteWithReason}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
};

export default Reviews;