import { useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import { API_BASE_URL } from "../config/api";
import "./RequestCertificate.css";

export default function RequestCertificate() {
  const [lrn, setLrn] = useState("");
  const [purpose, setPurpose] = useState("");
  const [needsManualEntry, setNeedsManualEntry] = useState(false);
  const [manualData, setManualData] = useState({
    full_name: "",
    year_level: "",
    strand: "",
    room: "",
    level: "Senior High School",
  });
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleManualChange = (e) => {
    const { name, value } = e.target;
    setManualData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");
    setSubmitting(true);

    const payload = { lrn, purpose };
    if (needsManualEntry) {
      Object.assign(payload, manualData);
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/students/request-certificate.php`, payload);
      if (res.data.success) {
        setSuccessMessage(res.data.message);
        setNeedsManualEntry(false);
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.student_not_found) {
        setNeedsManualEntry(true);
      }
      setErrorMessage(data?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container">
        <h1>Request Certificate of Enrollment</h1>

        {successMessage && <div className="alert alert-success">{successMessage}</div>}
        {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="lrn">LRN (Learner Reference Number):</label>
            <input
              type="text"
              id="lrn"
              value={lrn}
              onChange={(e) => setLrn(e.target.value)}
              required
            />
          </div>

          {needsManualEntry && (
            <>
              <div className="form-group">
                <label htmlFor="full_name">Full Name:</label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={manualData.full_name}
                  onChange={handleManualChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="year_level">Year Level:</label>
                <select
                  id="year_level"
                  name="year_level"
                  value={manualData.year_level}
                  onChange={handleManualChange}
                  required
                >
                  <option value="">Select Year Level</option>
                  <option value="Grade 11">Grade 11</option>
                  <option value="Grade 12">Grade 12</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="strand">Strand:</label>
                <select
                  id="strand"
                  name="strand"
                  value={manualData.strand}
                  onChange={handleManualChange}
                  required
                >
                  <option value="">Select Strand</option>
                  <option value="ABM">ABM</option>
                  <option value="HUMSS">HUMSS</option>
                  <option value="STEM">STEM</option>
                  <option value="TVL">TVL</option>
                  <option value="GAS">GAS</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="room">Room/Section:</label>
                <input
                  type="text"
                  id="room"
                  name="room"
                  value={manualData.room}
                  onChange={handleManualChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="level">Level:</label>
                <input
                  type="text"
                  id="level"
                  name="level"
                  value={manualData.level}
                  onChange={handleManualChange}
                  required
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="purpose">Purpose of Request:</label>
            <textarea
              id="purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Please provide the purpose for requesting a Certificate of Enrollment"
              required
            />
          </div>

          <div className="form-group" style={{ textAlign: "center" }}>
            <button type="submit" className="btn-submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>

        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <p><strong>Note:</strong> Only officially enrolled students can request a Certificate of Enrollment.</p>
          <p>Processing may take 1-2 working days. You will need to pick up your certificate at the registrar's office.</p>
        </div>
      </div>
    </>
  );
}