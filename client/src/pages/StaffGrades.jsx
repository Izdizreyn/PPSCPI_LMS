import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import AdminLayout from "../components/AdminLayout";
import { teacherLinks } from "../config/navLinks";
import "./Grades.css";

const LOCKED = ["Submitted", "Validated", "Released"];

export default function StaffGrades() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const lrn = params.get("lrn");
  const quarter = params.get("quarter");

  const [student, setStudent] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const headers = { headers: { Authorization: `Bearer ${token}` } };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/admin/student-grades.php?lrn=${lrn}&quarter=${quarter}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setStudent(res.data.student);
      setSubjects(res.data.subjects);
      const v = {};
      res.data.subjects.forEach((s) => {
        v[s.subject_id] = s.grade ?? "";
      });
      setValues(v);
    } catch (err) {
      if (err.response?.status === 401) logout();
      setMsg({ type: "error", text: err.response?.data?.message || "Could not load grades." });
    } finally {
      setLoading(false);
    }
  }, [lrn, quarter, token, logout]);

  useEffect(() => {
    const loadId = window.setTimeout(load, 0);
    return () => window.clearTimeout(loadId);
  }, [load]);

  const locked = subjects.some((s) => LOCKED.includes(s.status));
  const returnedReason = subjects.find((s) => s.status === "Returned")?.remarks;
  const batchStatus = subjects.find((s) => s.status)?.status || "Empty";

  const save = async () => {
    const grades = subjects
      .filter((s) => values[s.subject_id] !== "")
      .map((s) => ({ subject_id: s.subject_id, grade: Number(values[s.subject_id]) }));
    if (grades.length === 0) {
      setMsg({ type: "error", text: "Enter at least one grade." });
      return false;
    }
    setBusy(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/admin/student-grades.php`,
        { lrn, quarter: Number(quarter), grades },
        headers,
      );
      setMsg({ type: "info", text: res.data.message });
      await load();
      return true;
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Save failed." });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (!window.confirm("Submit this student's grades for validation? You won't be able to edit them afterwards.")) return;
    if (!(await save())) return;
    setBusy(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/admin/student-grades-submit.php`,
        { lrn, quarter: Number(quarter) },
        headers,
      );
      setMsg({ type: "info", text: res.data.message });
      await load();
    } catch (err) {
      setMsg({ type: "error", text: err.response?.data?.message || "Submit failed." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminLayout links={teacherLinks}>
      <div className="grades-page">
        <button className="grades-btn grades-btn-muted" onClick={() => navigate("/teacher/my-classes")}>
          ← Back to Update Student Grades
        </button>
        <h1>
          {student ? student.full_name : "Grades"} · Quarter {quarter}{" "}
          <span className={`grades-badge grades-badge-${batchStatus}`}>{batchStatus}</span>
        </h1>
        {student && (
          <p>
            LRN: <strong>{student.lrn}</strong> · Year Level: <strong>{student.year_level}</strong>
            {student.strand ? <> · Strand: <strong>{student.strand}</strong></> : null} · Room:{" "}
            <strong>{student.room}</strong>
          </p>
        )}

        {msg && <div className={`grades-alert grades-alert-${msg.type}`}>{msg.text}</div>}
        {returnedReason && (
          <div className="grades-alert grades-alert-error">
            <strong>Returned by validator:</strong> {returnedReason}
          </div>
        )}

        {loading ? (
          <p>Loading...</p>
        ) : subjects.length === 0 ? (
          <p>No subjects configured for this student's year level yet. Add subjects to the <code>subjects</code> table first.</p>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Grade (60–100)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((s) => (
                  <tr key={s.subject_id}>
                    <td>{s.subject}</td>
                    <td>
                      <input
                        className="grades-input"
                        type="number"
                        min="60"
                        max="100"
                        step="1"
                        value={values[s.subject_id] ?? ""}
                        disabled={locked || busy}
                        onChange={(e) => setValues((v) => ({ ...v, [s.subject_id]: e.target.value }))}
                      />
                    </td>
                    <td>
                      <span className={`grades-badge grades-badge-${s.status || "Draft"}`}>
                        {s.status || "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!locked && (
              <div className="grades-actions">
                <button className="grades-btn grades-btn-primary" onClick={save} disabled={busy}>
                  Save Draft
                </button>
                <button className="grades-btn grades-btn-success" onClick={submit} disabled={busy}>
                  Submit for Validation
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
