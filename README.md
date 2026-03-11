# 🎬 CineVerse TV – Movie & Series Discovery Platform

CineVerse is a web app to **discover, review, and decide what to watch** with community reviews, intelligent recommendations, and direct OTT / booking links.

🔗 **Live:** https://cineversetv.vercel.app/

---

## 🚀 Features

- **Reviews & Ratings** — Emotion-based categories (Unbearable → Masterpiece), one review per user, like system to surface quality reviews
- **Leaderboard** — Dynamic ranking based on reviews submitted, likes received and given. Top 3 highlighted with 🥇🥈🥉 badges
- **Smart Recommendations** — Genre-based + "If you liked this" system powered by SQL views
- **AI Audience Summary** — Gemini-powered sentiment summary generated after minimum reviews, cached in DB to avoid repeat calls
- **OTT & Booking Links** — Direct links to Netflix, Prime Video, BookMyShow and more
- **Admin Dashboard** — Engagement analytics, sentiment balance, top reviewers and like distribution

---

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React.js, CSS |
| Backend | Supabase (PostgreSQL) |
| AI | Gemini API |
| Storage | Supabase Storage |

---

## 🔐 Integrity
- One review per user per movie
- No self-likes
- Ranking system discourages spam

---

## 📌 Future Plans
- Personalized feed
- Follow reviewers
- Comment threads
- Weekly/monthly leaderboards
- Materialized views for scale

---

## 👨‍💻 Developers
- [Vishal Shetty](https://github.com/Vishal1720)
- [Nikhitha](https://github.com/nikhitha211203)

> CineVerse focuses on **trust, interaction, and action** — not just ratings.
