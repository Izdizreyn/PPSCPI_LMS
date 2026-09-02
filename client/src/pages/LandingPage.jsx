import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import "./LandingPage.css";

const programs = [
  { level: "Pre-School Education", sections: ["A", "B"] },
  { level: "Elementary Education", sections: ["A", "B"] },
  { level: "Junior High School", sections: ["A", "B"] },
  { level: "Senior High School", sections: ["A", "B"] },
];

export default function LandingPage() {
  return (
    <>
      <Navbar />

      <section className="hero">
        <svg
          className="hero-waves"
          viewBox="0 0 1060 600"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M0,520 C220,460 340,600 560,520 C760,450 860,560 1060,470" className="wave wave-1" />
          <path d="M120,600 C320,500 420,620 620,500 C820,400 940,540 1060,380" className="wave wave-2" />
          <path d="M300,600 C480,520 560,600 720,520 C880,440 960,500 1060,430" className="wave wave-3" />
          <path d="M700,600 C820,500 900,560 1060,420" className="wave wave-4" />
        </svg>

        <div className="hero-inner">
          <div className="hero-text">
            <h1>Power Purple College of Southern Philippines Inc.</h1>
            <p>
              PPSCPI's foundation and existence is guided by the philosophy that love
              is the basis of true education and it is God's ministry on earth.
            </p>
            <p>
              We are committed to excel and make a difference in the delivery of
              educational services for the harmonious development of the physical,
              mental, emotional, social, and spiritual aspects of every Purpleight's
              well-being.
            </p>
            <p>
              Our goal is to ensure a powerful future for our students and enable
              them to co-exist justly and fairly with their fellowmen, contributing
              their acquired abilities and skills to nation building while living up
              to Christian precepts and Filipino values.
            </p>
          </div>

          <div className="hero-actions">
            <Link to="/admin-login" className="hero-btn hero-btn-staff">
              <span className="hero-btn-label">Staff</span>
              <span className="hero-btn-hint">Login to manage enrollment</span>
            </Link>
            <Link to="/student-login" className="hero-btn hero-btn-student">
              <span className="hero-btn-label">Student</span>
              <span className="hero-btn-hint">Access your student portal</span>
            </Link>
            <Link to="/enroll" className="hero-btn hero-btn-enrollee">
              <span className="hero-btn-label">Enrollee</span>
              <span className="hero-btn-hint">Start your enrollment</span>
            </Link>
          </div>
        </div>

        <div className="scroll-hint">
          <span>Academic Programs</span>
          <div className="scroll-arrow" />
        </div>
      </section>

      <section className="content-section programs-section">
        <h2 className="section-title">Academic Programs</h2>
        <p className="section-subtitle">Every level is sectioned with A and B</p>

        <div className="programs-grid">
          {programs.map((p) => (
            <div className="program-card" key={p.level}>
              <h3>{p.level}</h3>
              <div className="program-sections">
                {p.sections.map((s) => (
                  <span className="section-badge" key={s}>Section {s}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}