import UserHeader from "./UserHeader";
import VishalImg from "./assets/vishal.png";
import NikhithaImg from "./assets/nikhitha.png";
import "./AboutUs.css";
import { useNavigate } from "react-router-dom";

const features = [
  {
    icon: "database",
    color: "blue",
    title: "Detailed Movie Insights",
    desc: "Go beyond basic information with rich movie details including cast, crew, genres, runtime, release data, and structured metadata — all organized for a seamless browsing experience within Cineverse.",
  },
  {
    icon: "stream",
    color: "cyan",
    title: "Watch Options",
    desc: "Instantly discover where a movie is available to stream, rent, or watch in theatres. Cineverse helps users quickly find accessible viewing options across platforms.",
  },
  {
    icon: "analytics",
    color: "sky",
    title: "Review & Rating Analytics",
    desc: "Explore visual rating breakdowns and audience trends through interactive charts. Compare overall ratings, review counts, and community sentiment — all powered by Cineverse analytics.",
  },
  {
    icon: "public",
    color: "indigo",
    title: "Cineverse Community",
    desc: "Connect with fellow movie enthusiasts. Share reviews, build personalized lists, explore recommendations, and engage in meaningful discussions within a growing cinema-driven community.",
  },
];

const stats = [
  { value: "100", label: "Movies Listed" },
  { value: "18", label: "Total Users" },
  { value: "50", label: "Total Reviews" },
  { value: "4",  label: "Total user recommendations" },
];

const team = [
  {
    name: "Vishal Shetty",
    role: "Co developer",
    roleColor: "blue",
    bio: "Vishal Shetty is an MCA student and full-stack developer ranked 15 in Karnataka PGCET. As co-creator of Cineverse, he blends technology and creativity to build engaging digital experiences.",
    img: VishalImg,
    badgeIcon: "terminal",
    badgeVariant: "blue",
    glowVariant: "blue",
    linkedIn: "https://www.linkedin.com/in/vishalshetty1720",
    portfolio: "https://vishal-shetty.web.app/",
    github:"https://github.com/Vishal1720",
    socialVariant: "blue",
  },
  {
    name: "Nikhitha",
    role: "Co developer",
    roleColor: "cyan",
    bio: "Nikhitha is an MCA student and Full Stack Developer specializing in MERN stack and real-time applications. As co-creator of CineVerse, she builds scalable and user-focused digital solutions.",
    img: NikhithaImg,
    badgeIcon: "code",
    badgeVariant: "cyan",
    glowVariant: "cyan",
    linkedIn: "https://www.linkedin.com/in/nikhitha-7918a3243/",
    github: "https://github.com/nikhitha211203",
    portfolio: "https://nikhitha-portfolio-tan.vercel.app/",
    socialVariant: "cyan",
  },
];

export default function AboutUs() {
  const navigate = useNavigate();

  return (
    <div className="about-us-page">
      {/* ─── Header ─── */}
      <UserHeader />

      {/* ─── Ambient background ─── */}
      <div className="au-bg-layer" aria-hidden="true">
        <div className="au-bg-base" />
        <div className="au-bg-image" />
        <div className="au-bg-gradient" />
        <div className="au-glow-blue" />
        <div className="au-glow-cyan" />
        <div className="au-grain" />
      </div>

      {/* ─── Main content ─── */}
      <main className="au-content">


        {/* ── Vision ── */}
        <section className="au-vision">
          <div className="au-glass-panel">
            <div className="au-vision-icon">
              <span className="material-symbols-outlined">visibility</span>
            </div>
            <h2 className="au-vision-title">Our Vision</h2>
            <p className="au-vision-text">
              We believe cinema is a shared language. Our goal is to bridge the
              gap between casual viewing and deep appreciation by providing a
              platform that respects the art form. We combine granular data with
              social connectivity to create the ultimate home for movie buffs.
            </p>
            <hr className="au-divider" />
          </div>
        </section>

        {/* ── Features ── */}
        <section className="au-features">
          <div className="au-section-header">
            <h2 className="au-section-title">What Makes Us Special</h2>
            <p className="au-section-sub">Engineered for the obsession.</p>
          </div>

          <div className="au-features-grid">
            {features.map((f) => (
              <div key={f.title} className="au-glass-card">
                <div className={`au-card-glow au-card-glow--${f.color}`} />
                <div className={`au-feature-icon au-feature-icon--${f.color}`}>
                  <span className="material-symbols-outlined">{f.icon}</span>
                </div>
                <div>
                  <h3 className="au-feature-title">{f.title}</h3>
                  <p className="au-feature-desc">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Team ── */}
        <section className="au-team">
          <div className="au-team-header">
            <h2 className="au-team-title">Meet the Minds</h2>
            <p className="au-team-sub">
              The architects and designers crafting your cinematic universe.
            </p>
          </div>

          <div className="au-team-grid">
            {team.map((member) => (
              <div key={member.name} className="au-team-card">
                {/* Avatar */}
                <div className="au-avatar-wrapper">
                  <div className={`au-avatar-glow au-avatar-glow--${member.glowVariant}`} />
                  <div className="au-avatar-ring">
                    <img src={member.img} alt={`${member.name} profile`} />
                  </div>
                  <div className={`au-avatar-badge au-avatar-badge--${member.badgeVariant}`}>
                    <span className="material-symbols-outlined">{member.badgeIcon}</span>
                  </div>
                </div>

                {/* Info */}
                <div className="au-member-info">
                  <div>
                    <h3 className="au-member-name">{member.name}</h3>
                    <p className={`au-member-role au-member-role--${member.roleColor}`}>
                      {member.role}
                    </p>
                  </div>

                  <p className="au-member-bio">{member.bio}</p>

                  {/* <div className="au-member-tags">
                    {member.tags.map((tag) => (
                      <span key={tag.label} className={`au-tag au-tag--${tag.color}`}>
                        {tag.label}
                      </span>
                    ))}
                  </div> */}

                  {/* Links: Portfolio + LinkedIn (conditional) */}
                 {/* Links: Portfolio + LinkedIn + GitHub */}
<div className={`au-member-links au-member-links--${member.socialVariant}`}>

  {/* Portfolio pill button */}
  {member.portfolio && (
    
      <a href={member.portfolio}
      target="_blank"
      rel="noopener noreferrer"
      className="au-portfolio-link"
      title="View Portfolio"
    >
      <span className="material-symbols-outlined">open_in_new</span>
      Portfolio
    </a>
  )}

  {/* LinkedIn icon button */}
  {member.linkedIn && (
    <a
      href={member.linkedIn}
      target="_blank"
      rel="noopener noreferrer"
      className="au-social-icon-link"
      title="LinkedIn"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452H16.89v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a1.982 1.982 0 0 1-1.98-1.981 1.982 1.982 0 1 1 1.98 1.981zm1.762 13.019H3.575V9h3.524v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    </a>
  )}

  {/* GitHub icon button */}
  {member.github && (
    
      <a href={member.github}
      target="_blank"
      rel="noopener noreferrer"
      className="au-social-icon-link"
      title="GitHub"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.089-.745.083-.729.083-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.418-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23a11.52 11.52 0 0 1 3-.405c1.02.005 2.045.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.605-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
      </svg>
    </a>
  )}

</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="au-stats">
          <div className="au-stats-sheen" aria-hidden="true" />
          <div className="au-stats-grid">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="au-stat-number">{s.value}</div>
                <div className="au-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}