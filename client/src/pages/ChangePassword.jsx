import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { API_BASE_URL } from "../config/api";
import "./ChangePassword.css";

export default function ChangePassword() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(
        `${API_BASE_URL}/auth/student-change-password.php`,
        {
          current_password: currentPassword,
          new_password: newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.data.success) {
        setSuccess("Password changed successfully!");
        setTimeout(() => {
          navigate("/student/dashboard");
        }, 1500);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to change password. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  return (
    <div className="change-password-container">
      <div className="change-password-card">
        <div className="card-header">
          <h2>Change Password</h2>
          <p>Update your account password</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit} className="password-form">
          <div className="form-group">
            <label htmlFor="current-password">Current Password</label>
            <div className="password-input-group">
              <input
                id="current-password"
                type={showPassword.current ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
              />
              <button
                type="button"
                className="toggle-btn"
                onClick={() => togglePasswordVisibility("current")}
              >
                {showPassword.current ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="new-password">New Password</label>
            <div className="password-input-group">
              <input
                id="new-password"
                type={showPassword.new ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
              />
              <button
                type="button"
                className="toggle-btn"
                onClick={() => togglePasswordVisibility("new")}
              >
                {showPassword.new ? "🙈" : "👁️"}
              </button>
            </div>
            <small>At least 6 characters</small>
          </div>

          <div className="form-group">
            <label htmlFor="confirm-password">Confirm New Password</label>
            <div className="password-input-group">
              <input
                id="confirm-password"
                type={showPassword.confirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
              />
              <button
                type="button"
                className="toggle-btn"
                onClick={() => togglePasswordVisibility("confirm")}
              >
                {showPassword.confirm ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? "Updating..." : "Update Password"}
            </button>
            <button
              type="button"
              className="btn-cancel"
              onClick={() => navigate("/student/dashboard")}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
