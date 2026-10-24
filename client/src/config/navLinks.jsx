import {
  DashboardIcon,
  StudentsIcon,
  EnrolledIcon,
  RequestsIcon,
  QueueIcon,
  CashierIcon,
  GradesIcon,
  GradeCheckIcon,
  PasswordIcon,
} from "../components/AdminIcons";

export const adminLinks = [
  { to: "/admin/dashboard", label: "Dashboard", icon: <DashboardIcon /> },
  { to: "/admin/applicants", label: "Applicants", icon: <StudentsIcon /> },
  { to: "/admin/students", label: "Students", icon: <StudentsIcon /> },
  { to: "/admin/queue", label: "Queue", icon: <QueueIcon /> },
  { to: "/admin/enrolled", label: "Enrolled", icon: <EnrolledIcon /> },
  { to: "/admin/requests", label: "Requests", icon: <RequestsIcon /> },
  { to: "/admin/import-old-student", label: "Import Old Student Records", icon: <StudentsIcon /> },
  { to: "/admin/grades", label: "Grade Validation", icon: <GradeCheckIcon /> },
  { to: "/admin/chat", label: "Student Chat", icon: <RequestsIcon /> },
];

export const teacherLinks = [
  { to: "/teacher/dashboard", label: "Dashboard", icon: <DashboardIcon /> },
  { to: "/teacher/my-classes", label: "Update Student Grades", icon: <GradesIcon /> },
  { to: "/teacher/chat", label: "Room Chat", icon: <RequestsIcon /> },
  { to: "/teacher/change-password", label: "Change Password", icon: <PasswordIcon /> },
];

export const cashierLinks = [
  { to: "/cashier", label: "Dashboard", icon: <DashboardIcon /> },
  { to: "/cashier/search", label: "Student Search", icon: <CashierIcon /> },
  { to: "/cashier/queue", label: "Queue", icon: <QueueIcon /> },
];