import { Link, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";

export default function Navbar() {
  const { pathname } = useLocation();

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/admin-login", label: "Staff Login" },
    { to: "/enroll", label: "Student Enroll" },
    { to: "/profile-search", label: "Search Student" },
    { to: "/request-certificate", label: "Request" },
  ];

  return (
    <div className="topnav">
      <img src={logo} className="logo" alt="logo" />
      {navLinks.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          className={pathname === link.to ? "active" : ""}
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}