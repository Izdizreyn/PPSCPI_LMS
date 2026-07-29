import { useState, useEffect } from "react";
import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import AdminLayout from "../components/AdminLayout";
import "./AdminQueuePage.css";

const adminLinks = [
  { to: "/admin/dashboard", label: "Dashboard", icon: "🏠" },
  { to: "/admin/students", label: "Students", icon: "👨‍🎓" },
  { to: "/admin/enrolled", label: "Enrolled", icon: "📚" },
  { to: "/admin/requests", label: "Requests", icon: "📩" },
];

export default function AdminQueuePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [queue, setQueue] = useState(null);
  const [loading, setLoading] = useState(true);

  const type = searchParams.get("type");
  const id = searchParams.get("id");

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/students/queue-info.php?type=${type}&id=${id}`,
        );
        setQueue(res.data.queue);
      } catch {
        setQueue(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [type, id]);

  return (
    <AdminLayout links={adminLinks}>
      <div className="admin-queue container">
        <button
          className="back-btn"
          onClick={() => navigate("/admin/students")}
        >
          Back to Student List
        </button>

        {loading ? (
          <p>Loading...</p>
        ) : queue ? (
          <>
            <div className="queue-card">
              <div className="queue-header">
                <h2>Queue Number</h2>
              </div>
              <div className="queue-number">{queue.queue_number}</div>
              <div className="queue-details">
                <table>
                  <tbody>
                    <tr>
                      <td>Student Name:</td>
                      <td>{queue.enrollee_name}</td>
                    </tr>
                    <tr>
                      <td>LRN:</td>
                      <td>{queue.lrn}</td>
                    </tr>
                    <tr>
                      <td>Student Type:</td>
                      <td>
                        {type.charAt(0).toUpperCase() + type.slice(1)} Student
                      </td>
                    </tr>
                    <tr>
                      <td>Year Level:</td>
                      <td>Grade {queue.year_level}</td>
                    </tr>
                    <tr>
                      <td>Strand:</td>
                      <td>{queue.strand}</td>
                    </tr>
                    <tr>
                      <td>Enrollment Date:</td>
                      <td>
                        {new Date(queue.enrollment_date).toLocaleDateString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <button className="print-btn" onClick={() => window.print()}>
              Print Queue
            </button>
          </>
        ) : (
          <div className="no-queue">
            <h2>No Queue Information Found</h2>
            <p>
              There is no queue information available for this student. The
              student may not have been approved yet.
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
