import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import CashierLayout from "../components/CashierLayout";
import { cashierLinks } from "../config/navLinks";
import "./AdminQueuePage.css";

export default function CashierQueuePage() {
  const { token, logout } = useAuth();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadQueue = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/cashier/queue-dashboard.php`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setQueue(response.data.queue || []);
      setError("");
    } catch (requestError) {
      if (requestError.response?.status === 401) logout();
      setError("Queue data could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [logout, token]);

  useEffect(() => {
    const initialRefreshId = window.setTimeout(loadQueue, 0);
    const intervalId = window.setInterval(loadQueue, 10000);
    return () => {
      window.clearTimeout(initialRefreshId);
      window.clearInterval(intervalId);
    };
  }, [loadQueue]);

  const activeCount = queue.filter((item) => item.status !== "Used").length;
  const usedCount = queue.length - activeCount;

  return (
    <CashierLayout links={cashierLinks}>
      <div className="admin-queue dashboard-queue">
        <div className="queue-dashboard-card">
          <div className="queue-dashboard-heading cashier-queue-heading">
            <h1>Queue Dashboard</h1>
          </div>

          <div className="queue-stats" aria-label="Queue summary">
          <div><strong>{queue.length}</strong><span>Total queued</span></div>
          <div><strong>{activeCount}</strong><span>Active</span></div>
          <div><strong>{usedCount}</strong><span>Used</span></div>
        </div>

        {error ? <p className="queue-error">{error}</p> : null}
        {loading && queue.length === 0 ? (
          <p className="queue-empty">Loading queue...</p>
        ) : queue.length === 0 ? (
          <p className="queue-empty">No students are currently in the queue.</p>
        ) : (
            <div className="queue-table-wrap">
            <table className="queue-dashboard-table">
              <thead>
                <tr><th>Queue</th><th>Student</th><th>Type</th><th>Level</th><th>Status</th></tr>
              </thead>
              <tbody>
                {queue.map((item) => (
                  <tr key={`${item.student_type}-${item.student_id}`}>
                    <td className="queue-code">{item.queue_number}</td>
                    <td><strong>{item.enrollee_name}</strong><small>{item.lrn}</small></td>
                    <td>{item.student_type}</td>
                    <td>{item.year_level || "N/A"}<small>{item.strand || "N/A"}</small></td>
                    <td>
                      <span className={`queue-status ${item.status === "Used" ? "settled" : "active"}`}>
                        {item.status === "Used" ? "USED" : "ACTIVE"}
                      </span>
                      {item.status === "Used" && <small className="queue-recommendation">Request another queue number for your next payment.</small>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </div>
      </div>
    </CashierLayout>
  );
}
