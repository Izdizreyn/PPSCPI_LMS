import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config/api";
import StudentSidebar from "../components/StudentSidebar";
import "./StudentDashboard.css";

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [studentInfo, setStudentInfo] = useState(null);
  const [queueInfo, setQueueInfo] = useState(null);
  const [balanceInfo, setBalanceInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        // Fetch queue info using LRN
        if (user?.lrn) {
          const queueRes = await axios.get(
            `${API_BASE_URL}/students/queue-info.php?lrn=${user.lrn}`
          );
          if (queueRes.data.success) {
            setQueueInfo(queueRes.data.data);
          }

          // Fetch balance info
          const balanceRes = await axios.get(
            `${API_BASE_URL}/students/balance-info.php?lrn=${user.lrn}`
          );
          if (balanceRes.data.success) {
            setBalanceInfo(balanceRes.data.data);
          }
        }

        setStudentInfo(user);
      } catch (err) {
        console.error("Error fetching student data:", err);
        setError("Failed to load student information");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchStudentData();
    }
  }, [user]);

  const handleEditProfile = () => {
    navigate("/student/edit-profile");
  };

  const handleRequestCertificate = () => {
    navigate("/request-certificate");
  };

  const handleViewBalance = () => {
    navigate(`/admin/print-balance?lrn=${user?.lrn}`);
  };

  if (loading) {
    return <div className="student-dashboard loading">Loading...</div>;
  }

  return (
    <div className="student-dashboard">
      <StudentSidebar />
      <div className="student-content">
        <div className="dashboard-grid">
          {/* Welcome Card */}
          <div className="card welcome-card">
            <h2>Welcome, {studentInfo?.full_name || "Student"}!</h2>
            <p>LRN: <strong>{studentInfo?.lrn}</strong></p>
            <p>Email: <strong>{studentInfo?.email}</strong></p>
          </div>

          {/* Queue Status Card */}
          {queueInfo && (
            <div className="card queue-card">
              <h3>Queue Status</h3>
              <div className="queue-details">
                <p>
                  <span className="label">Queue Number:</span>
                  <span className="value">{queueInfo.queue_number}</span>
                </p>
                <p>
                  <span className="label">Status:</span>
                  <span className={`status ${queueInfo.status?.toLowerCase()}`}>
                    {queueInfo.status}
                  </span>
                </p>
                <p>
                  <span className="label">Enrollment Date:</span>
                  <span className="value">
                    {new Date(queueInfo.enrollment_date).toLocaleDateString()}
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Balance Card */}
          {balanceInfo && (
            <div className="card balance-card">
              <h3>Account Balance</h3>
              <div className="balance-details">
                <p>
                  <span className="label">Total Balance:</span>
                  <span className="value">
                    ₱{parseFloat(balanceInfo.total_balance).toFixed(2)}
                  </span>
                </p>
                {balanceInfo.remaining_balance !== undefined && (
                  <p>
                    <span className="label">Remaining:</span>
                    <span className="value">
                      ₱{parseFloat(balanceInfo.remaining_balance).toFixed(2)}
                    </span>
                  </p>
                )}
                <button onClick={handleViewBalance} className="btn-secondary">
                  View Detailed Statement
                </button>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="card actions-card">
            <h3>Quick Actions</h3>
            <div className="action-buttons">
              <button onClick={handleEditProfile} className="btn-primary">
                📝 Edit Profile
              </button>
              <button onClick={handleRequestCertificate} className="btn-primary">
                📄 Request Certificate
              </button>
              <button onClick={() => navigate("/student/upload-files")} className="btn-primary">
                📤 Upload Files
              </button>
            </div>
          </div>

          {/* Information Card */}
          <div className="card info-card">
            <h3>Important Information</h3>
            <ul>
              <li>Use your registered email to log in to your account</li>
              <li>Change your default password after first login</li>
              <li>Keep your personal information up to date</li>
              <li>Contact administration for account-related concerns</li>
            </ul>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
}
