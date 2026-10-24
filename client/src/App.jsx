import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Etype from "./pages/Etype";
import OldStudent from "./pages/OldStudent";
import NewStudent from "./pages/NewStudent";
import Transferee from "./pages/Transferee";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import Cashier from "./pages/Cashier";
import CashierDashboard from "./pages/CashierDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import RequestDocument from "./pages/RequestDocument";
import ApprovedStudents from "./pages/ApprovedStudents";
import AdminQueuePage from "./pages/AdminQueuePage";
import EnrollStudentPage from "./pages/EnrollStudentPage";
import AdminRequests from "./pages/AdminRequests";
import EnrolledStudents from "./pages/EnrolledStudents";
import PrintDocumentRequest from "./pages/PrintDocumentRequest";
import PrintBalance from "./pages/PrintBalance";
import CashierQueuePage from "./pages/CashierQueuePage";
import StudentLogin from "./pages/StudentLogin";
import StudentDashboard from "./pages/StudentDashboard";
import ChangePassword from "./pages/ChangePassword";
import AdminOldStudentImport from "./pages/AdminOldStudentImport";
import StaffClasses from "./pages/StaffClasses";
import StaffGrades from "./pages/StaffGrades";
import AdminGradeReview from "./pages/AdminGradeReview";
import StudentGrades from "./pages/StudentGrades";
import StudentDocuments from "./pages/StudentDocuments";
import StudentProfileEdit from "./pages/StudentProfileEdit";
import ChatPortal from "./pages/ChatPortal";
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherChangePassword from "./pages/TeacherChangePassword";
import TeacherManagement from "./pages/TeacherManagement";
import PurpleBot from "./components/PurpleBot";

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
        <Route path="/student-login" element={<StudentLogin />} />
<Route path="/print-document" element={<PrintDocumentRequest />} />
<Route path="/request-document" element={<RequestDocument />} />
<Route path="/admin/print-balance" element={<PrintBalance />} />
        <Route
          path="/admin/import-old-student"
          element={<AdminOldStudentImport />}
        />

        {/* ── Student routes (all protected, only ONE dashboard route) ── */}
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRoles={["purple_student"]}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/change-password"
          element={
            <ProtectedRoute allowedRoles={["purple_student"]}>
              <ChangePassword />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/grades"
          element={
            <ProtectedRoute allowedRoles={["purple_student"]}>
              <StudentGrades />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/documents"
          element={
            <ProtectedRoute allowedRoles={["purple_student"]}>
              <StudentDocuments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/edit-profile"
          element={
            <ProtectedRoute allowedRoles={["purple_student"]}>
              <StudentProfileEdit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/chat"
          element={
            <ProtectedRoute allowedRoles={["purple_student"]}>
              <ChatPortal mode="student" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/dashboard"
          element={
            <ProtectedRoute allowedRoles={["purple_teacher"]}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/my-classes"
          element={
            <ProtectedRoute allowedRoles={["purple_teacher"]}>
              <StaffClasses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/my-grades"
          element={
            <ProtectedRoute allowedRoles={["purple_teacher"]}>
              <StaffGrades />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/chat"
          element={
            <ProtectedRoute allowedRoles={["purple_teacher"]}>
              <ChatPortal mode="teacher" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/change-password"
          element={
            <ProtectedRoute allowedRoles={["purple_teacher"]}>
              <TeacherChangePassword />
            </ProtectedRoute>
          }
        />

        {/* ── Admin / Cashier routes ── */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["purple_admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/applicants"
          element={
            <ProtectedRoute allowedRoles={["purple_admin"]}>
              <AdminDashboard showApplicants />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cashier"
          element={
            <ProtectedRoute allowedRoles={["purple_cashier"]}>
              <CashierDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cashier/search"
          element={
            <ProtectedRoute allowedRoles={["purple_cashier"]}>
              <Cashier />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cashier/queue"
          element={
            <ProtectedRoute allowedRoles={["purple_cashier"]}>
              <CashierQueuePage />
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
        <Route
          path="/admin/grades"
          element={
            <ProtectedRoute allowedRoles={["purple_admin"]}>
              <AdminGradeReview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/chat"
          element={
            <ProtectedRoute allowedRoles={["purple_admin"]}>
              <ChatPortal mode="admin" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/teachers"
          element={
            <ProtectedRoute allowedRoles={["purple_admin"]}>
              <TeacherManagement />
            </ProtectedRoute>
          }
        />
      </Routes>
      <PurpleBot />
    </BrowserRouter>
  );
}

export default App;