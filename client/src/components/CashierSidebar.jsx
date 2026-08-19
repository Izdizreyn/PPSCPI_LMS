import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";
import "./CashierSidebar.css";
import { LogoutIcon } from "./AdminIcons";

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
              <Link
                to={link.to}
                className={pathname === link.to ? "active" : ""}
              >
                <span className="icon">{link.icon}</span>
                <span className="label">{link.label}</span>
              </Link>
            </li>
          ))}
        </ul>
        <ul className="logout">
          <li>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleLogout();
              }}
            >
              <span className="icon">
                <LogoutIcon />
              </span>
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
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="3" y1="6" x2="21" y2="6" strokeLinecap="round" />
          <line x1="3" y1="12" x2="21" y2="12" strokeLinecap="round" />
          <line x1="3" y1="18" x2="21" y2="18" strokeLinecap="round" />
        </svg>
      </button>
    </>
  );
}
