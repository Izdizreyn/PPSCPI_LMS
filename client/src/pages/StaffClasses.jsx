import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import AdminLayout from "../components/AdminLayout";
import { teacherLinks } from "../config/navLinks";
import "./Grades.css";
import "./TeacherPortal.css";

const YEAR_LEVEL_LABEL = (yl) => (/^\d+$/.test(yl) ? `Grade ${yl}` : yl);

export default function StaffClasses() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [schoolYear, setSchoolYear] = useState("");
  const [quarter, setQuarter] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/grade-roster.php`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStudents(res.data.students);
      setRooms(res.data.rooms || []);
      setSelectedRoomId((current) =>
        res.data.rooms?.some((room) => String(room.id) === current)
          ? current
          : String(res.data.rooms?.[0]?.id || ""),
      );
      setSchoolYear(res.data.school_year);
    } catch (err) {
      if (err.response?.status === 401) logout();
      setError("Students could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [token, logout]);

  useEffect(() => {
    const loadId = window.setTimeout(load, 0);
    return () => window.clearTimeout(loadId);
  }, [load]);

  const roomStudents = students.filter(
    (student) => String(student.room_id) === selectedRoomId,
  );

  return (
    <AdminLayout links={teacherLinks}>
      <div className="grades-page">
        <h1>Update Student Grades {schoolYear && `(${schoolYear})`}</h1>
        {error && <div className="grades-alert grades-alert-error">{error}</div>}

        <div className="grades-tabs">
          {[1, 2, 3, 4].map((q) => (
            <button key={q} className={quarter === q ? "active" : ""} onClick={() => setQuarter(q)}>
              Quarter {q}
            </button>
          ))}
        </div>

        {rooms.length > 0 && (
          <label className="grades-room-select">
            Advisory room
            <select
              value={selectedRoomId}
              onChange={(event) => setSelectedRoomId(event.target.value)}
            >
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.room_name} · {room.level} · Grade {room.year_level}
                </option>
              ))}
            </select>
          </label>
        )}

        {loading ? (
          <p>Loading...</p>
        ) : rooms.length === 0 ? (
          <p>No advisory rooms assigned. Select rooms from your dashboard first.</p>
        ) : roomStudents.length === 0 ? (
          <p>No enrolled students were found in this room.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>LRN</th>
                <th>Name</th>
                <th>Year Level</th>
                <th>Strand</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {roomStudents.map((student) => (
                <tr key={student.lrn}>
                  <td>{student.lrn}</td>
                  <td>{student.full_name}</td>
                  <td>{YEAR_LEVEL_LABEL(student.year_level)}</td>
                  <td>{student.strand || "—"}</td>
                  <td>
                    <span className={`grades-badge grades-badge-${student.quarters[quarter]}`}>
                      {student.quarters[quarter]}
                    </span>
                  </td>
                  <td>
                    <button
                      className="grades-btn grades-btn-primary grades-btn-sm"
                      onClick={() => navigate(`/teacher/my-grades?lrn=${encodeURIComponent(student.lrn)}&quarter=${quarter}`)}
                    >
                      {student.quarters[quarter] === "Empty" ? "Enter Grades" : "View"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
