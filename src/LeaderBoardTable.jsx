import React, { useEffect, useState } from "react";
import { supabase } from "./supabase";
import "./LeaderboardTable.css";

const LeaderboardTable = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("user_analytics")
        .select("*")
        .order("review_score", { ascending: false });

      if (error) {
        console.error("Error fetching leaderboard users:", error);
        setUsers([]);
      } else {
        setUsers(data || []);
      }

      setLoading(false);
    };

    fetchUsers();
  }, []);

  if (loading) {
    return <div className="table-loading">Loading leaderboard...</div>;
  }

  return (
    <div className="analytics-table-wrapper" >
      <div className="analytics-table">

        {/* Header */}
        <div className="table-header">
          <span className="col-user">User</span>
          <span className="col-center">Reviews</span>
          <span className="col-center text-amber">Masterpiece</span>
          <span className="col-center text-blue">Amazing</span>
          <span className="col-center">One Time</span>
          <span className="col-center text-red">Unbearable</span>
          <span className="col-engagement">Engagement</span>
          <span className="col-center col-score">Score</span>
        </div>

        {/* Body */}
        <div className="table-body">
          {users.map((user) => (
            <div className="table-row" key={user.email}>

              <div className="user-cell">
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="user-avatar"
                />
                <div className="user-info">
                  <strong>{user.name}</strong>
                  <small>{user.email}</small>
                </div>
              </div>

              <div className="col-center" data-label="Reviews">
                <span className="badge">{user.total_reviews}</span>
              </div>

              <div className="col-center" data-label="Masterpiece">
                {user.masterpiece}
              </div>

              <div className="col-center" data-label="Amazing">
                {user.amazing}
              </div>

              <div className="col-center" data-label="One Time">
                {user.one_time}
              </div>

              <div className="col-center" data-label="Unbearable">
                {user.unbearable > 50 ? (
                  <span className="badge-danger">{user.unbearable}</span>
                ) : (
                  user.unbearable
                )}
              </div>

              <div className="engagement-cell">
                <span>👍 {user.likes_received}</span>
                <span>💗 {user.likes_given}</span>
              </div>

              <div className="col-center score-cell">
                <span className="score-value">
                  {Number(user.review_score).toFixed(1)}
                </span>
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardTable;
