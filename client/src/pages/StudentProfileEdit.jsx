import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import StudentSidebar from "../components/StudentSidebar";
import "./StudentDashboard.css";
import "./StudentProfileEdit.css";

const initialProfile = {
  first_name: "",
  middle_name: "",
  last_name: "",
  extension_name: "",
  birthday: "",
  age: "",
  gender: "",
  phone: "",
  email: "",
  primary_address: "",
  secondary_address: "",
  zip_code: "",
  parent_name: "",
  parent_phone: "",
  parent_relationship: "",
  parent_address: "",
};

const fields = [
  ["first_name", "First Name", "text", true],
  ["middle_name", "Middle Name", "text", false],
  ["last_name", "Last Name", "text", true],
  ["extension_name", "Extension Name", "text", false],
  ["birthday", "Birth Date", "date", true],
  ["age", "Age", "number", true],
  ["gender", "Gender", "select", true],
  ["phone", "Phone Number", "tel", true],
  ["email", "Email Address", "email", true],
  ["primary_address", "Primary Address", "text", true],
  ["secondary_address", "Secondary Address", "text", false],
  ["zip_code", "Zip Code", "text", false],
  ["parent_name", "Parent or Guardian Name", "text", false],
  ["parent_phone", "Parent or Guardian Phone", "tel", false],
  ["parent_relationship", "Relationship to Student", "text", false],
  ["parent_address", "Parent or Guardian Address", "text", false],
];

export default function StudentProfileEdit() {
  const { token, logout, user, login } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(initialProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadProfile = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/students/my-profile.php`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile({ ...initialProfile, ...response.data.profile });
    } catch (err) {
      if (err.response?.status === 401) logout();
      setError(
        err.response?.data?.message || "Your profile could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, [token, logout]);

  useEffect(() => {
    const loadId = window.setTimeout(loadProfile, 0);
    return () => window.clearTimeout(loadId);
  }, [loadProfile]);

  const updateField = (event) => {
    const { name, value } = event.target;
    setProfile((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/students/update-profile.php`,
        profile,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const updatedProfile = { ...profile, ...response.data.profile };
      setProfile(updatedProfile);
      login(token, {
        ...user,
        full_name: updatedProfile.full_name,
        email: updatedProfile.email,
      });
      setMessage(response.data.message);
    } catch (err) {
      if (err.response?.status === 401) logout();
      setError(
        err.response?.data?.message ||
          "Profile changes could not be saved. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="student-dashboard">
      <StudentSidebar />
      <main className="student-content student-profile-edit-page">
        <h1>Edit Profile</h1>
        <p>Update your personal, contact, address, and guardian information.</p>
        {error && <div className="student-profile-alert error">{error}</div>}
        {message && <div className="student-profile-alert success">{message}</div>}
        {loading ? (
          <section className="card"><p>Loading profile...</p></section>
        ) : (
          <form className="card student-profile-edit-form" onSubmit={handleSubmit}>
            {fields.map(([name, label, type, required]) => (
              <div className="student-profile-edit-field" key={name}>
                <label htmlFor={`profile-${name}`}>{label}</label>
                {type === "select" ? (
                  <select
                    id={`profile-${name}`}
                    name={name}
                    value={profile[name] || ""}
                    onChange={updateField}
                    required={required}
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                ) : (
                  <input
                    id={`profile-${name}`}
                    name={name}
                    type={type}
                    value={profile[name] || ""}
                    onChange={updateField}
                    required={required}
                    min={type === "number" ? "0" : undefined}
                    max={type === "number" ? "120" : undefined}
                    pattern={type === "tel" ? "09[0-9]{9}" : undefined}
                    maxLength={type === "tel" ? 11 : undefined}
                    placeholder={type === "tel" ? "09XXXXXXXXX" : undefined}
                  />
                )}
              </div>
            ))}
            <div className="student-profile-edit-actions">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Save Profile"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigate("/student/dashboard")}
              >
                Back to Dashboard
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
