import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { API_BASE_URL } from "../config/api";
import "./Transferee.css";

export default function Transferee() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    lrn_trans: "",
    yr_lvl_trans: "",
    strand_trans: "",
    fname_trans: "",
    mname_trans: "",
    lname_trans: "",
    extname_trans: "",
    birthday_trans: "",
    age_trans: "",
    gender_trans: "",
    phone_trans: "",
    email_trans: "",
    prim_add_trans: "",
    sec_add_trans: "",
    zip_code_trans: "",
    parent_name_trans: "",
    parent_phone_trans: "",
    parent_rel_trans: "",
    parent_add_trans: "",
  });

  const [files, setFiles] = useState({
    form_137_trans: null,
    gmorale_trans: null,
    cert_trans: null,
    tor_trans: null,
    "2x2_id_trans": null,
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
    setFormData((prev) => ({
      ...prev,
      birthday_trans: birthday,
      age_trans: age,
    }));
  };

  const handleYearLevelChange = (e) => {
    const yr_lvl_trans = e.target.value;
    const yearNum = parseInt(yr_lvl_trans, 10) || 0;
    setFormData((prev) => ({
      ...prev,
      yr_lvl_trans,
      strand_trans: yearNum >= 11 ? prev.strand_trans : "",
    }));
  };

  const handleSameAsPrimary = (field, checked) => {
    setSameAsPrimary((prev) => ({ ...prev, [field]: checked }));
    if (checked) {
      const targetField =
        field === "sec" ? "sec_add_trans" : "parent_add_trans";
      setFormData((prev) => ({ ...prev, [targetField]: prev.prim_add_trans }));
    }
  };

  const handlePrimaryAddressChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      prim_add_trans: value,
      sec_add_trans: sameAsPrimary.sec ? value : prev.sec_add_trans,
      parent_add_trans: sameAsPrimary.parent ? value : prev.parent_add_trans,
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
        `${API_BASE_URL}/students/trans.php`,
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
      <div className="container">
        <h2>Pre-Enrollment Form for Transferee</h2>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <h3>Student Information</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Learner Reference Number (LRN):</label>
              <input
                type="text"
                name="lrn_trans"
                value={formData.lrn_trans}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Year Level:</label>
              <select
                name="yr_lvl_trans"
                value={formData.yr_lvl_trans}
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
            {parseInt(formData.yr_lvl_trans, 10) >= 11 && (
              <div className="form-group">
                <label>Choose a Strand:</label>
                <select
                  name="strand_trans"
                  value={formData.strand_trans}
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
                name="fname_trans"
                value={formData.fname_trans}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Middle Name (Optional):</label>
              <input
                type="text"
                name="mname_trans"
                value={formData.mname_trans}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Last Name:</label>
              <input
                type="text"
                name="lname_trans"
                value={formData.lname_trans}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Extension Name (Optional):</label>
              <input
                type="text"
                name="extname_trans"
                value={formData.extname_trans}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Birth Date:</label>
              <input
                type="date"
                name="birthday_trans"
                value={formData.birthday_trans}
                onChange={handleBirthdayChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Age:</label>
              <input
                type="text"
                name="age_trans"
                value={formData.age_trans}
                onChange={(e) =>
                  handleChange({
                    target: {
                      name: "age_trans",
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
                name="gender_trans"
                value={formData.gender_trans}
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
                name="phone_trans"
                value={formData.phone_trans}
                onChange={(e) =>
                  handleChange({
                    target: {
                      name: "phone_trans",
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
              name="email_trans"
              value={formData.email_trans}
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
                name="prim_add_trans"
                value={formData.prim_add_trans}
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
                name="sec_add_trans"
                value={formData.sec_add_trans}
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
                name="zip_code_trans"
                value={formData.zip_code_trans}
                onChange={(e) =>
                  handleChange({
                    target: {
                      name: "zip_code_trans",
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
                name="parent_name_trans"
                value={formData.parent_name_trans}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Phone Number:</label>
              <input
                type="tel"
                name="parent_phone_trans"
                value={formData.parent_phone_trans}
                onChange={(e) =>
                  handleChange({
                    target: {
                      name: "parent_phone_trans",
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
                name="parent_rel_trans"
                value={formData.parent_rel_trans}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Parent or Guardian Address:</label>
              <input
                type="text"
                name="parent_add_trans"
                value={formData.parent_add_trans}
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
            <label>Form 137:</label>
            <input
              type="file"
              onChange={(e) =>
                handleFileChange("form_137_trans", e.target.files[0])
              }
              required
            />
          </div>
          <div className="form-group">
            <label>Certificate of Good Morale:</label>
            <input
              type="file"
              onChange={(e) =>
                handleFileChange("gmorale_trans", e.target.files[0])
              }
              required
            />
          </div>
          <div className="form-group">
            <label>Certificate of Enrollment:</label>
            <input
              type="file"
              onChange={(e) =>
                handleFileChange("cert_trans", e.target.files[0])
              }
              required
            />
          </div>
          <div className="form-group">
            <label>Transcript of Record:</label>
            <input
              type="file"
              onChange={(e) =>
                handleFileChange("tor_trans", e.target.files[0])
              }
              required
            />
          </div>
          <div className="form-group">
            <label>2x2 ID:</label>
            <input
              type="file"
              onChange={(e) =>
                handleFileChange("2x2_id_trans", e.target.files[0])
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