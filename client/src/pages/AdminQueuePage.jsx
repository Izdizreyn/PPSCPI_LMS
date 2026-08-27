import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import AdminLayout from "../components/AdminLayout";
import "./AdminQueuePage.css";
import { adminLinks } from "../config/navLinks";

export default function AdminQueuePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [queue, setQueue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboardQueue, setDashboardQueue] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");
  const { token, logout } = useAuth();

  const type = searchParams.get("type");
  const id = searchParams.get("id");

  const loadDashboard = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/queue-dashboard.php`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDashboardQueue(res.data.queue || []);
      setDashboardError("");
    } catch (err) {
      if (err.response?.status === 401) logout();
      setDashboardError("Queue data could not be loaded.");
    } finally {
      setDashboardLoading(false);
    }
  }, [logout, token]);

  useEffect(() => {
    if (!type || !id) {
      const initialRefreshId = window.setTimeout(loadDashboard, 0);
      const intervalId = window.setInterval(loadDashboard, 10000);
      return () => {
        window.clearTimeout(initialRefreshId);
        window.clearInterval(intervalId);
      };
    }

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
  }, [loadDashboard, type, id]);

  if (!type || !id) {
    const activeCount = dashboardQueue.filter((item) => item.status !== "Used").length;
    const usedCount = dashboardQueue.length - activeCount;

    return (
      <AdminLayout links={adminLinks}>
        <div className="admin-queue dashboard-queue">
          <div className="queue-dashboard-card">
            <div>
              <h1>Live Queue Dashboard</h1>
            </div>

            <div className="queue-stats" aria-label="Queue summary">
            <div><strong>{dashboardQueue.length}</strong><span>Total queued</span></div>
            <div><strong>{activeCount}</strong><span>Active</span></div>
            <div><strong>{usedCount}</strong><span>Used</span></div>
          </div>

          {dashboardError ? <p className="queue-error">{dashboardError}</p> : null}
          {dashboardLoading && dashboardQueue.length === 0 ? (
            <p className="queue-empty">Loading queue...</p>
          ) : dashboardQueue.length === 0 ? (
            <p className="queue-empty">No approved students are currently in the queue.</p>
          ) : (
              <div className="queue-table-wrap">
              <table className="queue-dashboard-table">
                <thead>
                  <tr><th>Queue</th><th>Student</th><th>Type</th><th>Level</th><th>Joined</th><th>Status</th><th /></tr>
                </thead>
                <tbody>
                  {dashboardQueue.map((item) => (
                    <tr key={`${item.student_type}-${item.student_id}`}>
                      <td className="queue-code">{item.queue_number}</td>
                      <td><strong>{item.enrollee_name}</strong><small>{item.lrn}</small></td>
                      <td>{item.student_type}</td>
                      <td>{item.year_level || "N/A"}<small>{item.strand || "N/A"}</small></td>
                      <td>{new Date(item.enrollment_date).toLocaleString()}</td>
                      <td>
                        <span className={`queue-status ${item.status === "Used" ? "settled" : "active"}`}>
                          {item.status === "Used" ? "USED" : "ACTIVE"}
                        </span>
                        {item.status === "Used" && <small className="queue-recommendation">Request another queue number for your next payment.</small>}
                      </td>
                      <td><button className="queue-view-btn" onClick={() => navigate(`/admin/queue?type=${item.student_type}&id=${item.student_id}`)}>View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          </div>
        </div>
      </AdminLayout>
    );
  }

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
              <button className="print-btn" onClick={() => window.print()}>
                Print Queue
              </button>
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
                    <tr>
                      <td>Status:</td>
                      <td>
                        <span
                          style={{
                            color: queue.status === "Used" ? "green" : "orange",
                            fontWeight: "bold",
                          }}
                        >
                          {queue.status === "Used"
                            ? "USED — Payment Complete"
                            : "ACTIVE"}
                        </span>
                        {queue.status === "Used" && (
                          <small className="queue-recommendation">Request another queue number for your next payment.</small>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            {queue.queue_history?.length > 0 && (
              <div className="queue-history">
                <h3>Queue Number History</h3>
                <table>
                  <thead>
                    <tr><th>Queue Number</th><th>Date</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {queue.queue_history.map((historyItem) => (
                      <tr key={historyItem.queue_number}>
                        <td>{historyItem.queue_number}</td>
                        <td>{new Date(historyItem.enrollment_date).toLocaleDateString()}</td>
                        <td>{historyItem.status === "Settled" || historyItem.status === "Used" ? "USED" : "ACTIVE"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
