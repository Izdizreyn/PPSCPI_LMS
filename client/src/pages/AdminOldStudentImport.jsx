import { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import AdminLayout from "../components/AdminLayout";
import "./AdminOldStudentImport.css";
import { adminLinks } from "../config/navLinks";

const BLANK_FORM = {
  lrn: "",
  fname: "",
  mname: "",
  lname: "",
  extname: "",
  birthday: "",
  gender: "",
  phone: "",
  email: "",
  prim_add: "",
  sec_add: "",
  zip_code: "",
  parent_name: "",
  parent_phone: "",
  parent_rel: "",
  parent_add: "",
  last_year_level: "",
  last_strand: "",
};

export default function AdminOldStudentImport() {
  const { token } = useAuth();
  const [formData, setFormData] = useState(BLANK_FORM);
  const [sameAsPrimary, setSameAsPrimary] = useState(false);
  const [message, setMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePrimaryAddressChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      prim_add: value,
      sec_add: sameAsPrimary ? value : prev.sec_add,
    }));
  };

  const handleSameAsPrimary = (checked) => {
    setSameAsPrimary(checked);
    if (checked) {
      setFormData((prev) => ({ ...prev, sec_add: prev.prim_add }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/admin/import-old-student.php`,
        formData,
        authHeaders,
      );
      setMessage({ type: "success", text: res.data.message });
      setFormData(BLANK_FORM);
      setSameAsPrimary(false);
    } catch (err) {
      setMessage({
        type: "danger",
        text: err.response?.data?.message || "Failed to save record.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout links={adminLinks}>
      <div className="admin-old-import">
        <h1>Add Historical Student Record</h1>
        <p className="admin-old-import-hint">
          Use this to seed records for students who already attended in a
          prior year. Once saved here, they can search by LRN + birthday on
          the Old Student pre-enrollment form and their details will
          auto-fill.
        </p>

        {message && (
          <div className={`alert alert-${message.type}`}>{message.text}</div>
        )}

        <form onSubmit={handleSubmit}>
          <h3>Student Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label>LRN:</label>
              <input
                type="text"
                name="lrn"
                value={formData.lrn}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Last Year Level Attended:</label>
              <select
                name="last_year_level"
                value={formData.last_year_level}
                onChange={handleChange}
                required
              >
                <option value="">-- Select --</option>
                <option value="Nursery">Nursery</option>
                <option value="Kinder">Kinder</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                  <option key={g} value={g}>
                    Grade {g}
                  </option>
                ))}
              </select>
            </div>
            {parseInt(formData.last_year_level, 10) >= 11 && (
              <div className="form-group">
                <label>Last Strand:</label>
                <select
                  name="last_strand"
                  value={formData.last_strand}
                  onChange={handleChange}
                >
                  <option value="">-- Select --</option>
                  <option value="STEM">STEM</option>
                  <option value="ABM">ABM</option>
                  <option value="HUMSS">HUMSS</option>
                </select>
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>First Name:</label>
              <input
                type="text"
                name="fname"
                value={formData.fname}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Middle Name (Optional):</label>
              <input
                type="text"
                name="mname"
                value={formData.mname}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Last Name:</label>
              <input
                type="text"
                name="lname"
                value={formData.lname}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Extension Name (Optional):</label>
              <input
                type="text"
                name="extname"
                value={formData.extname}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Birth Date:</label>
              <input
                type="date"
                name="birthday"
                value={formData.birthday}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Gender:</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="">-- Select --</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
            <div className="form-group">
              <label>Phone Number:</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Email Address:</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <h3>Address</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Primary Address:</label>
              <input
                type="text"
                name="prim_add"
                value={formData.prim_add}
                onChange={handlePrimaryAddressChange}
              />
            </div>
            <div className="form-group">
              <label>Secondary Address:</label>
              <input
                type="text"
                name="sec_add"
                value={formData.sec_add}
                onChange={handleChange}
                readOnly={sameAsPrimary}
              />
              <label className="same-address-option">
                <input
                  type="checkbox"
                  checked={sameAsPrimary}
                  onChange={(e) => handleSameAsPrimary(e.target.checked)}
                />
                <span>Same as primary address</span>
              </label>
            </div>
            <div className="form-group">
              <label>Zip Code:</label>
              <input
                type="text"
                name="zip_code"
                value={formData.zip_code}
                onChange={handleChange}
              />
            </div>
          </div>

          <h3>Parent or Guardian Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Parent/Guardian Name:</label>
              <input
                type="text"
                name="parent_name"
                value={formData.parent_name}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Phone Number:</label>
              <input
                type="tel"
                name="parent_phone"
                value={formData.parent_phone}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Relationship to Student:</label>
              <input
                type="text"
                name="parent_rel"
                value={formData.parent_rel}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Parent/Guardian Address:</label>
              <input
                type="text"
                name="parent_add"
                value={formData.parent_add}
                onChange={handleChange}
              />
            </div>
          </div>

          <button type="submit" className="btn" disabled={submitting}>
            {submitting ? "Saving..." : "Save Record"}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
}