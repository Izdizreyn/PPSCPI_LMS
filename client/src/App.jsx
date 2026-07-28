import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Etype from "./pages/Etype";
import OldStudent from "./pages/OldStudent";
import NewStudent from "./pages/NewStudent";
import Transferee from "./pages/Transferee";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import Cashier from "./pages/Cashier";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/enroll" element={<Etype />} />
        <Route path="/enroll/old" element={<OldStudent />} />
        <Route path="/enroll/new" element={<NewStudent />} />
        <Route path="/enroll/transferee" element={<Transferee />} />
        <Route path="/admin-login" element={<AdminLogin />} />

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
      </Routes>
    </BrowserRouter>
  );
}

export default App;