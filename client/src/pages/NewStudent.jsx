import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { API_BASE_URL } from "../config/api";
import "./NewStudent.css";

export default function NewStudent() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    lrn_new: "",
    yr_lvl_new: "",
    strand_new: "",
    fname_new: "",
    mname_new: "",
    lname_new: "",
    extname_new: "",
    birthday_new: "",
    age_new: "",
    gender_new: "",
    phone_new: "",
    email_new: "",
    prim_add_new: "",
    sec_add_new: "",
    zip_code_new: "",
    parent_name_new: "",
    parent_phone_new: "",
    parent_rel_new: "",
    parent_add_new: "",
  });

  const [files, setFiles] = useState({
    report_card_new: null,
    form_137_new: null,
    gmorale_new: null,
    "2x2_id_new": null,
  });

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
    setFormData((prev) => ({ ...prev, birthday_new: birthday, age_new: age }));
  };

  const handleYearLevelChange = (e) => {
    const yr_lvl_new = e.target.value;
    const yearNum = parseInt(yr_lvl_new, 10) || 0;
    setFormData((prev) => ({
      ...prev,
      yr_lvl_new,
      strand_new: yearNum >= 11 ? prev.strand_new : "",
    }));
  };

  const handleSameAsPrimary = (field, checked) => {
    setSameAsPrimary((prev) => ({ ...prev, [field]: checked }));
    if (checked) {
      const targetField = field === "sec" ? "sec_add_new" : "parent_add_new";
      setFormData((prev) => ({ ...prev, [targetField]: prev.prim_add_new }));
    }
  };

  const handlePrimaryAddressChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      prim_add_new: value,
      sec_add_new: sameAsPrimary.sec ? value : prev.sec_add_new,
      parent_add_new: sameAsPrimary.parent ? value : prev.parent_add_new,
    }));
  };

  const handleFileChange = (fieldName, file) => {
    setFiles((prev) => ({ ...prev, [fieldName]: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const missingFile = Object.entries(files).find(([, file]) => !file);
    if (missingFile) {
      setError("Please upload all required documents.");
      return;
    }

    setSubmitting(true);

    const payload = new FormData();
    Object.entries(formData).forEach(([key, value]) =>
      payload.append(key, value),
    );
    Object.entries(files).forEach(([key, file]) => payload.append(key, file));

    try {
      const res = await axios.post(
        `${API_BASE_URL}/students/new.php`,
        payload,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
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
      <div className="new-student-form">
        <h2>Pre-Enrollment Form for New Student</h2>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <h3>Student Information</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Learner Reference Number (LRN):</label>
              <input
                type="text"
                name="lrn_new"
                value={formData.lrn_new}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Year Level:</label>
              <select
                name="yr_lvl_new"
                value={formData.yr_lvl_new}
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
            {parseInt(formData.yr_lvl_new, 10) >= 11 && (
              <div className="form-group">
                <label>Choose a Strand:</label>
                <select
                  name="strand_new"
                  value={formData.strand_new}
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
                name="fname_new"
                value={formData.fname_new}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Middle Name (Optional):</label>
              <input
                type="text"
                name="mname_new"
                value={formData.mname_new}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Last Name:</label>
              <input
                type="text"
                name="lname_new"
                value={formData.lname_new}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Extension Name (Optional):</label>
              <input
                type="text"
                name="extname_new"
                value={formData.extname_new}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Birth Date:</label>
              <input
                type="date"
                name="birthday_new"
                value={formData.birthday_new}
                onChange={handleBirthdayChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Age:</label>
              <input
                type="text"
                name="age_new"
                value={formData.age_new}
                onChange={(e) =>
                  handleChange({
                    target: {
                      name: "age_new",
                      value: e.target.value.replace(/[^0-9]/g, ""),
                    },
                  })
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Gender:</label>
              <select
                name="gender_new"
                value={formData.gender_new}
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
                name="phone_new"
                value={formData.phone_new}
                onChange={(e) =>
                  handleChange({
                    target: {
                      name: "phone_new",
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
              name="email_new"
              value={formData.email_new}
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
                name="prim_add_new"
                value={formData.prim_add_new}
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
                name="sec_add_new"
                value={formData.sec_add_new}
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
                name="zip_code_new"
                value={formData.zip_code_new}
                onChange={(e) =>
                  handleChange({
                    target: {
                      name: "zip_code_new",
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
                name="parent_name_new"
                value={formData.parent_name_new}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Phone Number:</label>
              <input
                type="tel"
                name="parent_phone_new"
                value={formData.parent_phone_new}
                onChange={(e) =>
                  handleChange({
                    target: {
                      name: "parent_phone_new",
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
                name="parent_rel_new"
                value={formData.parent_rel_new}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Parent or Guardian Address:</label>
              <input
                type="text"
                name="parent_add_new"
                value={formData.parent_add_new}
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
            <label>Report Card:</label>
            <input
              type="file"
              onChange={(e) =>
                handleFileChange("report_card_new", e.target.files[0])
              }
              required
            />
          </div>
          <div className="form-group">
            <label>Form 137:</label>
            <input
              type="file"
              onChange={(e) =>
                handleFileChange("form_137_new", e.target.files[0])
              }
              required
            />
          </div>
          <div className="form-group">
            <label>Certificate of Good Morale:</label>
            <input
              type="file"
              onChange={(e) =>
                handleFileChange("gmorale_new", e.target.files[0])
              }
              required
            />
          </div>
          <div className="form-group">
            <label>2x2 ID:</label>
            <input
              type="file"
              onChange={(e) =>
                handleFileChange("2x2_id_new", e.target.files[0])
              }
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
