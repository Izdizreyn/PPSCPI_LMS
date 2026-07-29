import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { API_BASE_URL } from "../config/api";
import "./ProfileSearch.css";

export default function ProfileSearch() {
  const [lrn, setLrn] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [queueInfo, setQueueInfo] = useState(null);
  const [balanceInfo, setBalanceInfo] = useState(null);
  const [showQueueModal, setShowQueueModal] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError("");
    setData(null);
    try {
      const res = await axios.get(`${API_BASE_URL}/students/profile-search.php?lrn=${lrn}`);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || `No student found with LRN: ${lrn}`);
    }
  };

  const openQueueModal = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/students/queue-info.php?id=${data.student.id}&type=${data.student.mapped_type}`
      );
      setQueueInfo(res.data.queue);
      setShowQueueModal(true);
    } catch (err) {
      alert("Could not load queue information.");
    }
  };

  const openBalanceModal = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/students/balance-info.php?lrn=${data.student.lrn}`);
      setBalanceInfo(res.data);
      setShowBalanceModal(true);
    } catch (err) {
      alert("Could not load balance information.");
    }
  };

  const primAddField = data && data.student.type === "old" ? "prim_add_old" : `prim_add_${data?.student.type}`;
  const secAddField = data && data.student.type === "old" ? "sec_add_old" : `sec_add_${data?.student.type}`;
  const zipCodeField = data && data.student.type === "old" ? "zip_code_old" : `zip_code_${data?.student.type}`;

  const requirementLabels = {
    form137_trans: "Form 137 (Transferee)",
    gmorale_trans: "Good Moral Certificate (Transferee)",
    cert_trans: "Certificate (Transferee)",
    tor_trans: "Transcript of Records (Transferee)",
    id_pic_trans: "ID Picture (Transferee)",
    id_pic_old: "ID Picture (Old Student)",
    report_card_new: "Report Card (New Student)",
    form_137_new: "Form 137 (New Student)",
    gmorale_new: "Good Moral Certificate (New Student)",
    id_pic_new: "ID Picture (New Student)",
  };

  return (
    <>
      <Navbar />
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={lrn}
          onChange={(e) => setLrn(e.target.value)}
          placeholder="Enter LRN"
          required
        />
        <button type="submit">Search</button>
      </form>

      {error && <p className="search-error">{error}</p>}

      {data && (
        <div className="container">
          <div className="edit-link-row">
            <Link to={`/edit-student?id=${data.student.id}&type=${data.student.type}`} className="edit-btn">
              Edit Profile
            </Link>
          </div>

          <div className="section-header">Student Information</div>

          <div className="info-item">
            <span className="info-label">Status:</span>
            <span style={{ color: data.student.status === "Approved" ? "green" : "orange", fontWeight: "bold" }}>
              {data.student.status}
            </span>
            {data.student.status === "Approved" && data.student.has_queue_info && (
              <>
                <a href="#" className="queue-btn" onClick={(e) => { e.preventDefault(); openQueueModal(); }}>
                  View Queue Number
                </a>
                <a href="#" className="balance-btn" onClick={(e) => { e.preventDefault(); openBalanceModal(); }}>
                  View Balance
                </a>
              </>
            )}
          </div>

          {data.balance && (
            <div className="info-item" style={{ marginTop: "10px" }}>
              <span className="info-label">Balance Status:</span>
              <span
                style={{
                  color:
                    data.balance.remaining_balance <= 0
                      ? "green"
                      : data.balance.remaining_balance < 500
                      ? "orange"
                      : "red",
                  fontWeight: "bold",
                }}
              >
                ₱ {Number(data.balance.remaining_balance).toFixed(2)}
              </span>
              <span style={{ fontSize: "12px", color: "#666", marginLeft: "5px" }}>
                (Last Updated: {new Date(data.balance.last_updated).toLocaleDateString()})
              </span>
            </div>
          )}

          <div className="info-row">
            <div className="info-item">
              <span className="info-label">Type:</span>
              {data.student.type === "new" ? "New Student" : data.student.type === "trans" ? "Transferee" : "Old Student"}
            </div>
            <div className="info-item">
              <span className="info-label">LRN:</span> {data.student.lrn}
            </div>
          </div>

          <div className="info-row">
            <div className="info-item">
              <span className="info-label">Name:</span>{" "}
              {data.student.first_name} {data.student.middle_name} {data.student.last_name} {data.student.ext_name}
            </div>
            <div className="info-item">
              <span className="info-label">Year Level:</span> {data.student.year_level}
            </div>
            {data.student.year_level >= 11 && (
              <div className="info-item">
                <span className="info-label">Strand:</span> {data.student.strand || "Not assigned"}
              </div>
            )}
          </div>

          <div className="info-row">
            <div className="info-item"><span className="info-label">Age:</span> {data.student.age}</div>
            <div className="info-item"><span className="info-label">Birthday:</span> {data.student.birthday}</div>
            <div className="info-item"><span className="info-label">Gender:</span> {data.student.gender}</div>
          </div>

          <div className="info-row">
            <div className="info-item"><span className="info-label">Phone:</span> {data.student.phone}</div>
            <div className="info-item"><span className="info-label">Email:</span> {data.student.email}</div>
          </div>

          <div className="section-header">Address Information</div>
          {data.address ? (
            <>
              <div className="info-row">
                <div className="info-item">
                  <span className="info-label">Primary Address:</span> {data.address[primAddField] ?? "N/A"}
                </div>
              </div>
              <div className="info-row">
                <div className="info-item">
                  <span className="info-label">Secondary Address:</span> {data.address[secAddField] ?? "N/A"}
                </div>
              </div>
              <div className="info-row">
                <div className="info-item">
                  <span className="info-label">Zip Code:</span> {data.address[zipCodeField] ?? "N/A"}
                </div>
              </div>
            </>
          ) : (
            <p>No address data found.</p>
          )}

          <div className="section-header">Parent Information</div>
          {data.parent ? (
            <>
              <div className="info-row">
                <div className="info-item">
                  <span className="info-label">Name:</span> {data.parent[`parent_name_${data.student.type}`] ?? "N/A"}
                </div>
              </div>
              <div className="info-row">
                <div className="info-item">
                  <span className="info-label">Address:</span> {data.parent[`parent_add_${data.student.type}`] ?? "N/A"}
                </div>
              </div>
              <div className="info-row">
                <div className="info-item">
                  <span className="info-label">Relationship to the Enrollee:</span>{" "}
                  {data.parent[`parent_rel_${data.student.type}`] ?? "N/A"}
                </div>
                <div className="info-item">
                  <span className="info-label">Phone:</span> {data.parent[`parent_phone_${data.student.type}`] ?? "N/A"}
                </div>
              </div>
            </>
          ) : (
            <p>No parent data found.</p>
          )}

          <div className="section-header">Requirements</div>
          <ul>
            {Object.entries(data.requirements || {})
              .filter(([key, value]) => !key.startsWith("id_req_") && value)
              .map(([key, value]) => {
                const label = requirementLabels[key] || "Unknown Document";
                const fileHref = value.replace(/\\/g, "/").replace(/^\/+/, "");
                return (
                  <li key={key}>
                    <a href={`${API_BASE_URL.replace("/api", "")}/${fileHref}`} target="_blank" rel="noreferrer">
                      {label}
                    </a>
                  </li>
                );
              })}
          </ul>
        </div>
      )}

      {showQueueModal && queueInfo && (
        <div className="modal" onClick={() => setShowQueueModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="close" onClick={() => setShowQueueModal(false)}>&times;</span>
            <div className="queue-card">
              <div className="queue-header">
                <h2>Queue Number</h2>
              </div>
              <div className="queue-number">{queueInfo.queue_number}</div>
              <div className="queue-details">
                <table>
                  <tbody>
                    <tr><td>Student Name:</td><td>{queueInfo.enrollee_name}</td></tr>
                    <tr><td>LRN:</td><td>{queueInfo.lrn}</td></tr>
                    <tr><td>Enrollment Date:</td><td>{new Date(queueInfo.enrollment_date).toLocaleDateString()}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
            <button className="print-btn" onClick={() => window.print()}>Print Queue</button>
          </div>
        </div>
      )}

      {showBalanceModal && balanceInfo && (
        <div className="modal" onClick={() => setShowBalanceModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="close" onClick={() => setShowBalanceModal(false)}>&times;</span>
            {balanceInfo.balance ? (
              <div className="balance-card">
                <div className="balance-header">
                  <h2>Student Financial Information</h2>
                  <p>Academic Year: {balanceInfo.balance.academic_year}</p>
                </div>
                <div className="balance-summary">
                  <table width="100%">
                    <tbody>
                      <tr><td><strong>Total Fees:</strong></td><td align="right">₱ {Number(balanceInfo.balance.total_fees).toFixed(2)}</td></tr>
                      <tr><td><strong>Paid Amount:</strong></td><td align="right">₱ {Number(balanceInfo.balance.paid_amount).toFixed(2)}</td></tr>
                      <tr className="balance-highlight"><td><strong>Remaining Balance:</strong></td><td align="right">₱ {Number(balanceInfo.balance.remaining_balance).toFixed(2)}</td></tr>
                      <tr><td><strong>Last Updated:</strong></td><td align="right">{new Date(balanceInfo.balance.last_updated).toLocaleDateString()}</td></tr>
                    </tbody>
                  </table>
                </div>

                {balanceInfo.transactions.length > 0 ? (
                  <div className="transaction-history">
                    <h3>Payment History</h3>
                    <table className="transaction-table">
                      <thead>
                        <tr><th>Date</th><th>Amount</th><th>Method</th><th>Receipt #</th><th>Remarks</th></tr>
                      </thead>
                      <tbody>
                        {balanceInfo.transactions.map((t) => (
                          <tr key={t.transaction_id}>
                            <td>{new Date(t.payment_date).toLocaleDateString()}</td>
                            <td>₱ {Number(t.amount).toFixed(2)}</td>
                            <td>{t.payment_method}</td>
                            <td>{t.receipt_number}</td>
                            <td>{t.remarks}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="no-transactions"><p>No payment transactions found.</p></div>
                )}

                <div className="balance-footer">
                  <button className="print-btn" onClick={() => window.print()}>Print Statement</button>
                </div>
              </div>
            ) : (
              <div className="no-balance"><p>No financial information found for this student.</p></div>
            )}
          </div>
        </div>
      )}
    </>
  );
}