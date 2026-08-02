import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Etype from "./pages/Etype";
import OldStudent from "./pages/OldStudent";
import NewStudent from "./pages/NewStudent";
import Transferee from "./pages/Transferee";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import Cashier from "./pages/Cashier";
import ProtectedRoute from "./components/ProtectedRoute";
import ProfileSearch from "./pages/ProfileSearch";
import ApprovedStudents from "./pages/ApprovedStudents";
import AdminQueuePage from "./pages/AdminQueuePage";
import EnrollStudentPage from "./pages/EnrollStudentPage";
import RequestCertificate from "./pages/RequestCertificate";
import AdminRequests from "./pages/AdminRequests";
import EnrolledStudents from "./pages/EnrolledStudents";
import PrintCertificate from "./pages/PrintCertificate";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/enroll" element={<Etype />} />
        <Route path="/enroll/old" element={<OldStudent />} />
        <Route path="/enroll/new" element={<NewStudent />} />
        <Route path="/enroll/transferee" element={<Transferee />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/profile-search" element={<ProfileSearch />} />
        <Route path="/request-certificate" element={<RequestCertificate />} />
        <Route path="/print-certificate" element={<PrintCertificate />} />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["purple_admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cashier"
          element={
            <ProtectedRoute allowedRoles={["purple_cashier"]}>
              <Cashier />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/students"
          element={
            <ProtectedRoute allowedRoles={["purple_admin"]}>
              <ApprovedStudents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/queue"
          element={
            <ProtectedRoute allowedRoles={["purple_admin"]}>
              <AdminQueuePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/enroll"
          element={
            <ProtectedRoute allowedRoles={["purple_admin"]}>
              <EnrollStudentPage />
            </ProtectedRoute>
          }
        />

        <Route
  path="/admin/requests"
  element={
    <ProtectedRoute allowedRoles={["purple_admin"]}>
      <AdminRequests />
    </ProtectedRoute>
  }
/>
<Route
  path="/admin/enrolled"
  element={
    <ProtectedRoute allowedRoles={["purple_admin"]}>
      <EnrolledStudents />
    </ProtectedRoute>
  }
/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
