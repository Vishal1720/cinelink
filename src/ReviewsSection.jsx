import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import RatingDonutChart from "./RatingDonutChart";
import './ReviewsSection.css';
import TypewriterText from './TypeWritertext';
import { generateReviewSummary } from "./gemini";

const ReviewsSection = ({ movieId, pieData,totalreviews,summary,moviename,type }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newReview, setNewReview] = useState('');
  const [selectedRating, setSelectedRating] = useState(null);
  const [user, setUser] = useState(null);
  const [ratingCategories, setRatingCategories] = useState([]);
  const [AlreadyReviewed, setAlreadyReviewed] = useState(false);
const [aiRequested, setAiRequested] = useState(false);//only one time load


  const [aiSummary, setAiSummary] = useState(null);
const [aiLoading, setAiLoading] = useState(false);
const [aiError, setAiError] = useState(null);


  const handleDeleteReview = async (reviewId) => {
  const confirmDelete = window.confirm("Are you sure you want to delete your review?");
  if (!confirmDelete) return;

  await supabase
    .from("reviews")
    .delete()
    .eq("id", reviewId)
    .eq("email", user.email); // extra safety

  fetchReviews(); // refresh list
};

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

  const rankMap = {};
  data.forEach(row => {
    //email key and position is value
    rankMap[row.email] = row.position;
  });

  return rankMap;
};


  // Fetch user
  const getUser = async () => {
    const email = localStorage.getItem("userEmail");
    if (!email) return;
    console.log(email);
    const { data, error } = await supabase
      .from("user")
      .select("*")//alias userRank
      .eq("email", email)
      .single();

    if (!error) {setUser(data);}

    const {data:rankData, error:rankError} = await supabase
    .from('user_analytics')
    .select('position')
    .eq('email', email)
    .single();
    if (!rankError && rankData) {
      setUser(prevUser => ({ ...prevUser, userRank: rankData.position }));
      console.log("User rank:", rankData.position);
    }
   
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
      //  create emails array
    const emails = [...new Set(data.map(r => r.email))];

const rankMap = await fetchUserRanks(emails);
      const reviewsWithLikes = await Promise.all(
        data.map(async (review) => {
          const { count } = await supabase
            .from('like_in_reviews')
            .select('*', { count: 'exact', head: true })
            .eq('review_id', review.id);
//added rank too in reviews
          return { ...review, likes: count || 0,userRank: rankMap[review.email] || null };
        })
      );

      setReviews(reviewsWithLikes);
     
    } finally {
      setLoading(false);
    }
  };

  const saveAiSummaryToMovie = async (summary) => {
  const { error } = await supabase
    .from("movies")
    .update({ ai_summary: summary })
    .eq("id", movieId);

  if (error) {
    console.error("Failed to save AI summary:", error);
  }
};

  useEffect(() => {
    
  if (reviews.length < 2) return;
  if(summary!="No summary")
  {
    setAiSummary(summary);
    return
  }
  if (aiRequested) return; // 🔒 prevents repeat calls
 setAiRequested(true);
  const topReviews = [...reviews]
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 10);

  generateAiSummary(topReviews);
 
}, [reviews, aiRequested]);

