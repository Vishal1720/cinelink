import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import './ReviewsSection.css';

const ReviewsSection = ({ movieId }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newReview, setNewReview] = useState('');
  const [selectedRating, setSelectedRating] = useState(null);
  const [user, setUser] = useState(null);

  const [userEmail, setUserEmail] = useState('');
  const [ratingCategories, setRatingCategories] = useState([]);
const [AlreadyReviewed, setAlreadyReviewed] = useState(false);
  const getUser = async () => {
  const email = localStorage.getItem("userEmail");

  if (!email) return;

  const { data, error } = await supabase
    .from("user")
    .select("*")
    .eq("email", email)
    .single();

  if (!error && data) {
    setUser(data); // store full user row
     setUserEmail(email);
  }
  console.log("Fetched User:", data); // Debug log
};

  useEffect(() => {
    fetchReviews();
    getUser();
    fetchRatingCategories();
  }, [movieId]);

  const fetchRatingCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('ratingnames')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      setRatingCategories(data || []);
    } catch (error) {
      console.error('Error fetching rating categories:', error);
      // Fallback to default categories
      setRatingCategories([
        { id: 1, cat_name: 'Unbearable' },
        { id: 2, cat_name: 'One Time Watch' },
        { id: 3, cat_name: 'Amazing' },
        { id: 4, cat_name: 'Masterpiece' }
      ]);
    }
  };

 

  const fetchReviews = async () => {
    try {
      setLoading(true);
      
      const { data: reviewsData, error } = await supabase
        .from('reviews')
        .select(`*,user:email ( avatar_url,name ),rating:rating_cat ( cat_name )`)
        .eq('movie_id', movieId)
        .order('created_at', { ascending: false });
console.log("Fetched Reviews:", reviewsData); // Debug log
      if (error) throw error;

   

      // Fetch likes count for each review
      const reviewsWithLikes = await Promise.all(
        reviewsData.map(async (review) => {
          const { count, error: likesError } = await supabase
            .from('like_in_reviews')
            .select('*', { count: 'exact', head: true })
            .eq('review_id', review.id);

          return {
            ...review,
            likes: count || 0
          };
        })
      );

      setReviews(reviewsWithLikes);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostReview = async () => {
    if (!newReview.trim() || !selectedRating) {
      alert('Please write a review and select a rating');
      return;
    }

    try {
      
      
      if (!user) {
        alert('Please sign in to post a review');
        return;
      }

      const { data, error } = await supabase
        .from('reviews')
        .insert([
          {
            movie_id: movieId,
            email: user.email,
            review_text: newReview,
            rating_cat: selectedRating
          }
        ])
        .select();

      if (error) throw error;

      // Reset form
      setNewReview('');
      setSelectedRating(null);
      
      // Refresh reviews
      fetchReviews();
    } catch (error) {
      console.error('Error posting review:', error);
      alert('Error posting review. Please try again.');
    }
  };

  const handleLikeReview = async (reviewId) => {
    try {
      

      // Check if already liked
      const { data: existingLike } = await supabase
        .from('like_in_reviews')
        .select('*')
        .eq('review_id', reviewId)
        .eq('email_of_liker', user.email)
        .single();

      if (existingLike) {
        // Unlike
        await supabase
          .from('like_in_reviews')
          .delete()
          .eq('review_id', reviewId)
          .eq('email_of_liker', user.email);
      } else {
        // Like
        await supabase
          .from('like_in_reviews')
          .insert([
            {
              review_id: reviewId,
              email_of_liker: user.email
            }
          ]);
      }

      // Refresh reviews to update like count
      fetchReviews();
    } catch (error) {
      console.error('Error liking review:', error);
    }
  };

  const getRatingEmoji = (rating) => {
    const emojis = {
      'Unbearable': '😫',
      'One Time Watch': '👍',
      'Amazing': '🤩',
      'Masterpiece': '🏆'
    };
    return emojis[rating] || '⭐';
  };

  const getRatingClass = (rating) => {
    const classes = {
      'Unbearable': 'reviews-rating-unbearable',
      'One Time Watch': 'reviews-rating-onetime',
      'Amazing': 'reviews-rating-amazing',
      'Masterpiece': 'reviews-rating-masterpiece'
    };
    return classes[rating] || '';
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const reviewDate = new Date(timestamp);
    const diffInSeconds = Math.floor((now - reviewDate) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hrs ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return reviewDate.toLocaleDateString();
  };

  useEffect(() => {
  if (!user || reviews.length === 0) return;

  const userAlreadyReviewed = reviews.some(
    (review) => review.email === user.email
  );

  setAlreadyReviewed(userAlreadyReviewed);
}, [user, reviews]);


  return (
    <div className="reviews-section">
      <h3 className="reviews-section-title">Reviews</h3>

      {/* New Review Form */}
      {!AlreadyReviewed &&
      <div className="reviews-new-review">
        <div className="reviews-avatar-placeholder">
           <img
  src={user?.avatar_url || "/default-avatar.png"}
  alt="User Avatar"
  className="reviews-item-avatar"
/>
        </div>
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
                  className={`reviews-rating-btn-small ${getRatingClass(category.cat_name)} ${selectedRating === category.cat_name ? 'reviews-selected' : ''}`}
                  onClick={() => setSelectedRating(category.id)}
                >
                  <span className="reviews-emoji">{getRatingEmoji(category.cat_name)}</span>
                  <span className="reviews-rating-text">{category.cat_name}</span>
                </button>
              ))}
            </div>
            <button className="reviews-post-btn" onClick={handlePostReview}>
              <span>Post</span>
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
        </div>
      </div>}

      {/* Reviews List */}
      <div className="reviews-list">
        {loading ? (
          <div className="reviews-loading">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="reviews-empty">No reviews yet. Be the first to review!</div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="reviews-item">
              
               <img
  src={review.user?.avatar_url || "/default-avatar.png"}
  alt="User Avatar"
  className="reviews-item-avatar"
/>


              
              <div className="reviews-item-content">
                <div className="reviews-item-header">
                  <p className="reviews-item-username">{review.user.name.split(" ")[0]}</p>
                  <p className="reviews-item-time">{getTimeAgo(review.created_at)}</p>
                  <div className={`reviews-item-rating ${getRatingClass(review.rating.cat_name)}`}>
                    <span>{getRatingEmoji(review.rating.cat_name)}</span>
                    <span>{review.rating.cat_name}</span>
                  </div>
                </div>
                <p className="reviews-item-text">{review.review_text}</p>
                <div className="reviews-item-actions">
                  <button
                    className="reviews-like-btn"
                    onClick={() => handleLikeReview(review.id)}
                  >
                    <span className="material-symbols-outlined">favorite</span>
                    <span className="reviews-like-count">{review.likes} Likes</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReviewsSection;