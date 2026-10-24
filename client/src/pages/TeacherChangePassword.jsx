import { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import AdminLayout from "../components/AdminLayout";
import { teacherLinks } from "../config/navLinks";
import "./Grades.css";
import "./TeacherPortal.css";

export default function TeacherChangePassword() {
  const { token, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const changePassword = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/teacher/change-password.php`,
        { current_password: currentPassword, new_password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setCurrentPassword("");
      setNewPassword("");
      setMessage({ type: "info", text: response.data.message });
    } catch (error) {
      if (error.response?.status === 401) logout();
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Password could not be updated.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout links={teacherLinks}>
      <main className="grades-page teacher-password-page">
        <h1>Change Password</h1>
        {message && (
          <div className={`grades-alert grades-alert-${message.type}`} role="status">
            {message.text}
          </div>
        )}
        <form className="teacher-password-form" onSubmit={changePassword}>
          <label>
            Current password
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          <label>
            New password
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              maxLength={255}
              required
            />
          </label>
          <button className="grades-btn grades-btn-primary" disabled={saving}>
            {saving ? "Updating..." : "Update Password"}
          </button>
        </form>
      </main>
    </AdminLayout>
  );
}