const generateAiSummary = async (topReviews) => {
  try {
    setAiLoading(true);
    setAiError(null);

    const prompt = `
You are a movie review analyst.Give summary of the reviews given by users in max 3 sentences.Add emoji to make it seem human.
  ${type} name is ${moviename} 
Reviews:
${topReviews.map((r, i) => `${i + 1}. ${r.review_text}`).join("\n")}
`;

    const response=await generateReviewSummary(prompt);

    const data = response;

    const summary =data;
saveAiSummaryToMovie(summary);
    if (!summary) throw new Error("No summary generated");
    
    setAiSummary(summary);
  } catch (err) {
    console.error(err);
    // setAiError("Failed to generate AI summary"); if limit is hit we dont show summary
     setAiSummary(null);
    setAiError(null);
    setAiRequested(true); // prevent retries
  } finally {
    setAiLoading(false);
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
    <>
    {(reviews.length >= 2 && (aiLoading || aiError || aiSummary)) && (
  <div className="reviews-ai-summary">
    <h4>✨ Audience Summary</h4>

    {aiLoading && <p className="ai-loading">Generating summary…</p>}

    {aiError && <p className="ai-error">{aiError}</p>}

    {aiSummary && (
      <p className="ai-summary-text typewriter"> 
      <TypewriterText text={aiSummary} speed={20} />
      </p>
    )}
  </div>
)}

    <div className="reviews-section">
      <h3 className="reviews-section-title">Reviews</h3>

      {/* ⭐ CASE 1: User has NOT reviewed → Input + Chart */}
      {!AlreadyReviewed && (
        <div className="reviews-top-row">
          {/* Input */}
          <div className="reviews-new-review">
            <img
              src={user?.avatar_url || "/default-avatar.png"}
               className={`reviews-item-avatar ${
    user?.userRank === 1
      ? "top-1"
      : user?.userRank === 2
      ? "top-2"
      : user?.userRank === 3
      ? "top-3"
      : ""
  }`}
              alt=""
            />
            {}
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
                   <div className="reviews-avatar-wrapper">
                  <img
                    src={reviews[0].user?.avatar_url || "/default-avatar.png"}
                    className={`reviews-item-avatar ${
    reviews[0].userRank === 1
      ? "top-1"
      : reviews[0].userRank === 2
      ? "top-2"
      : reviews[0].userRank === 3
      ? "top-3"
      : ""
  }`}
                    alt=""
                  />
                {reviews[0].userRank && (
  reviews[0].userRank === 1 ? (
    <span className="rank-badge gold">1</span>
  ) : reviews[0].userRank === 2 ? (
    <span className="rank-badge silver">2</span>
  ) : reviews[0].userRank === 3 ? (
    <span className="rank-badge bronze">3</span>
  ) : reviews[0].userRank <=10 ? (
    <span className="rank-badge">{reviews[0].userRank}</span>
  ) : null
)}
                </div>
                  <div className="reviews-item-content">
                    <div className="reviews-item-header">
                     <p
                    className={
                      reviews[0].email === user?.email
                        ? "reviews-item-username your-username"
                        : "reviews-item-username"
                    }
                  >
                  {reviews[0].user.name.split(" ")[0]}
                </p>
                
                      

                      <p className="reviews-item-time">
                        {getTimeAgo(reviews[0].created_at)}
                      </p>

                      <div className={`reviews-item-rating ${getRatingClass(reviews[0].rating.cat_name)}`}>
                        {getRatingEmoji(reviews[0].rating.cat_name)} {reviews[0].rating.cat_name}
                      </div>
                      {reviews[0].email === user?.email && (
  <button
    className="reviews-delete-btn"
    onClick={() => handleDeleteReview(reviews[0].id)}
  >
    <span className="material-symbols-outlined">delete</span>
  </button>
)}
                    </div>
                    
                    <p className="reviews-item-text">
                      {reviews[0].review_text}
                    </p>
                    <button
                    className="reviews-like-btn"
                    onClick={() => handleLikeReview(reviews[0].id)}
                    disabled={ reviews[0].email === user?.email}
                  >
                
                    <span className="material-symbols-outlined">favorite</span>
                    <span className="reviews-like-count">{reviews[0].likes} Likes</span>
                  </button>
                    
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

                <div className="reviews-avatar-wrapper">
                <img
                  src={review.user?.avatar_url || "/default-avatar.png"}
                 className={`reviews-item-avatar ${
    review.userRank === 1
      ? "top-1"
      : review.userRank === 2
      ? "top-2"
      : review.userRank === 3
      ? "top-3"
      : ""
  }`}
                  alt=""
                />
                {review.userRank && (
  review.userRank === 1 ? (
    <span className="rank-badge gold">1</span>
  ) : review.userRank === 2 ? (
    <span className="rank-badge silver">2</span>
  ) : review.userRank === 3 ? (
    <span className="rank-badge bronze">3</span>
  ) : review.userRank <= 10 ? (
    <span className="rank-badge">{review.userRank}</span>
  ) : null
)}

                  </div>
                <div className="reviews-item-content">
                  <div className="reviews-item-header">
                   <p
                        className={
                          review.email === user?.email
                            ? "reviews-item-username your-username"
                            : "reviews-item-username"
                        }
                      >
                        {review.user.name.split(" ")[0]}
                        

                      </p>

                    <p className="reviews-item-time">
                      {getTimeAgo(review.created_at)}
                    </p>

                    <div className={`reviews-item-rating ${getRatingClass(review.rating.cat_name)}`}>
                      {getRatingEmoji(review.rating.cat_name)} {review.rating.cat_name}
                    </div>
                      {review.email === user?.email && (
  <button
    className="reviews-delete-btn"
    onClick={() => handleDeleteReview(review.id)}
  >
    <span className="material-symbols-outlined">delete</span>
  </button>
)}
                  </div>

                  <p className="reviews-item-text">{review.review_text}</p>

                  <button
                    className="reviews-like-btn"
                    onClick={() => handleLikeReview(review.id)}
                    disabled={ review.email === user?.email}
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
