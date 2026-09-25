import { useState, useEffect } from "react";
import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import AdminLayout from "../components/AdminLayout";
import "./EnrollStudentPage.css";
import { adminLinks } from "../config/navLinks";

export default function EnrollStudentPage() {
  const { token } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const lrn = searchParams.get("lrn") || "";
  const name = searchParams.get("name") || "";
  const year = searchParams.get("year") || "";
  const strand = searchParams.get("strand") || "";

  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [message, setMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
  (async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/admin/enroll.php?year=${year}&strand=${strand}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setRooms(res.data?.rooms || []);
    } catch (err) {
      console.error("Failed to load rooms:", err);
      setRooms([]);
    }
  })();
}, [year, strand, token]);

const handleSubmit = async (e) => {
  e.preventDefault();
  if (submitting) return; // hard guard against double-fire
  setMessage(null);
  setSubmitting(true);
  try {
    const res = await axios.post(
      `${API_BASE_URL}/admin/enroll.php`,
      { lrn, name, year, strand, room_id: selectedRoom },
      authHeaders,
    );

    setMessage({ type: "success", text: res.data.message });

    const smsNote = res.data.sms_sent
      ? "An SMS notification was sent to the student."
      : `SMS notification was not sent (${res.data.sms_message || "no reason given"}).`;

    window.alert(`${res.data.message}\n\n${smsNote}`);
  } catch (err) {
    setMessage({
      type: "danger",
      text: err.response?.data?.message || "Failed to enroll student.",
    });
  } finally {
    setSubmitting(false);
  }
};

  return (
    <AdminLayout links={adminLinks}>
      <div className="enroll-student">
        <h1>Enroll Student</h1>
        {message && (
          <div className={`alert alert-${message.type}`}>{message.text}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>LRN:</label>
            <input type="text" value={lrn} readOnly />
          </div>
          <div className="form-group">
            <label>Full Name:</label>
            <input type="text" value={name} readOnly />
          </div>
          <div className="form-group">
            <label>Year Level:</label>
            <input type="text" value={year} readOnly />
          </div>
          {strand && (
            <div className="form-group">
              <label>Strand:</label>
              <input type="text" value={strand} readOnly />
            </div>
          )}
          <div className="form-group">
            <label>Available Rooms:</label>
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              required
            >
              <option value="">Select a room</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.room_name} ({r.current_count}/{r.capacity} students)
                </option>
              ))}
            </select>
            <div className="room-info">
              Shows only rooms with available slots
            </div>
          </div>

          <button type="submit" className="btn" disabled={submitting}>
            {submitting ? "Enrolling..." : "Enroll Student"}
          </button>
        </form>

        <button
          className="back-btn"
          onClick={() => navigate("/admin/students")}
        >
          Back to Students
        </button>
      </div>
    </AdminLayout>
  );
}
