import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import StudentSidebar from "../components/StudentSidebar";
import "./StudentDashboard.css";
import "./Grades.css";

export default function StudentGrades() {
  const { token, logout } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [schoolYear, setSchoolYear] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/students/my-grades.php`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSubjects(res.data.subjects);
        setSchoolYear(res.data.school_year);
      } catch (err) {
        if (err.response?.status === 401) logout();
        setError("Grades could not be loaded.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token, logout]);

  return (
    <div className="student-dashboard">
      <StudentSidebar />
      <div className="student-content">
        <div className="grades-page">
          <h1>My Grades {schoolYear && `(${schoolYear})`}</h1>
          {error && <div className="grades-alert grades-alert-error">{error}</div>}
          {loading ? (
            <p>Loading...</p>
          ) : subjects.length === 0 ? (
            <p>No released grades yet.</p>
          ) : (
            <table>
              <thead>
                <tr><th>Subject</th><th>Q1</th><th>Q2</th><th>Q3</th><th>Q4</th><th>Final</th></tr>
              </thead>
              <tbody>
                {subjects.map((s) => (
                  <tr key={s.subject}>
                    <td>{s.subject}</td>
                    {[1, 2, 3, 4].map((q) => (
                      <td key={q}>{s.quarters[q] ?? "—"}</td>
                    ))}
                    <td className="grades-final">{s.final ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
