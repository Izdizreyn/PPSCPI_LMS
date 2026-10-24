import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";
import "./AdminSidebar.css";
import { LogoutIcon } from "./AdminIcons";

export default function AdminSidebar({ links }) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
      navigate("/", { replace: true });
    }
  };

  return (
    <div className="sidebar">
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
        {user?.role === "purple_admin" && (
          <li>
            <Link
              to="/admin/teachers"
              className={pathname === "/admin/teachers" ? "active" : ""}
            >
              <span className="icon">+</span>
              <span className="label">Create Teacher</span>
            </Link>
          </li>
        )}
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
  );
}
