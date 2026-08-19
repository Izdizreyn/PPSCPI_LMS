import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import AdminLayout from "../components/AdminLayout";
import "./AdminRequests.css";
import { Link } from "react-router-dom";
import { adminLinks } from "../config/navLinks";

export default function AdminRequests() {
  const { token } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const loadRequests = async () => {
    setLoading(true);
    const res = await axios.get(
      `${API_BASE_URL}/admin/certificate-requests.php`,
      authHeaders,
    );
    setRequests(res.data.requests);
    setLoading(false);
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const updateStatus = async (id, action) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/admin/certificate-requests-update.php`,
        { id, action },
        authHeaders,
      );
      setMessage(res.data.message);
      loadRequests();
    } catch (err) {
      setMessage(err.response?.data?.message || "Error updating request.");
    }
  };

  if (loading) {
    return (
      <AdminLayout links={adminLinks}>
        <p>Loading...</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout links={adminLinks}>
      <div className="admin-requests">
        <h1>Certificate of Enrollment Requests</h1>

        {message && <div className="alert">{message}</div>}

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Student Name</th>
              <th>LRN</th>
              <th>Year/Level</th>
              <th>Strand</th>
              <th>Room</th>
              <th>Purpose</th>
              <th>Request Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.length > 0 ? (
              requests.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.full_name}</td>
                  <td>{r.lrn}</td>
                  <td>
                    {r.year_level} - {r.level}
                  </td>
                  <td>{r.strand}</td>
                  <td>{r.room}</td>
                  <td>{r.purpose}</td>
                  <td>{new Date(r.request_date).toLocaleString()}</td>
                  <td>
                    <span
                      className={`status-badge status-${r.status.toLowerCase()}`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td>
                    {r.status === "Pending" && (
                      <>
                        <button
                          className="button button-success"
                          onClick={() => updateStatus(r.id, "approve")}
                        >
                          Approve
                        </button>
                        <button
                          className="button button-danger"
                          onClick={() => updateStatus(r.id, "reject")}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {r.status === "Approved" && (
                      <Link
                        to={`/print-certificate?id=${r.id}`}
                        target="_blank"
                        className="button button-primary"
                      >
                        Print
                      </Link>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="10" style={{ textAlign: "center" }}>
                  No certificate requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
