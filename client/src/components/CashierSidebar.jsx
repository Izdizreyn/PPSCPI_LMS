import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";
import "./CashierSidebar.css";

export default function CashierSidebar({ links }) {
  const [expanded, setExpanded] = useState(false);
  const { pathname } = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
      navigate("/");
    }
  };

  return (
    <>
      <div className={`cashier-sidebar ${expanded ? "expanded" : ""}`}>
        <img src={logo} alt="logo" />
        <ul>
          {links.map((link) => (
            <li key={link.to}>
              <Link to={link.to} className={pathname === link.to ? "active" : ""}>
                <span className="icon">{link.icon}</span>
                <span className="label">{link.label}</span>
              </Link>
            </li>
          ))}
        </ul>
        <ul className="logout">
          <li>
            <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
              <span className="icon">🚪</span>
              <span className="label">Logout</span>
            </a>
          </li>
        </ul>
      </div>
      <button
        className="cashier-toggle-btn"
        style={{ left: expanded ? "310px" : "90px" }}
        onClick={() => setExpanded(!expanded)}
      >
        ☰
      </button>
    </>
  );
}