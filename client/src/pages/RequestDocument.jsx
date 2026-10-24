import { useState, useEffect } from "react";
import axios from "axios";
import StudentSidebar from "../components/StudentSidebar";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import "./StudentDashboard.css";
import "./RequestDocument.css";

const YEAR_LEVELS = [
  "Nursery",
  "Kinder",
  ...Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`),
];

export default function RequestDocument() {
  const { user } = useAuth();
  const [documentTypes, setDocumentTypes] = useState([]);
  const [lrn, setLrn] = useState(user?.lrn || "");
  const [documentType, setDocumentType] = useState("");
  const [purpose, setPurpose] = useState("");
  const [needsManualEntry, setNeedsManualEntry] = useState(false);
  const [manualData, setManualData] = useState({
    full_name: "",
    year_level: "",
    strand: "",
    room: "",
    level: "Senior High School",
  });
  const [myRequests, setMyRequests] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

 useEffect(() => {
  axios
    .get(`${API_BASE_URL}/students/document-types.php`)
    .then((res) => setDocumentTypes(res.data?.types || []))
    .catch(() => setDocumentTypes([]));
}, []);

  useEffect(() => {
    if (!user?.lrn) return;
    axios
      .get(
        `${API_BASE_URL}/students/my-document-requests.php?lrn=${user.lrn}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        },
      )
      .then((res) => setMyRequests(res.data.requests || []))
      .catch(() => setMyRequests([]));
  }, [user, successMessage]);

  const handleManualChange = (e) => {
    const { name, value } = e.target;
    setManualData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");
    setSubmitting(true);

    const payload = { lrn, document_type: documentType, purpose };
    if (needsManualEntry) Object.assign(payload, manualData);

    try {
      const res = await axios.post(
        `${API_BASE_URL}/students/request-document.php`,
        payload,
      );
      if (res.data.success) {
        setSuccessMessage(res.data.message);
        setNeedsManualEntry(false);
        setPurpose("");
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.student_not_found) {
        setNeedsManualEntry(true);
        if (data.known_full_name) {
          setManualData((prev) => ({
            ...prev,
            full_name: data.known_full_name,
          }));
        }
      }
      setErrorMessage(
        data?.message || "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="student-dashboard">
      <StudentSidebar />
      <div className="student-content">
        <div className="card request-document-card">
          <h2>Request a Document</h2>

          {successMessage && (
            <div className="alert alert-success">{successMessage}</div>
          )}
          {errorMessage && (
            <div className="alert alert-danger">{errorMessage}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="lrn">LRN (Learner Reference Number):</label>
              <input
                type="text"
                id="lrn"
                value={lrn}
                onChange={(e) => setLrn(e.target.value)}
                readOnly={!!user?.lrn}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="document_type">Document Needed:</label>
              <select
                id="document_type"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                required
              >
                <option value="">Select a document</option>
                {documentTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
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
                    readOnly={!!manualData.full_name}
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
                    {YEAR_LEVELS.map((yl) => (
                      <option key={yl} value={yl}>
                        {yl}
                      </option>
                    ))}
                  </select>
                </div>

                {["Grade 11", "Grade 12"].includes(manualData.year_level) && (
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
                      <option value="STEM">STEM</option>
                      <option value="ABM">ABM</option>
                      <option value="HUMSS">HUMSS</option>
                    </select>
                  </div>
                )}

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
                placeholder="Please state your reason for requesting this document"
                required
              />
            </div>

            <div className="form-group" style={{ textAlign: "center" }}>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </form>
        </div>

        {user?.lrn && myRequests.length > 0 && (
          <div className="card my-requests-card">
            <h3>My Document Requests</h3>
            <table>
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Requested</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {myRequests.map((r) => (
                  <tr key={r.id}>
                    <td>{r.document_type_label}</td>
                    <td>{new Date(r.request_date).toLocaleDateString()}</td>
                    <td>
                      <span
                        className={`status-badge status-${r.status.toLowerCase()}`}
                      >
                        {r.status}
                      </span>
                      {r.status === "Rejected" && r.rejection_reason && (
                        <small className="rejection-note">
                          {r.rejection_reason}
                        </small>
                      )}
                      {r.status === "Approved" && (
                        
                        <a  href={`/print-document?id=${r.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="view-link"
                        >
                          View
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="card request-document-note">
          <p>
            <strong>Note:</strong> Some documents (Form 137, TOR, diplomas)
            require manual preparation and must be claimed at the registrar's
            office.
          </p>
          <p>Processing may take 1–2 working days.</p>
        </div>
      </div>
    </div>
  );
}