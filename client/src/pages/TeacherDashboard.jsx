import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import AdminLayout from "../components/AdminLayout";
import { teacherLinks } from "../config/navLinks";
import "./Grades.css";
import "./TeacherPortal.css";

export default function TeacherDashboard() {
  const { token, user, logout } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [roomIds, setRoomIds] = useState([]);
  const [gradeSummary, setGradeSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingRooms, setSavingRooms] = useState(false);
  const [message, setMessage] = useState(null);

  const loadRooms = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/teacher/rooms.php`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRooms(response.data.rooms || []);
      const assignedIds = (response.data.room_ids || []).map(Number);
      setRoomIds(assignedIds);
      if (assignedIds.length > 0) {
        try {
          const rosterResponse = await axios.get(
            `${API_BASE_URL}/admin/grade-roster.php`,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          const summary = {};
          rosterResponse.data.students.forEach((student) => {
            Object.values(student.quarters).forEach((status) => {
              if (status !== "Empty" && status !== "Mixed") {
                summary[status] = (summary[status] || 0) + 1;
              }
            });
          });
          setGradeSummary(summary);
        } catch (error) {
          if (error.response?.status === 401) logout();
          setMessage({
            type: "error",
            text: error.response?.data?.message || "Grade validation statuses could not be loaded.",
          });
        }
      } else {
        setGradeSummary({});
      }
    } catch (error) {
      if (error.response?.status === 401) logout();
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Advisory rooms could not be loaded.",
      });
    } finally {
      setLoading(false);
    }
  }, [token, logout]);

  useEffect(() => {
    const loadId = window.setTimeout(loadRooms, 0);
    return () => window.clearTimeout(loadId);
  }, [loadRooms]);

  const toggleRoom = (roomId) => {
    setRoomIds((current) =>
      current.includes(roomId)
        ? current.filter((id) => id !== roomId)
        : [...current, roomId],
    );
  };

  const saveRooms = async (event) => {
    event.preventDefault();
    setSavingRooms(true);
    setMessage(null);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/teacher/rooms.php`,
        { room_ids: roomIds },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setMessage({ type: "info", text: response.data.message });
      await loadRooms();
    } catch (error) {
      if (error.response?.status === 401) logout();
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Advisory rooms could not be saved.",
      });
      await loadRooms();
    } finally {
      setSavingRooms(false);
    }
  };

  const assignedRooms = rooms.filter((room) =>
    roomIds.includes(Number(room.id)),
  );
  return (
    <AdminLayout links={teacherLinks}>
      <div className="grades-page teacher-dashboard">
        <h1>Teacher Dashboard</h1>
        <p>Welcome, {user?.username || "Teacher"}.</p>
        {message && (
          <div className={`grades-alert grades-alert-${message.type}`} role="status">
            {message.text}
          </div>
        )}

        <div className="teacher-dashboard-actions">
          <Link className="grades-btn grades-btn-primary" to="/teacher/my-classes">
            Update Student Grades
          </Link>
          <Link className="grades-btn grades-btn-success" to="/teacher/chat">
            Room Chat
          </Link>
        </div>
        <p className="teacher-dashboard-note">Submitted grades go to the admin for validation before students can view them.</p>
        <section className="teacher-grade-summary" aria-label="Grade validation status">
          <h2>Grade Validation Status</h2>
          <div className="teacher-grade-statuses">
            {["Submitted", "Returned", "Validated", "Released"].map((status) => (
              <div className={`teacher-grade-status teacher-grade-status-${status.toLowerCase()}`} key={status}>
                <span>{status}</span>
                <strong>{gradeSummary[status] || 0}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="teacher-advisory-section">
          <h2>Advisory Rooms</h2>
          {loading ? <p>Loading rooms...</p> : rooms.length === 0 ? (
            <p>No unassigned rooms are available.</p>
          ) : (
            <form onSubmit={saveRooms}>
              <details className="teacher-room-dropdown">
                <summary>Select advisory rooms</summary>
                <div className="teacher-room-options">
                  {rooms.map((room) => {
                    const roomId = Number(room.id);
                    return (
                      <label key={room.id}>
                        <input
                          type="checkbox"
                          checked={roomIds.includes(roomId)}
                          onChange={() => toggleRoom(roomId)}
                        />
                        <span>
                          {room.room_name} · {room.level} · Grade {room.year_level}
                          {room.assigned_to_self ? " (assigned to you)" : ""}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </details>
              <div className="teacher-current-advisory">
                <strong>Current advisory</strong>
                {assignedRooms.length ? (
                  <ul>
                    {assignedRooms.map((room) => (
                      <li key={room.id}>
                        {room.room_name} · {room.level} · Grade {room.year_level}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No advisory rooms assigned.</p>
                )}
              </div>
            <button className="grades-btn grades-btn-primary" disabled={savingRooms}>
              {savingRooms ? "Saving..." : "Save Advisory Rooms"}
            </button>
            </form>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
