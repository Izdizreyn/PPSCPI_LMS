// client/src/config/navLinks.jsx
import {
  DashboardIcon,
  StudentsIcon,
  EnrolledIcon,
  RequestsIcon,
} from "../components/AdminIcons";

export const adminLinks = [
  { to: "/admin/dashboard", label: "Dashboard", icon: <DashboardIcon /> },
  { to: "/admin/students", label: "Students", icon: <StudentsIcon /> },
  { to: "/admin/enrolled", label: "Enrolled", icon: <EnrolledIcon /> },
  { to: "/admin/requests", label: "Requests", icon: <RequestsIcon /> },
];
