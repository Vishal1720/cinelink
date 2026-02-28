import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import "./RecommendationsByPerson.css";
import { useNavigate } from "react-router-dom";

const RecommendationsByPerson = ({ email }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // "all" | "like_based" | "normal_based"
  const navigate = useNavigate();

  useEffect(() => {
    if (!email) return;

    const fetchRecommendations = async () => {
      setLoading(true);

      let query = supabase
        .from("user_recommendation")
        .select("id, created_at, movie_id1, movie_id2, message, type_of_recommendation")
        .eq("email", email)
        .order("created_at", { ascending: false })
        .limit(10);

      if (filter !== "all") {
        query = query.eq("type_of_recommendation", filter);
      }

      const { data: recData, error: recError } = await query;

      if (recError) {
        console.error("Fetch recommendations error:", recError);
        setLoading(false);
        return;
      }

      if (!recData || recData.length === 0) {
        setRecommendations([]);
        setLoading(false);
        return;
      }

      // Collect all unique movie IDs to fetch posters in one query
      const movieIds = [...new Set(
        recData.flatMap((r) => [r.movie_id1, r.movie_id2].filter(Boolean))
      )];

      const { data: movieData, error: movieError } = await supabase
        .from("movies")
        .select("id, title, poster_url")
        .in("id", movieIds);

      if (movieError) {
        console.error("Fetch movies error:", movieError);
      }

      const movieMap = {};
      (movieData || []).forEach((m) => { movieMap[m.id] = m; });

      const enriched = recData.map((rec) => ({
        ...rec,
        movie1: movieMap[rec.movie_id1] || null,
        movie2: rec.movie_id2 ? movieMap[rec.movie_id2] || null : null,
      }));

      setRecommendations(enriched);
      setLoading(false);
    };

    fetchRecommendations();
  }, [email, filter]);

  if (loading) {
    return <div className="rbp-loading">Loading recommendations...</div>;
  }

  return (
    <section className="recommendations-by-person">
      {/* Header with filter tabs */}
      <div className="rbp-header">
        <h2 className="rbp-title">Recent Recommendations</h2>
        <div className="rbp-filter-tabs">
          {[
            { key: "all", icon: "apps", label: "All" },
            { key: "like_based", icon: "favorite", label: "Like Based" },
            { key: "normal_based", icon: "recommend", label: "Normal" },
          ].map(({ key, icon, label }) => (
            <button
              key={key}
              className={`rbp-tab ${filter === key ? "rbp-tab--active" : ""}`}
              onClick={() => setFilter(key)}
              title={label}
            >
              <span className="material-symbols-outlined rbp-tab-icon">{icon}</span>
              <span className="rbp-tab-label">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {recommendations.length === 0 ? (
        <div className="rbp-empty">No recommendations yet.</div>
      ) : (
        <div className="rbp-list">
          {recommendations.map((rec) => (
            <div key={rec.id} className="rbp-card">

              {/* Poster(s) */}
              <div className="rbp-posters">
                {rec.movie1 && (
                  <div
                    className="rbp-poster rbp-poster--main"
                    style={{ backgroundImage: `url(${rec.movie1.poster_url})` }}
                    onClick={() => navigate(`/movie/${rec.movie1.id}`)}
                    title={rec.movie1.title}
                  />
                )}
                {rec.movie2 && (
                  <div
                    className="rbp-poster rbp-poster--secondary"
                    style={{ backgroundImage: `url(${rec.movie2.poster_url})` }}
                    onClick={() => navigate(`/movie/${rec.movie2.id}`)}
                    title={rec.movie2.title}
                  />
                )}
              </div>

              {/* Content */}
              <div className="rbp-content">
                <div className="rbp-card-header">
                  <div className="rbp-titles">
                    <h3 className="rbp-movie-title">{rec.movie1?.title || "Unknown Movie"}</h3>
                    {rec.movie2 && (
                      <span className="rbp-movie-title-secondary">
                        + {rec.movie2.title}
                      </span>
                    )}
                  </div>
                  <span className={`rbp-type-badge rbp-type-badge--${rec.type_of_recommendation}`}>
                    {rec.type_of_recommendation === "like_based" ? "❤️ Like Based" : "🎯 Normal"}
                  </span>
                </div>

                {rec.message && (
                  <p className="rbp-message">{rec.message}</p>
                )}

                <div className="rbp-footer">
                  <span className="rbp-date">
                    {new Intl.DateTimeFormat("en-GB", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    }).format(new Date(rec.created_at))}
                  </span>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default RecommendationsByPerson;