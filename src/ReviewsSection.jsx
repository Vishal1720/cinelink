import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import RatingDonutChart from "./RatingDonutChart";
import './ReviewsSection.css';

const ReviewsSection = ({ movieId, pieData,totalreviews }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newReview, setNewReview] = useState('');
  const [selectedRating, setSelectedRating] = useState(null);
  const [user, setUser] = useState(null);
  const [ratingCategories, setRatingCategories] = useState([]);
  const [AlreadyReviewed, setAlreadyReviewed] = useState(false);

  // Fetch user
  const getUser = async () => {
    const email = localStorage.getItem("userEmail");
    if (!email) return;

    const { data, error } = await supabase
      .from("user")
      .select("*")
      .eq("email", email)
      .single();

    if (!error) setUser(data);
  };

  useEffect(() => {
    fetchReviews();
    getUser();
    fetchRatingCategories();
  }, [movieId]);

  const fetchRatingCategories = async () => {
    const { data } = await supabase
      .from('ratingnames')
      .select('*')
      .order('id', { ascending: true });

    setRatingCategories(data || []);
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('reviews')
        .select(`*, user:email ( avatar_url, name ), rating:rating_cat ( cat_name )`)
        .eq('movie_id', movieId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const reviewsWithLikes = await Promise.all(
        data.map(async (review) => {
          const { count } = await supabase
            .from('like_in_reviews')
            .select('*', { count: 'exact', head: true })
            .eq('review_id', review.id);

          return { ...review, likes: count || 0 };
        })
      );

      setReviews(reviewsWithLikes);
     
    } finally {
      setLoading(false);
    }
  };

  const handlePostReview = async () => {
    if (!newReview.trim() || !selectedRating) return alert('Write a review & select rating');
    if (!user) return alert('Please sign in');

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
    fetchReviews();
  };

  const handleLikeReview = async (reviewId) => {
    const { data: existingLike } = await supabase
      .from("like_in_reviews")
      .select("*")
      .eq("review_id", reviewId)
      .eq("email_of_liker", user.email)
      .single();

    if (existingLike) {
      await supabase
        .from("like_in_reviews")
        .delete()
        .eq("review_id", reviewId)
        .eq("email_of_liker", user.email);
    } else {
      await supabase.from("like_in_reviews").insert([
        { review_id: reviewId, email_of_liker: user.email }
      ]);
    }

    fetchReviews();
  };

  const getRatingEmoji = (rating) => ({
    'Unbearable': '😫',
    'One Time Watch': '👍',
    'Amazing': '🤩',
    'Masterpiece': '🏆'
  }[rating] || '⭐');

  const getRatingClass = (rating) => ({
    'Unbearable': 'reviews-rating-unbearable',
    'One Time Watch': 'reviews-rating-onetime',
    'Amazing': 'reviews-rating-amazing',
    'Masterpiece': 'reviews-rating-masterpiece'
  }[rating] || '');

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

  // Detect user review
  useEffect(() => {
    if (!user) return;
    setAlreadyReviewed(reviews.some(r => r.email === user.email));
  }, [user, reviews]);

  return (
    <div className="reviews-section">
      <h3 className="reviews-section-title">Reviews</h3>

      {/* ⭐ CASE 1: User has NOT reviewed → Input + Chart */}
      {!AlreadyReviewed && (
        <div className="reviews-top-row">
          {/* Input */}
          <div className="reviews-new-review">
            <img
              src={user?.avatar_url || "/default-avatar.png"}
              className="reviews-item-avatar"
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
                <div className="reviews-rating-buttons-small">
                  {ratingCategories.map((category) => (
                    <button
                      key={category.id}
                      className={`reviews-rating-btn-small ${getRatingClass(category.cat_name)} ${selectedRating === category.id ? 'reviews-selected' : ''}`}
                      onClick={() => setSelectedRating(category.id)}
                    >
                      <span className="reviews-emoji">
                        {getRatingEmoji(category.cat_name)}
                      </span>
                      <span className="reviews-rating-text">
  {category.cat_name}
</span>
                    
                    </button>
                  ))}
                </div>

                <button className="reviews-post-btn" onClick={handlePostReview}>
                  Post <span className="material-symbols-outlined">send</span>
                </button>
              </div>
            </div>
          </div>

          {/* Chart */}
          {totalreviews>0&& <div className="reviews-chart-box">
            <RatingDonutChart data={pieData} />
          </div>}
         
        </div>
      )}

      {/* ⭐ CASE 2: REVIEWS LIST */}
      <div className="reviews-list">
        {loading ? (
          <p className="reviews-loading">Loading...</p>
        ) : reviews.length === 0 ? (
          <div className="reviews-chart-full">
            {/* no reviews here */}
           
          </div>
        ) : (
          <>
            {/* ⭐ User HAS reviewed → First review + Chart */}
            {AlreadyReviewed && (
              <div className="reviews-first-row">
                <div className="reviews-item first-review">
                  <img
                    src={reviews[0].user?.avatar_url || "/default-avatar.png"}
                    className="reviews-item-avatar"
                    alt=""
                  />

                  <div className="reviews-item-content">
                    <div className="reviews-item-header">
                      <p className="reviews-item-username">
                        {reviews[0].user.name.split(" ")[0]}
                      </p>

                      <p className="reviews-item-time">
                        {getTimeAgo(reviews[0].created_at)}
                      </p>

                      <div className={`reviews-item-rating ${getRatingClass(reviews[0].rating.cat_name)}`}>
                        {getRatingEmoji(reviews[0].rating.cat_name)} {reviews[0].rating.cat_name}
                      </div>
                    </div>

                    <p className="reviews-item-text">
                      {reviews[0].review_text}
                    </p>

                    <span className="material-symbols-outlined" onClick={() => handleLikeReview(reviews[0].id)}>favorite</span>
                    <span className="reviews-like-count">{reviews[0].likes} Likes</span>
                  </div>
                </div>
                {totalreviews>0&&<div className="reviews-chart-box">
                  <RatingDonutChart data={pieData} />
                </div>}
                
              </div>
            )}

            {/* ⭐ Remaining reviews */}
            {reviews.slice(AlreadyReviewed ? 1 : 0).map((review) => (
              <div key={review.id} className="reviews-item">
                <img
                  src={review.user?.avatar_url || "/default-avatar.png"}
                  className="reviews-item-avatar"
                  alt=""
                />

                <div className="reviews-item-content">
                  <div className="reviews-item-header">
                    <p className="reviews-item-username">
                      {review.user.name.split(" ")[0]}
                    </p>

                    <p className="reviews-item-time">
                      {getTimeAgo(review.created_at)}
                    </p>

                    <div className={`reviews-item-rating ${getRatingClass(review.rating.cat_name)}`}>
                      {getRatingEmoji(review.rating.cat_name)} {review.rating.cat_name}
                    </div>
                  </div>

                  <p className="reviews-item-text">{review.review_text}</p>

                  <button
                    className="reviews-like-btn"
                    onClick={() => handleLikeReview(review.id)}
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
  );
};

export default ReviewsSection;
