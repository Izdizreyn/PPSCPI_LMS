// client/src/config/navLinks.jsx
import {
  DashboardIcon,
  StudentsIcon,
  EnrolledIcon,
  RequestsIcon,
  QueueIcon,
  CashierIcon,
} from "../components/AdminIcons";

export const adminLinks = [
  { to: "/admin/dashboard", label: "Dashboard", icon: <DashboardIcon /> },
  { to: "/admin/applicants", label: "Applicants", icon: <StudentsIcon /> },
  { to: "/admin/students", label: "Students", icon: <StudentsIcon /> },
  { to: "/admin/queue", label: "Queue", icon: <QueueIcon /> },
  { to: "/admin/enrolled", label: "Enrolled", icon: <EnrolledIcon /> },
  { to: "/admin/requests", label: "Requests", icon: <RequestsIcon /> },
];

export const cashierLinks = [
  { to: "/cashier", label: "Dashboard", icon: <DashboardIcon /> },
  { to: "/cashier/search", label: "Student Search", icon: <CashierIcon /> },
  { to: "/cashier/queue", label: "Queue", icon: <QueueIcon /> },
];
