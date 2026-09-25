import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";
import "./StudentSidebar.css";

const DashboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="white">
    <path d="M341.8 72.6C329.5 61.2 310.5 61.2 298.3 72.6L74.3 280.6C64.7 289.6 61.5 303.5 66.3 315.7C71.1 327.9 82.8 336 96 336L112 336L112 512C112 547.3 140.7 576 176 576L464 576C499.3 576 528 547.3 528 512L528 336L544 336C557.2 336 569 327.9 573.8 315.7C578.6 303.5 575.4 289.5 565.8 280.6L341.8 72.6zM264 320C264 289.1 289.1 264 320 264C350.9 264 376 289.1 376 320C376 350.9 350.9 376 320 376C289.1 376 264 350.9 264 320zM208 496C208 451.8 243.8 416 288 416L352 416C396.2 416 432 451.8 432 496C432 504.8 424.8 512 416 512L224 512C215.2 512 208 504.8 208 496z"/>
  </svg>
);

const DocumentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="white">
    <path d="M192 64C156.7 64 128 92.7 128 128L128 512C128 547.3 156.7 576 192 576L448 576C483.3 576 512 547.3 512 512L512 245.3C512 228.3 505.3 212 493.3 200L376 82.7C364 70.7 347.7 64 330.7 64L192 64zM320 96L320 208C320 234.5 341.5 256 368 256L480 256L480 512C480 529.7 465.7 544 448 544L192 544C174.3 544 160 529.7 160 512L160 128C160 110.3 174.3 96 192 96L320 96zM352 100L476 224L368 224C358.1 224 352 217.9 352 208L352 100zM208 320C199.2 320 192 327.2 192 336C192 344.8 199.2 352 208 352L432 352C440.8 352 448 344.8 448 336C448 327.2 440.8 320 432 320L208 320zM208 400C199.2 400 192 407.2 192 416C192 424.8 199.2 432 208 432L432 432C440.8 432 448 424.8 448 416C448 407.2 440.8 400 432 400L208 400z"/>
  </svg>
);

const PasswordIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="white">
    <path d="M400 416C497.2 416 576 337.2 576 240C576 142.8 497.2 64 400 64C302.8 64 224 142.8 224 240C224 258.7 226.9 276.8 232.3 293.7L71 455C66.5 459.5 64 465.6 64 472L64 552C64 565.3 74.7 576 88 576L168 576C181.3 576 192 565.3 192 552L192 512L232 512C245.3 512 256 501.3 256 488L256 448L296 448C302.4 448 308.5 445.5 313 441L346.3 407.7C363.2 413.1 381.3 416 400 416zM440 160C462.1 160 480 177.9 480 200C480 222.1 462.1 240 440 240C417.9 240 400 222.1 400 200C400 177.9 417.9 160 440 160z"/>
  </svg>
);

const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="white">
    <path d="M569 337C578.4 327.6 578.4 312.4 569 303.1L425 159C418.1 152.1 407.8 150.1 398.8 153.8C389.8 157.5 384 166.3 384 176L384 256L272 256C245.5 256 224 277.5 224 304L224 336C224 362.5 245.5 384 272 384L384 384L384 464C384 473.7 389.8 482.5 398.8 486.2C407.8 489.9 418.1 487.9 425 481L569 337zM224 160C241.7 160 256 145.7 256 128C256 110.3 241.7 96 224 96L160 96C107 96 64 139 64 192L64 448C64 501 107 544 160 544L224 544C241.7 544 256 529.7 256 512C256 494.3 241.7 480 224 480L160 480C142.3 480 128 465.7 128 448L128 192C128 174.3 142.3 160 160 160L224 160z"/>
  </svg>
);

export default function StudentSidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
      navigate("/", { replace: true });
    }
  };

  const links = [
    { to: "/student/dashboard", label: "Dashboard", icon: <DashboardIcon /> },
    { to: "/request-document", label: "Request Document", icon: <DocumentIcon /> },
    { to: "/student/change-password", label: "Change Password", icon: <PasswordIcon /> },
  ];

  return (
    <div className="student-sidebar">
      <img src={logo} alt="logo" />
      <ul>
        {links.map((link) => (
          <li key={link.label}>
            <NavLink
              to={link.to}
              end
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <span className="icon">{link.icon}</span>
              <span className="label">{link.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
      <ul className="logout">
        <li>
          
          <a href="#"
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