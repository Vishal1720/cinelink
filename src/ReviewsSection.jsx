import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import RatingDonutChart from "./RatingDonutChart";
import './ReviewsSection.css';
import TypeWriterText from './TypeWriterText';
import { generateReviewSummary } from "./gemini";
import { useNavigate } from "react-router-dom";

const ReviewsSection = ({ movieId, pieData, totalreviews, summary, moviename, type }) => {
  const navigate = useNavigate();

  // Navigate to a user's profile page
  const navigateToUserProfile = (email) => {
    navigate(`/profile?email=${email}`);
  };

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newReview, setNewReview] = useState('');
  const [selectedRating, setSelectedRating] = useState(null);
  const [user, setUser] = useState(null);
  const [ratingCategories, setRatingCategories] = useState([]);
  const [AlreadyReviewed, setAlreadyReviewed] = useState(false);

  // Prevents AI summary from being called multiple times
  const [aiRequested, setAiRequested] = useState(false);

  // When true, skips the DB summary prop and forces fresh AI generation
  // Used after edit/delete so stale prop summary is not shown
  const [ignorePropSummary, setIgnorePropSummary] = useState(false);

  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editedText, setEditedText] = useState("");
  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  // Prevents duplicate review posts
  const [posting, setPosting] = useState(false);

  // Returns emoji for a given rating category name
  const getRatingEmoji = (rating) => ({
    'Unbearable': '😫',
    'One Time Watch': '👍',
    'Amazing': '🤩',
    'Masterpiece': '🏆'
  }[rating] || '⭐');

  // Returns CSS class for a given rating category name
  const getRatingClass = (rating) => ({
    'Unbearable': 'reviews-rating-unbearable',
    'One Time Watch': 'reviews-rating-onetime',
    'Amazing': 'reviews-rating-amazing',
    'Masterpiece': 'reviews-rating-masterpiece'
  }[rating] || '');

  // Builds pie chart data by counting how many reviews fall in each rating category
  const calculatePieData = (reviewsList) => {
    const counts = {};
    ratingCategories.forEach(cat => {
      counts[cat.id] = {
        id: cat.id,
        name: cat.cat_name,
        emoji: getRatingEmoji(cat.cat_name),
        value: 0
      };
    });
    reviewsList.forEach(r => {
      if (counts[r.rating_cat]) {
        counts[r.rating_cat].value += 1;
      }
    });
    return Object.values(counts);
  };

  // Recalculates pie chart data only when reviews or categories change
  const localPieData = React.useMemo(() => {
    if (!reviews.length || !ratingCategories.length) return [];
    return calculatePieData(reviews);
  }, [reviews, ratingCategories]);

  // Deletes the user's review, then resets AI summary to regenerate fresh
  const handleDeleteReview = async (reviewId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete your review?");
    if (!confirmDelete) return;

    await supabase
      .from("reviews")
      .delete()
      .eq("id", reviewId)
      .eq("email", user.email);

    // Re-enable post button since user no longer has a review
    setPosting(false);

    // Wait for fresh reviews to load before resetting AI
    await fetchReviews();

    // Clear old summary and force fresh AI generation
    // ignorePropSummary prevents the stale summary prop from being reused
    setAiSummary(null);
    setIgnorePropSummary(true);
    setAiRequested(false);
  };

  // Sets the review into edit mode with its current text pre-filled
  const handleEditClick = (review) => {
    setEditingReviewId(review.id);
    setEditedText(review.review_text);
  };

  // Saves the edited review text to DB and updates local state, then regenerates AI summary
  const handleUpdateReview = async (reviewId) => {
    if (!editedText.trim()) return alert("Review cannot be empty");

    const { data, error } = await supabase
      .from("reviews")
      .update({ review_text: editedText })
      .eq("id", reviewId)
      .select();

    if (error) {
      console.error(error);
      alert("Update failed");
      return;
    }

    if (!data || data.length === 0) {
      alert("Update failed.");
      return;
    }

    // Close the edit box
    setEditingReviewId(null);
    setEditedText("");

    // Optimistically update the review text in local state without refetching
    setReviews(prev =>
      prev.map(r =>
        r.id === reviewId
          ? { ...r, review_text: editedText }
          : r
      )
    );

    // Clear old summary and force fresh AI generation with updated review text
    // ignorePropSummary prevents the stale summary prop from being reused
    setAiSummary(null);
    setIgnorePropSummary(true);
    setAiRequested(false);
  };

  // Cancels edit mode without saving
  const handleCancelEdit = () => {
    setEditingReviewId(null);
    setEditedText("");
  };

  // Fetches leaderboard rank for a list of user emails
  const fetchUserRanks = async (emails) => {
    if (emails.length === 0) return {};

    const { data, error } = await supabase
      .from('user_analytics')
      .select('email, position')
      .in('email', emails);

    if (error) {
      console.error(error);
      return {};
    }

    // Build a map of email -> rank position for quick lookup
    const rankMap = {};
    data.forEach(row => {
      rankMap[row.email] = row.position;
    });

    return rankMap;
  };

  // Loads the currently logged-in user's profile and rank
  const getUser = async () => {
    const email = localStorage.getItem("userEmail");
    if (!email) return;

    const { data, error } = await supabase
      .from("user")
      .select("*")
      .eq("email", email)
      .single();

    if (!error) { setUser(data); }

    // Fetch rank separately and merge into user state
    const { data: rankData, error: rankError } = await supabase
      .from('user_analytics')
      .select('position')
      .eq('email', email)
      .single();

    if (!rankError && rankData) {
      setUser(prevUser => ({ ...prevUser, userRank: rankData.position }));
    }
  };

  // On mount or when movieId changes, load everything fresh
  useEffect(() => {
    fetchReviews();
    getUser();
    fetchRatingCategories();
  }, [movieId]);

  // Fetches all rating category names (Unbearable, Amazing, etc.)
  const fetchRatingCategories = async () => {
    const { data } = await supabase
      .from('ratingnames')
      .select('*')
      .order('id', { ascending: true });

    setRatingCategories(data || []);
  };

  // Fetches all reviews for this movie along with user info, rating, and like counts
  const fetchReviews = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('reviews')
        .select(`*, user:email ( avatar_url, name ), rating:rating_cat ( cat_name )`)
        .eq('movie_id', movieId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get unique emails and fetch their ranks in one batch call
      const emails = [...new Set(data.map(r => r.email))];
      const rankMap = await fetchUserRanks(emails);

      // Attach like count and rank to each review
      const reviewsWithLikes = await Promise.all(
        data.map(async (review) => {
          const { count } = await supabase
            .from('like_in_reviews')
            .select('*', { count: 'exact', head: true })
            .eq('review_id', review.id);

          return { ...review, likes: count || 0, userRank: rankMap[review.email] || null };
        })
      );

      setReviews(reviewsWithLikes);
    } finally {
      setLoading(false);
    }
  };

  // Persists the generated AI summary back to the movies table in DB
  const saveAiSummaryToMovie = async (summary) => {
    const { error } = await supabase
      .from("movies")
      .update({ ai_summary: summary })
      .eq("id", movieId);

    if (error) {
      console.error("Failed to save AI summary:", error);
    }
  };

  // Runs whenever reviews change or aiRequested resets to false
  // Handles first load (uses DB summary), and regeneration after post/edit/delete
  useEffect(() => {
    // Need at least 2 reviews to show a summary
    if (reviews.length < 2) return;

    // Already requested, don't call again
    if (aiRequested) return;

    // First load only: use the summary already saved in DB if available
    // ignorePropSummary is true after edit/delete, so we skip this and regenerate
    if (!ignorePropSummary && summary && summary !== "No summary" && aiSummary === null) {
      setAiSummary(summary);
      setAiRequested(true);
      return;
    }

    // Generate fresh AI summary from top 10 most liked reviews
    setAiRequested(true);
    const topReviews = [...reviews]
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 10);

    generateAiSummary(topReviews);
  }, [reviews, aiRequested]);

  // Calls Gemini API to generate a summary from the top reviews
  const generateAiSummary = async (topReviews) => {
    try {
      setAiLoading(true);
      setAiError(null);

      const prompt = `
You are a movie review analyst. Give summary of the reviews given by users in max 3 sentences. Add emoji to make it seem human.
  ${type} name is ${moviename} 
Reviews:
${topReviews.map((r, i) => `${i + 1}. ${r.review_text}`).join("\n")}
`;

      const response = await generateReviewSummary(prompt);
      const summaryText = response;

      if (!summaryText) throw new Error("No summary generated");

      setAiSummary(summaryText);

      // Save the new summary to DB so it loads instantly next time
      saveAiSummaryToMovie(summaryText);

    } catch (err) {
      console.error(err);
      // Silently fail — don't show error to user, just hide the summary
      setAiSummary(null);
      setAiError(null);
      setAiRequested(true); // Prevent retrying on failure
    } finally {
      setAiLoading(false);
    }
  };

  // Posts a new review, then triggers fresh AI summary generation
  const handlePostReview = async () => {
    if (!newReview.trim() || !selectedRating) return alert('Write a review & select rating');
    if (!user) return alert('Please sign in');
    if (posting) return; // Prevent double submit

    try {
      setPosting(true);
      await supabase.from('reviews').insert([
        {
          movie_id: movieId,
          email: user.email,
          review_text: newReview,
          rating_cat: selectedRating
        }
      ]);

      setNewReview('');
      setSelectedRating(null);

      // Reload reviews to include the new one
      await fetchReviews();
    } catch (err) {
      console.error(err);
      alert("Failed to post review. Please try again.");
      setPosting(false); // Re-enable only on error
    }

    // Regenerate summary including the newly posted review
    const topReviews = [...reviews]
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 10);

    generateAiSummary(topReviews);
  };

  // Handles liking or unliking a review, and sends a notification to the review owner
  const handleLikeReview = async (reviewId) => {
    if (!user) return;

    // Check if user already liked this review
    const { data: existingLike } = await supabase
      .from("like_in_reviews")
      .select("*")
      .eq("review_id", reviewId)
      .eq("email_of_liker", user.email)
      .single();

    if (existingLike) {
      // Already liked — remove the like
      await supabase
        .from("like_in_reviews")
        .delete()
        .eq("review_id", reviewId)
        .eq("email_of_liker", user.email);
    } else {
      // Not liked yet — add the like
      await supabase.from("like_in_reviews").insert([
        { review_id: reviewId, email_of_liker: user.email }
      ]);

      const review = reviews.find(r => r.id === reviewId);

      // Only notify if the liker is not the review owner
      if (review && review.email !== user.email) {
        const { count } = await supabase
          .from('like_in_reviews')
          .select('*', { count: 'exact', head: true })
          .eq('review_id', reviewId);

        const totalLikes = count || 1;

        const { data: movieData } = await supabase
          .from('movies')
          .select('title')
          .eq('id', movieId)
          .single();

        const movieName = movieData?.title || 'a movie';

        // Build notification text based on total like count
        let notificationText;
        if (totalLikes === 1) {
          notificationText = `${user.name || user.email} liked your review on ${movieName}`;
        } else {
          const othersCount = totalLikes - 1;
          notificationText = `${user.name || user.email} and ${othersCount} other${othersCount > 1 ? 's' : ''} liked your review on ${movieName}`;
        }

        // Remove old like notification for this review to avoid duplicates
        await supabase
          .from('notification')
          .delete()
          .eq('email', review.email)
          .eq('movie_id', movieId)
          .eq('type', 'reviews')
          .like('notification_text', `%liked your review on ${movieName}%`);

        // Insert updated notification
        await supabase
          .from('notification')
          .insert({
            email: review.email,
            type: 'reviews',
            notification_text: notificationText,
            movie_id: movieId,
            status: 'unread'
          });
      }
    }

    // Refresh reviews to reflect updated like count
    fetchReviews();
  };

  // Converts a UTC timestamp to a human-readable relative time string
  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const t = new Date(timestamp);
    const diff = Math.floor((now - t) / 1000);

    if (diff < 60) return "Just now";
    if (diff < 3600) return Math.floor(diff / 60) + " mins ago";
    if (diff < 86400) return Math.floor(diff / 3600) + " hrs ago";
    if (diff < 604800) return Math.floor(diff / 86400) + " days ago";
    return t.toLocaleDateString();
  };

  // Checks if the logged-in user has already posted a review for this movie
  useEffect(() => {
    if (!user) return;
    setAlreadyReviewed(reviews.some(r => r.email === user.email));
  }, [user, reviews]);

  return (
    <>
      {/* AI summary box — only shown when there are 2+ reviews and summary exists */}
      {(reviews.length >= 2 && (aiLoading || aiError || aiSummary)) && (
        <div className="reviews-ai-summary">
          <h4>✨ Audience Summary</h4>
          {aiLoading && <p className="ai-loading">Generating summary…</p>}
          {aiError && <p className="ai-error">{aiError}</p>}
          {aiSummary && (
            <p className="ai-summary-text typewriter">
              <TypeWriterText text={aiSummary} speed={20} />
            </p>
          )}
        </div>
      )}

      <div className="reviews-section">
        <h3 className="reviews-section-title">
          Reviews
          <span className="reviews-count">({reviews.length})</span>
        </h3>

        {/* Review input form — only shown if user hasn't reviewed yet */}
        {!AlreadyReviewed && (
          <div className="reviews-top-row">
            <div className="reviews-new-review">
              <img
                src={user?.avatar_url || "/default-avatar.png"}
                className={`reviews-item-avatar ${
                  user?.userRank === 1 ? "top-1" :
                  user?.userRank === 2 ? "top-2" :
                  user?.userRank === 3 ? "top-3" : ""
                }`}
                alt=""
              />
              <div className="reviews-form-container">
                <textarea
                  className="reviews-textarea"
                  placeholder="Write a quick comment..."
                  value={newReview}
                  onChange={(e) => setNewReview(e.target.value)}
                />
                <div className="reviews-form-actions">
                  {/* Rating category selector buttons */}
                  <div className="reviews-rating-buttons-small">
                    {ratingCategories.map((category) => (
                      <button
                        key={category.id}
                        className={`reviews-rating-btn-small ${getRatingClass(category.cat_name)} ${selectedRating === category.id ? 'reviews-selected' : ''}`}
                        onClick={() => setSelectedRating(category.id)}
                      >
                        <span className="reviews-emoji">{getRatingEmoji(category.cat_name)}</span>
                        <span className="reviews-rating-text">{category.cat_name}</span>
                      </button>
                    ))}
                  </div>
                  <button className="reviews-post-btn" onClick={handlePostReview}>
                    Post <span className="material-symbols-outlined">send</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Donut chart shown alongside the input form */}
            {reviews.length > 0 && (
              <div className="reviews-chart-box">
                <RatingDonutChart data={localPieData} />
              </div>
            )}
          </div>
        )}

        <div className="reviews-list">
          {loading ? (
            <p className="reviews-loading">Loading...</p>
          ) : reviews.length === 0 ? (
            <div className="reviews-chart-full"></div>
          ) : (
            <>
              {/* If user has reviewed, show their review pinned at top alongside the chart */}
              {AlreadyReviewed && (
                <div className="reviews-first-row">
                  <div className="reviews-item first-review">
                    <div className="reviews-avatar-wrapper">
                      <img
                        onClick={reviews[0].email ? () => { navigateToUserProfile(reviews[0].email) } : null}
                        style={{ cursor: "pointer" }}
                        src={reviews[0].user?.avatar_url || "/default-avatar.png"}
                        className={`reviews-item-avatar ${
                          reviews[0].userRank === 1 ? "top-1" :
                          reviews[0].userRank === 2 ? "top-2" :
                          reviews[0].userRank === 3 ? "top-3" : ""
                        }`}
                        alt=""
                      />
                      {/* Show rank badge for top 10 users */}
                      {reviews[0].userRank && (
                        reviews[0].userRank === 1 ? <span className="rank-badge gold">1</span> :
                        reviews[0].userRank === 2 ? <span className="rank-badge silver">2</span> :
                        reviews[0].userRank === 3 ? <span className="rank-badge bronze">3</span> :
                        reviews[0].userRank <= 10 ? <span className="rank-badge">{reviews[0].userRank}</span> : null
                      )}
                    </div>

                    <div className="reviews-item-content">
                      <div className="reviews-item-header">
                        {/* Highlight the current user's name */}
                        <p className={reviews[0].email === user?.email ? "reviews-item-username your-username" : "reviews-item-username"}>
                          {reviews[0].user.name.split(" ")[0]}
                        </p>
                        <p className="reviews-item-time">{getTimeAgo(reviews[0].created_at)}</p>
                        <div className={`reviews-item-rating ${getRatingClass(reviews[0].rating.cat_name)}`}>
                          {getRatingEmoji(reviews[0].rating.cat_name)} {reviews[0].rating.cat_name}
                        </div>
                        {/* Edit and delete buttons — only for the review owner */}
                        {reviews[0].email?.toLowerCase() === user?.email?.toLowerCase() && (
                          <>
                            <button className="reviews-edit-btn" onClick={() => handleEditClick(reviews[0])}>
                              <span className="material-symbols-outlined">edit</span>
                            </button>
                            <button className="reviews-delete-btn" onClick={() => handleDeleteReview(reviews[0].id)}>
                              <span className="material-symbols-outlined">delete</span>
                            </button>
                          </>
                        )}
                      </div>

                      {/* Show edit textarea if this review is being edited, otherwise show text */}
                      {editingReviewId === reviews[0].id ? (
                        <div className="reviews-edit-container">
                          <textarea
                            className="reviews-textarea"
                            value={editedText}
                            onChange={(e) => setEditedText(e.target.value)}
                          />
                          <div className="reviews-edit-actions">
                            <button className="reviews-save-btn" onClick={() => handleUpdateReview(reviews[0].id)}>Save</button>
                            <button className="reviews-cancel-btn" onClick={handleCancelEdit}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <p className="reviews-item-text">{reviews[0].review_text}</p>
                      )}

                      {/* Like button — disabled for own review */}
                      <button
                        className="reviews-like-btn"
                        onClick={() => handleLikeReview(reviews[0].id)}
                        disabled={reviews[0].email === user?.email}
                      >
                        <span className="material-symbols-outlined">favorite</span>
                        <span className="reviews-like-count">{reviews[0].likes} Likes</span>
                      </button>
                    </div>
                  </div>

                  {/* Chart shown beside the pinned review */}
                  {reviews.length > 0 && (
                    <div className="reviews-chart-box">
                      <RatingDonutChart data={localPieData} />
                    </div>
                  )}
                </div>
              )}

              {/* Remaining reviews list — skips index 0 if user's review is pinned above */}
              {reviews.slice(AlreadyReviewed ? 1 : 0).map((review) => (
                <div key={review.id} className="reviews-item">
                  <div className="reviews-avatar-wrapper">
                    <img
                      onClick={review.email ? () => { navigateToUserProfile(review.email) } : null}
                      style={{ cursor: "pointer" }}
                      src={review.user?.avatar_url || "/default-avatar.png"}
                      className={`reviews-item-avatar ${
                        review.userRank === 1 ? "top-1" :
                        review.userRank === 2 ? "top-2" :
                        review.userRank === 3 ? "top-3" : ""
                      }`}
                      alt=""
                    />
                    {/* Rank badge for top 10 users */}
                    {review.userRank && (
                      review.userRank === 1 ? <span className="rank-badge gold">1</span> :
                      review.userRank === 2 ? <span className="rank-badge silver">2</span> :
                      review.userRank === 3 ? <span className="rank-badge bronze">3</span> :
                      review.userRank <= 10 ? <span className="rank-badge">{review.userRank}</span> : null
                    )}
                  </div>

                  <div className="reviews-item-content">
                    <div className="reviews-item-header">
                      <p className={review.email?.toLowerCase() === user?.email?.toLowerCase() ? "reviews-item-username your-username" : "reviews-item-username"}>
                        {review.user.name.split(" ")[0]}
                      </p>
                      <p className="reviews-item-time">{getTimeAgo(review.created_at)}</p>
                      <div className={`reviews-item-rating ${getRatingClass(review.rating.cat_name)}`}>
                        {getRatingEmoji(review.rating.cat_name)} {review.rating.cat_name}
                      </div>
                      {/* Edit and delete — only for the review owner */}
                      {review.email?.toLowerCase() === user?.email?.toLowerCase() && (
                        <>
                          <button className="reviews-edit-btn" onClick={() => handleEditClick(review)}>
                            <span className="material-symbols-outlined">edit</span>
                          </button>
                          <button className="reviews-delete-btn" onClick={() => handleDeleteReview(review.id)}>
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </>
                      )}
                    </div>

                    {/* Inline edit mode or display mode */}
                    {editingReviewId === review.id ? (
                      <div className="reviews-edit-container">
                        <textarea
                          className="reviews-textarea"
                          value={editedText}
                          onChange={(e) => setEditedText(e.target.value)}
                        />
                        <div className="reviews-edit-actions">
                          <button className="reviews-save-btn" onClick={() => handleUpdateReview(review.id)}>Save</button>
                          <button className="reviews-cancel-btn" onClick={handleCancelEdit}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <p className="reviews-item-text">{review.review_text}</p>
                    )}

                    {/* Like button — disabled for own review */}
                    <button
                      className="reviews-like-btn"
                      onClick={() => handleLikeReview(review.id)}
                      disabled={review.email === user?.email}
                    >
                      <span className="material-symbols-outlined">favorite</span>
                      <span className="reviews-like-count">{review.likes} Likes</span>
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ReviewsSection;