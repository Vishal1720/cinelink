
# 🎬 CineVerse – Smart Movie & Series Review Platform

CineVerse is a full-stack web application that helps users **discover, review, and decide what to watch and where to watch it** using trusted community reviews, intelligent recommendations, and direct OTT / booking links.

---

## 🚀 Features

### 🔹 User Reviews & Ratings
- One review per user per movie/series (prevents spam)
- Emotion-based rating categories:
  - 😫 Unbearable  
  - 👍 One Time Watch  
  - 🤩 Amazing  
  - 🏆 Masterpiece
- Like system to surface high-quality reviews
- Users cannot like their own reviews

---

### 🔹 Leaderboard & User Ranking
- Dynamic leaderboard based on:
  - Reviews submitted (30 points each)
  - Likes received (1 point each)
  - Likes given (0.5 points each)
- Top 3 users highlighted with:
  - 🥇 Gold
  - 🥈 Silver
  - 🥉 Bronze
- Rank badge displayed beside each review

---

### 🔹 Intelligent Recommendations
- Genre-based movie/series recommendations
- “If you liked this, try these” system based on:
  - Users giving positive reviews (rating categories 3 & 4)
  - Users liking positive reviews across movies
- Recommendation logic handled using SQL views for better performance

---

### 🔹 AI-Powered Audience Summary
- AI-generated summary of audience sentiment
- Generated only after a minimum number of reviews
- Stored in database to avoid repeated API calls
- Helps users quickly understand public opinion

---

### 🔹 OTT & Booking Integration
- Direct OTT links (Netflix, Prime Video, etc.)
- BookMyShow redirection
- Opens OTT or booking apps directly for seamless experience

---

### 🔹 Admin Analytics Dashboard
- User engagement analytics
- Sentiment balance across platform
- Top reviewers and most liked users
- Review and like distribution insights

---

## 🛠️ Tech Stack

### Frontend
- React.js
- CSS 

### Backend / Database
- Supabase (PostgreSQL)
- SQL Views for:
  - User ranking
  - Recommendation engine
- Supabase Storage for posters and avatars

### AI
- Gemini API (Audience summary generation)

---

## 🔐 Security & Integrity
- One review per user per movie
- No self-likes allowed
- Likes act as community validation
- Ranking discourages fake or spam reviews

---

## 📈 Scalability
- Database-level aggregation
- Minimal frontend computation
- Can be extended to:
  - Books
  - Games
  - Courses

---

## 🎯 Why CineVerse?
- More interactive than traditional rating platforms
- Focus on trust and quality reviews
- Action-oriented (watch or book directly)
- Balanced recognition system for users
- Modern UX with AI assistance

---

## 📌 Future Enhancements
- Personalized recommendation feed
- Follow reviewers
- Comment threads on reviews
- Weekly/monthly leaderboards
- Materialized views for high-scale data

---



## 🏁 Final Note
> CineVerse focuses on **trust, interaction, and action**, not just ratings.
