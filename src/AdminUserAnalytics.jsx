import React, { useEffect, useState } from "react";
import { supabase } from "./supabase";
import "./AdminUserAnalytics.css";
import AdminHeader from "./AdminHeader";
import LeaderBoardTable from "./LeaderBoardTable";

const AdminUserAnalytics = () => {
  const [users, setUsers] = useState([]);
  const [topReviewer, setTopReviewer] = useState(null);
  const [topLiked, setTopLiked] = useState(null);

  const [searchValue, setSearchValue] = useState("");
const [searchedUser, setSearchedUser] = useState(null);
const [searchLoading, setSearchLoading] = useState(false);

  // Aggregates
  const totalReviewsSum = users.reduce(
    (sum, u) => sum + (u.total_reviews || 0),
    0
  );

  const totalMasterpiece = users.reduce(
    (sum, u) => sum + (u.masterpiece || 0),
    0
  );

  const totalAmazing = users.reduce(
    (sum, u) => sum + (u.amazing || 0),
    0
  );
  const handleSearch = async () => {
  if (!searchValue.trim()) return;

  setSearchLoading(true);

  const { data, error } = await supabase
    .from("user")
    .select("*")
    .or(`name.ilike.%${searchValue}%,email.ilike.%${searchValue}%`)
    .limit(1)
    .single();

  if (error) {
    console.error(error);
    setSearchedUser(null);
  } else {
    setSearchedUser(data);
  }

  setSearchLoading(false);
};

const toggleBlockStatus = async () => {
  if (!searchedUser) return;

  const newStatus =
    searchedUser.account_status === "blocked" ? "active" : "blocked";

  const { error } = await supabase
    .from("user")
    .update({ account_status: newStatus })
    .eq("email", searchedUser.email);

  if (error) {
    console.error(error);
    return;
  }

  setSearchedUser({
    ...searchedUser,
    account_status: newStatus,
  });
};

  const sentimentBalance =
    totalReviewsSum > 0
      ? (((totalMasterpiece + totalAmazing) / totalReviewsSum) * 100).toFixed(1)
      : 0;

  useEffect(() => {
    const fetchAnalytics = async () => {
      const { data, error } = await supabase
        .from("user_analytics")
        .select("*");

      if (error) {
        console.error("Admin analytics error:", error);
        return;
      }

      setUsers(data || []);

      if (data?.length) {
        setTopReviewer(
          [...data].sort((a, b) => b.total_reviews - a.total_reviews)[0]
        );
        setTopLiked(
          [...data].sort((a, b) => b.likes_received - a.likes_received)[0]
        );
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <div style={{ display: "flex" }}>
      <AdminHeader />

      <div className="admin-analytics">
        <div className="analytics-gradient-bg" />

        <div className="analytics-container">

          {/* HEADER */}
          <div className="analytics-header">
            <div className="breadcrumb">
              <span>Admin</span>
              <span>/</span>
              <span>Review Analytics</span>
            </div>

            <div className="header-text">
              <h2>USER REVIEW ANALYTICS</h2>
              <p>
                Platform-wide insights into user engagement, contribution,
                and sentiment trends.
              </p>
            </div>
          </div>

          {/* HIGHLIGHTS */}
          <div className="highlights-grid">
            {topReviewer && (
              <div className="highlight-card card-purple">
                <h3>Most Prolific Reviewer</h3>
                <div className="highlight-content">
                  <img
                    src={topReviewer.avatar_url}
                    alt={topReviewer.name}
                    className="highlight-avatar"
                  />
                  <div>
                    <p className="highlight-name">{topReviewer.name}</p>
                    <p className="highlight-stat purple-text">
                      {topReviewer.total_reviews} Reviews
                    </p>
                  </div>
                </div>
              </div>
            )}

            {topLiked && (
              <div className="highlight-card card-amber">
                <h3>Most Appreciated Reviewer</h3>
                <div className="highlight-content">
                  <img
                    src={topLiked.avatar_url}
                    alt={topLiked.name}
                    className="highlight-avatar"
                  />
                  <div>
                    <p className="highlight-name">{topLiked.name}</p>
                    <p className="highlight-stat amber-text">
                      {topLiked.likes_received.toLocaleString()} Likes
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* STATS */}
          <div className="stats-grid">
            <div className="stat-card">
              <p className="stat-label">Total Users</p>
              <p className="stat-value">{users.length}</p>
            </div>

            <div className="stat-card">
              <p className="stat-label">Total Reviews</p>
              <p className="stat-value">{totalReviewsSum}</p>
      
            </div>

            <div className="stat-card">
              <p className="stat-label">Sentiment Balance</p>
              <p className="stat-value">{sentimentBalance}%</p>
              <span className="stat-badge badge-green">Positive</span>
            </div>

            {topReviewer && (
              <div className="stat-card">
                <p className="stat-label">Top Contributor</p>
                <div className="top-contributor">
                  <img src={topReviewer.avatar_url} alt="" />
                  <p>@{topReviewer.email.split("@")[0]}</p>
                </div>
              </div>
            )}
          </div>

{/* SEARCH & BLOCK SECTION */}
<div className="block-section">
  <h3 className="block-title">User Access Control</h3>

  <div className="block-search-row">
    <input
      type="text"
      placeholder="Search by name or email..."
      className="search-input-control"
      value={searchValue}
      onChange={(e) => {
            setSearchValue(e.target.value);
  setSearchedUser(null); 
}}
      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
    />

    <button className="btn-primary" onClick={handleSearch}>
      {searchLoading ? "Searching..." : "Search"}
    </button>
  </div>

  {searchedUser && (
    <div className="block-result-card">
      <div className="block-user-info">
        <img
          src={searchedUser.avatar_url}
          alt={searchedUser.name}
          className="block-avatar"
        />
        <div>
          <p className="block-name">{searchedUser.name}</p>
          <p className="block-email">{searchedUser.email}</p>
        </div>
      </div>

      <div className="block-action">
        <span
          className={
            searchedUser.account_status === "blocked"
              ? "status-badge blocked"
              : "status-badge active"
          }
        >
          {searchedUser.account_status}
        </span>

        <button
          className={
            searchedUser.account_status === "blocked"
              ? "btn-unblock"
              : "btn-block"
          }
          onClick={toggleBlockStatus}
        >
          {searchedUser.account_status === "blocked"
            ? "Unblock User"
            : "Block User"}
        </button>
      </div>
    </div>
  )}
</div>

          {/* TABLE (SEPARATE COMPONENT) */}
          <LeaderBoardTable />

        </div>
      </div>
    </div>
  );
};

export default AdminUserAnalytics;
