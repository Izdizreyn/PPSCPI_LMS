import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import AdminLayout from "../components/AdminLayout";
import { adminLinks } from "../config/navLinks";
import "./Grades.css";
import TablePagination from "../components/TablePagination";

const TABS = ["Submitted", "Validated", "Returned", "Released"];
const PAGE_SIZE = 10;

export default function AdminGradeReview() {
  const { token, logout } = useAuth();
  const [tab, setTab] = useState("Submitted");
  const [batches, setBatches] = useState([]);
  const [selected, setSelected] = useState(null); // { lrn, quarter }
  const [detail, setDetail] = useState(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [page, setPage] = useState(1);

  const auth = { headers: { Authorization: `Bearer ${token}` } };

  const loadBatches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/grades-review.php?status=${tab}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBatches(res.data.batches);
    } catch (err) {
      if (err.response?.status === 401) logout();
      setMsg({ type: "error", text: "Could not load batches." });
    } finally {
      setLoading(false);
    }
  }, [tab, token, logout]);

  useEffect(() => {
    const loadId = window.setTimeout(loadBatches, 0);
    return () => window.clearTimeout(loadId);
  }, [loadBatches]);

  const openBatch = async (b) => {
    setSelected(b);
    setReason("");
    setMsg(null);
    const res = await axios.get(
      `${API_BASE_URL}/admin/grades-review.php?lrn=${b.lrn}&quarter=${b.quarter}`,
      auth,
    );
    setDetail(res.data);
  };

  const act = async (action) => {
    if (action === "return" && !reason.trim()) {
      setMsg({ type: "error", text: "Enter a reason before returning the grades." });
      return;
    }
    setBusy(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/admin/grades-validate.php`,
        { lrn: selected.lrn, quarter: selected.quarter, action, reason },
        auth,
      );
      setMsg({ type: "info", text: res.data.message });
      setSelected(null);
      setDetail(null);
      loadBatches();
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Action failed." });
    } finally {
      setBusy(false);
    }
  };

  if (selected && detail) {
    const status = detail.grades[0]?.status;
    return (
      <AdminLayout links={adminLinks}>
        <div className="grades-page">
          <button className="grades-btn grades-btn-muted" onClick={() => { setSelected(null); setDetail(null); }}>
            ← Back to Batches
          </button>
          <h1>
            {detail.batch.full_name} · Q{detail.batch.quarter}
          </h1>
          <p>
            LRN: <strong>{detail.batch.lrn}</strong> · Year Level: <strong>{detail.batch.year_level}</strong>
            {detail.batch.strand ? <> · Strand: <strong>{detail.batch.strand}</strong></> : null} · Status:{" "}
            <span className={`grades-badge grades-badge-${status}`}>{status}</span>
          </p>
          {msg && <div className={`grades-alert grades-alert-${msg.type}`}>{msg.text}</div>}
          <table>
            <thead><tr><th>Subject</th><th>Grade</th></tr></thead>
            <tbody>
              {detail.grades.map((g) => (
                <tr key={g.subject_id}><td>{g.subject}</td><td>{Number(g.grade).toFixed(0)}</td></tr>
              ))}
            </tbody>
          </table>
          <div className="grades-actions">
            {status === "Submitted" && (
              <>
                <button className="grades-btn grades-btn-success" disabled={busy} onClick={() => act("validate")}>Validate &amp; Release to Student</button>
                <textarea
                  className="grades-reason"
                  placeholder="Reason for returning (required)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
                <button className="grades-btn grades-btn-danger" disabled={busy} onClick={() => act("return")}>Return to Encoder</button>
              </>
            )}
            {status === "Validated" && (
              <button className="grades-btn grades-btn-primary" disabled={busy} onClick={() => act("release")}>Release to Student</button>
            )}
          </div>
        </div>
      </AdminLayout>
    );
  }

  const pageCount = Math.max(1, Math.ceil(batches.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleBatches = batches.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <AdminLayout links={adminLinks}>
      <div className="grades-page">
        <h1>Grade Validation</h1>
        {msg && <div className={`grades-alert grades-alert-${msg.type}`}>{msg.text}</div>}
        <div className="grades-tabs">
          {TABS.map((t) => (
            <button key={t} className={tab === t ? "active" : ""} onClick={() => { setTab(t); setPage(1); }}>{t}</button>
          ))}
        </div>
        {loading ? (
          <p>Loading...</p>
        ) : batches.length === 0 ? (
          <p>No batches with status "{tab}".</p>
        ) : (
          <table>
            <thead>
              <tr><th>Name</th><th>Year Level</th><th>Strand</th><th>Quarter</th><th>Subjects</th><th>Submitted</th><th /></tr>
            </thead>
            <tbody>
              {visibleBatches.map((b) => (
                <tr key={`${b.lrn}-${b.quarter}`}>
                  <td>{b.full_name || b.lrn}</td>
                  <td>{b.year_level}</td>
                  <td>{b.strand || "—"}</td>
                  <td>Q{b.quarter}</td>
                  <td>{b.subjects}</td>
                  <td>{b.submitted_at ? new Date(b.submitted_at).toLocaleString() : "—"}</td>
                  <td><button className="grades-btn grades-btn-primary grades-btn-sm" onClick={() => openBatch(b)}>Review</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && (
          <TablePagination
            page={currentPage}
            pageSize={PAGE_SIZE}
            totalItems={batches.length}
            onPageChange={(nextPage) =>
              setPage(Math.min(Math.max(nextPage, 1), pageCount))
            }
          />
        )}
      </div>
    </AdminLayout>
  );
}
