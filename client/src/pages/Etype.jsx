import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import PageBackground from "../components/PageBackground";
import "./Etype.css";

export default function Etype() {
  return (
    <>
      <Navbar />
      <PageBackground variant="orbit">
        <div className="etype-card">
          <h2 className="etype-title">Student Enrollment</h2>
          <p className="etype-subtitle">Select your enrollment type</p>

          <div className="etype-buttons">
            <Link to="/enroll/old" className="etype-btn etype-btn-old">
              <svg className="etype-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                <path d="M2 21c0-3.9 3.1-7 7-7s7 3.1 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M17 11l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Old Student</span>
            </Link>

            <Link to="/enroll/new" className="etype-btn etype-btn-new">
              <svg className="etype-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                <path d="M2 21c0-3.9 3.1-7 7-7s7 3.1 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M19 8v6M22 11h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span>New Student</span>
            </Link>

            <Link to="/enroll/transferee" className="etype-btn etype-btn-trans">
              <svg className="etype-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 3l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 11V9a4 4 0 0 1 4-4h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M7 21l-4-4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 13v2a4 4 0 0 1-4 4H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span>Transferee</span>
            </Link>
          </div>
        </div>
      </PageBackground>
    </>
  );
}