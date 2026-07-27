import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "./OldStudent.css";
import { API_BASE_URL } from "../config/api";

export default function OldStudent() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    lrn_old: "",
    yr_lvl_old: "",
    strand_old: "",
    fname_old: "",
    mname_old: "",
    lname_old: "",
    extname_old: "",
    birthday_old: "",
    age_old: "",
    gender_old: "",
    phone_old: "",
    email_old: "",
    prim_add_old: "",
    sec_add_old: "",
    zip_code_old: "",
    parent_name_old: "",
    parent_phone_old: "",
    parent_rel_old: "",
    parent_add_old: "",
  });

  const [idPic, setIdPic] = useState(null);
  const [sameAsPrimary, setSameAsPrimary] = useState({
    sec: false,
    parent: false,
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBirthdayChange = (e) => {
    const birthday = e.target.value;
    let age = "";
    if (birthday) {
      const birthdate = new Date(birthday);
      const today = new Date();
      age = today.getFullYear() - birthdate.getFullYear();
      const monthDiff = today.getMonth() - birthdate.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthdate.getDate())
      ) {
        age--;
      }
    }
    setFormData((prev) => ({ ...prev, birthday_old: birthday, age_old: age }));
  };

  const handleYearLevelChange = (e) => {
    const yr_lvl_old = e.target.value;
    const yearNum = parseInt(yr_lvl_old, 10) || 0;
    setFormData((prev) => ({
      ...prev,
      yr_lvl_old,
      strand_old: yearNum >= 11 ? prev.strand_old : "",
    }));
  };

  const handleSameAsPrimary = (field, checked) => {
    setSameAsPrimary((prev) => ({ ...prev, [field]: checked }));
    if (checked) {
      const targetField = field === "sec" ? "sec_add_old" : "parent_add_old";
      setFormData((prev) => ({ ...prev, [targetField]: prev.prim_add_old }));
    }
  };

  const handlePrimaryAddressChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      prim_add_old: value,
      sec_add_old: sameAsPrimary.sec ? value : prev.sec_add_old,
      parent_add_old: sameAsPrimary.parent ? value : prev.parent_add_old,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!idPic) {
      setError("Please upload a 2x2 ID photo.");
      return;
    }

    setSubmitting(true);

    const payload = new FormData();
    Object.entries(formData).forEach(([key, value]) =>
      payload.append(key, value),
    );
    payload.append("id_pic_old", idPic);

    try {
      const res = await axios.post(
        `${API_BASE_URL}/students/old.php`,
        payload,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      if (res.data.success) {
        alert(res.data.message);
        navigate("/");
      }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container">
        <h2>Pre-Enrollment Form for Old Student</h2>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <h3>Student Information</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Learner Reference Number (LRN):</label>
              <input
                type="text"
                name="lrn_old"
                value={formData.lrn_old}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Year Level:</label>
              <select
                name="yr_lvl_old"
                value={formData.yr_lvl_old}
                onChange={handleYearLevelChange}
                required
              >
                <option value="">-- Select Year Level --</option>
                <option value="Nursery">Nursery</option>
                <option value="Kinder">Kinder</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                  <option key={g} value={g}>
                    Grade {g}
                  </option>
                ))}
              </select>
            </div>
            {parseInt(formData.yr_lvl_old, 10) >= 11 && (
              <div className="form-group">
                <label>Choose a Strand:</label>
                <select
                  name="strand_old"
                  value={formData.strand_old}
                  onChange={handleChange}
                >
                  <option value="">-- Select Strand --</option>
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
                name="fname_old"
                value={formData.fname_old}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Middle Name (Optional):</label>
              <input
                type="text"
                name="mname_old"
                value={formData.mname_old}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Last Name:</label>
              <input
                type="text"
                name="lname_old"
                value={formData.lname_old}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Extension Name (Optional):</label>
              <input
                type="text"
                name="extname_old"
                value={formData.extname_old}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Birth Date:</label>
              <input
                type="date"
                name="birthday_old"
                value={formData.birthday_old}
                onChange={handleBirthdayChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Age:</label>
              <input
                type="text"
                name="age_old"
                value={formData.age_old}
                readOnly
                required
              />
            </div>
            <div className="form-group">
              <label>Gender:</label>
              <select
                name="gender_old"
                value={formData.gender_old}
                onChange={handleChange}
                required
              >
                <option value="">-- Select Gender --</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
            <div className="form-group">
              <label>Phone Number:</label>
              <input
                type="tel"
                name="phone_old"
                value={formData.phone_old}
                onChange={(e) =>
                  handleChange({
                    target: {
                      name: "phone_old",
                      value: e.target.value.replace(/\D/g, ""),
                    },
                  })
                }
                pattern="^09[0-9]{9}$"
                maxLength="11"
                placeholder="09XXXXXXXXX"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Email Address:</label>
            <input
              type="email"
              name="email_old"
              value={formData.email_old}
              onChange={handleChange}
              required
            />
          </div>

          <h3>Address</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Primary Address:</label>
              <input
                type="text"
                name="prim_add_old"
                value={formData.prim_add_old}
                onChange={handlePrimaryAddressChange}
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Secondary Address:</label>
              <input
                type="text"
                name="sec_add_old"
                value={formData.sec_add_old}
                onChange={handleChange}
                readOnly={sameAsPrimary.sec}
                required
              />
              <label className="same-address-option">
                <input
                  type="checkbox"
                  checked={sameAsPrimary.sec}
                  onChange={(e) => handleSameAsPrimary("sec", e.target.checked)}
                />
                <span>Same as primary address</span>
              </label>
            </div>
            <div className="form-group">
              <label>Zip Code:</label>
              <input
                type="text"
                name="zip_code_old"
                value={formData.zip_code_old}
                onChange={(e) =>
                  handleChange({
                    target: {
                      name: "zip_code_old",
                      value: e.target.value.replace(/[^0-9]/g, ""),
                    },
                  })
                }
                required
              />
            </div>
          </div>

          <h3>Parent or Guardian Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Parent or Guardian Name:</label>
              <input
                type="text"
                name="parent_name_old"
                value={formData.parent_name_old}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Phone Number:</label>
              <input
                type="tel"
                name="parent_phone_old"
                value={formData.parent_phone_old}
                onChange={(e) =>
                  handleChange({
                    target: {
                      name: "parent_phone_old",
                      value: e.target.value.replace(/\D/g, ""),
                    },
                  })
                }
                pattern="^09[0-9]{9}$"
                maxLength="11"
                placeholder="09XXXXXXXXX"
                required
              />
            </div>
            <div className="form-group">
              <label>Relationship to Student:</label>
              <input
                type="text"
                name="parent_rel_old"
                value={formData.parent_rel_old}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Parent or Guardian Address:</label>
              <input
                type="text"
                name="parent_add_old"
                value={formData.parent_add_old}
                onChange={handleChange}
                readOnly={sameAsPrimary.parent}
                required
              />
              <label className="same-address-option">
                <input
                  type="checkbox"
                  checked={sameAsPrimary.parent}
                  onChange={(e) =>
                    handleSameAsPrimary("parent", e.target.checked)
                  }
                />
                <span>Same as primary address</span>
              </label>
            </div>
          </div>

          <h3>Upload Documents</h3>
          <div className="form-group">
            <label>2x2 ID:</label>
            <input
              type="file"
              onChange={(e) => setIdPic(e.target.files[0])}
              required
            />
          </div>

          <input
            type="submit"
            value={submitting ? "Submitting..." : "Proceed"}
            disabled={submitting}
          />
        </form>
      </div>
    </>
  );
}
