import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import AdminLayout from "../components/AdminLayout";
import { adminLinks } from "../config/navLinks";
import "./Grades.css";
import "./TeacherPortal.css";

export default function TeacherManagement() {
  const { token, logout } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [username, setUsername] = useState("teacher1");
  const [password, setPassword] = useState("teach123");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const loadTeachers = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/teachers.php`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTeachers(response.data.teachers || []);
    } catch (error) {
      if (error.response?.status === 401) logout();
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Teacher accounts could not be loaded.",
      });
    } finally {
      setLoading(false);
    }
  }, [token, logout]);

  useEffect(() => {
    const loadId = window.setTimeout(loadTeachers, 0);
    return () => window.clearTimeout(loadId);
  }, [loadTeachers]);

  const createTeacher = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/admin/teachers.php`,
        { username, password },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setMessage({ type: "info", text: response.data.message });
      setUsername("");
      setPassword("teach123");
      await loadTeachers();
    } catch (error) {
      if (error.response?.status === 401) logout();
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Teacher account could not be created.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout links={adminLinks}>
      <div className="grades-page">
        <h1>Create Teacher Account</h1>
        <p>
          Create a teacher login. The initial password defaults to teach123,
          can be changed here, and can be updated by the teacher from their dashboard.
        </p>
        {message && (
          <div className={`grades-alert grades-alert-${message.type}`}>
            {message.text}
          </div>
        )}
        <form className="teacher-account-form" onSubmit={createTeacher}>
          <label>
            Username
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              minLength={3}
              maxLength={40}
              required
            />
          </label>
          <label>
            Initial password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              maxLength={255}
              required
            />
          </label>
          <button className="grades-btn grades-btn-primary" disabled={saving}>
            {saving ? "Creating..." : "Create Teacher"}
          </button>
        </form>

        <h2>Teacher Accounts</h2>
        {loading ? (
          <p>Loading teacher accounts...</p>
        ) : teachers.length === 0 ? (
          <p>No teacher accounts have been created.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Advisory Rooms</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher) => (
                <tr key={teacher.id_admin}>
                  <td>{teacher.username_admin}</td>
                  <td>{teacher.advisory_rooms || "Not assigned"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
