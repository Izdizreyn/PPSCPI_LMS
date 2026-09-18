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

  // LRN lookup / auto-fill state
  const [lookupMode, setLookupMode] = useState(true);
  const [lookupLrn, setLookupLrn] = useState("");
  const [lookupBirthday, setLookupBirthday] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [foundRecord, setFoundRecord] = useState(null);

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

  const handleLookup = async (e) => {
    e.preventDefault();
    setLookupError("");
    setFoundRecord(null);
    setLookupLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/students/lookup-old-student.php`,
        { params: { lrn: lookupLrn, birthday: lookupBirthday } },
      );
      setFoundRecord(res.data.data);
    } catch (err) {
      setLookupError(
        err.response?.data?.message ||
          "No matching record found. Please fill out the form manually.",
      );
    } finally {
      setLookupLoading(false);
    }
  };

  const computeAge = (birthday) => {
    if (!birthday) return "";
    const birthdate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthdate.getFullYear();
    const monthDiff = today.getMonth() - birthdate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthdate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const confirmFoundRecord = () => {
    const secMatchesPrimary =
      !!foundRecord.prim_add && foundRecord.sec_add === foundRecord.prim_add;

    setFormData((prev) => ({
      ...prev,
      lrn_old: foundRecord.lrn || "",
      fname_old: foundRecord.fname || "",
      mname_old: foundRecord.mname || "",
      lname_old: foundRecord.lname || "",
      extname_old: foundRecord.extname || "",
      birthday_old: foundRecord.birthday || "",
      age_old: computeAge(foundRecord.birthday),
      gender_old: foundRecord.gender || "",
      phone_old: foundRecord.phone || "",
      email_old: foundRecord.email || "",
      prim_add_old: foundRecord.prim_add || "",
      sec_add_old: foundRecord.sec_add || "",
      zip_code_old: foundRecord.zip_code || "",
      parent_name_old: foundRecord.parent_name || "",
      parent_phone_old: foundRecord.parent_phone || "",
      parent_rel_old: foundRecord.parent_rel || "",
      parent_add_old: foundRecord.parent_add || "",
      // Year level/strand intentionally left blank — student is enrolling
      // for a NEW year, so this should be chosen fresh, not carried over.
    }));
    setSameAsPrimary((prev) => ({ ...prev, sec: secMatchesPrimary }));
    setLookupMode(false);
  };

  const skipLookup = () => {
    setFoundRecord(null);
    setLookupError("");
    setLookupMode(false);
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
      <div className="old-student-form">
        <h2>Pre-Enrollment Form for Old Student</h2>

        {lookupMode ? (
          <div className="lrn-lookup-section">
            <p className="lookup-hint">
              Enter your LRN and birth date to auto-fill your information
              from your previous enrollment.
            </p>

            {!foundRecord ? (
              <form onSubmit={handleLookup} className="lookup-form">
                <div className="form-group">
                  <label>Learner Reference Number (LRN):</label>
                  <input
                    type="text"
                    value={lookupLrn}
                    onChange={(e) => setLookupLrn(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Birth Date:</label>
                  <input
                    type="date"
                    value={lookupBirthday}
                    onChange={(e) => setLookupBirthday(e.target.value)}
                    required
                  />
                </div>

                {lookupError && <p style={{ color: "red" }}>{lookupError}</p>}

                <input
                  type="submit"
                  value={lookupLoading ? "Searching..." : "Search"}
                  disabled={lookupLoading}
                />

                <button
                  type="button"
                  className="skip-lookup-btn"
                  onClick={skipLookup}
                >
                  I don't have my LRN handy — fill out manually
                </button>
              </form>
            ) : (
              <div className="lookup-confirm-card">
                <h3>Is this you?</h3>
                <p>
                  <strong>
                    {foundRecord.fname} {foundRecord.mname} {foundRecord.lname}
                  </strong>
                </p>
                <p>LRN: {foundRecord.lrn}</p>
                <p>
                  Last Year Level: {foundRecord.last_year_level}
                  {foundRecord.last_strand ? ` - ${foundRecord.last_strand}` : ""}
                </p>
                <div className="lookup-confirm-actions">
                  <button
                    type="button"
                    className="confirm-yes-btn"
                    onClick={confirmFoundRecord}
                  >
                    Yes, this is me
                  </button>
                  <button
                    type="button"
                    className="skip-lookup-btn"
                    onClick={skipLookup}
                  >
                    Not me — fill out manually
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="form-back-row">
              <button
                type="button"
                className="back-to-lookup-btn"
                onClick={() => setLookupMode(true)}
              >
                ← Back to LRN Search
              </button>
            </div>

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
          </>
        )}
      </div>
    </>
  );
}