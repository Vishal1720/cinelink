import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import "./ReviewsByPerson.css";
import { useNavigate } from "react-router-dom";
const ReviewsByPerson = ({ email,ratingtype="all" }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
const navigate = useNavigate();
  useEffect(() => {
    if (!email) return;
    
    const fetchReviews = async () => {

 let query = supabase
        .from("review_details_view")
        .select(`
          review_id,
          review_created_at,
          review_text,
          movie_title,
          movie_id,
          poster_url,
          rating_name,
          rating_emoji,
          likes_count
        `)
        .eq("reviewer_email", email)
        .order("review_created_at", { ascending: false })
        .limit(10);

      // Apply filter only if not "all"
      if (ratingtype !== "all" ) 
        {
        
        query = query.eq("rating_cat_id", ratingtype);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Fetch reviews error:", error);
      } else {
   
        setReviews(data);
      }

      setLoading(false);
    };

    fetchReviews();
  }, [email,ratingtype]);

  if (loading) {
    return <div className="reviews-loading">Loading reviews...</div>;
  }

  if (reviews.length === 0) {
    return (
      <div className="reviews-empty">
        No reviews posted yet.
      </div>
    );
  }

  return (
    <section className="reviews-by-person">
      <h2 className="reviews-title">Recent Reviews</h2>

      <div className="reviews-list">
        {reviews.map((review) => (
          <div key={review.review_id} className="review-card" >
            {/* Poster */}
            <div
              className="review-poster"
              style={{backgroundImage: `url(${review.poster_url})`,cursor:"pointer"}} onClick={()=>{navigate(`/movie/${review.movie_id}`)}}
            />

            {/* Content */}
            <div className="review-content">
              <div className="review-header">
                <h3>{review.movie_title} </h3>
                <span className="review-rating">
                  {review.rating_emoji} {review.rating_name}
                </span>
              </div>

              <p className="review-text">
                {review.review_text}
              </p>

              <div className="review-footer">
                <span className="review-date">
                  {new Intl.DateTimeFormat("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                })
                .format(new Date(review.review_created_at))
                .replace(/\//g, "/")}
                {/*  - en-GB locale gives DD/MM/YY
 - replace "/" with spaces to get "DD MM YY"  / → the character to replace
\ → escape for slash
g → global (replace all occurrences)*/}
                </span>

                <span className="review-likes">
                  ❤️ {review.likes_count}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ReviewsByPerson;
