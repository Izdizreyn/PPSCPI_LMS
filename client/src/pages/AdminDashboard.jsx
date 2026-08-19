import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import AdminLayout from "../components/AdminLayout";
import "./AdminDashboard.css";
import { adminLinks } from "../config/navLinks";

const REQUIREMENT_LABELS = {
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

function formatRequirementLabel(key) {
  return REQUIREMENT_LABELS[key] || "Unknown Document";
}

export default function AdminDashboard() {
  const { token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("new");
  const [students, setStudents] = useState({
    new: [],
    old: [],
    transferee: [],
  });
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const loadStudents = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/admin/students.php`,
        authHeaders,
      );
      setStudents({
        new: res.data.new,
        old: res.data.old,
        transferee: res.data.transferee,
      });
    } catch (err) {
      if (err.response?.status === 401) logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const viewDetails = async (type, id) => {
    setSelected({ type, id });
    const res = await axios.get(
      `${API_BASE_URL}/admin/student-details.php?type=${type}&id=${id}`,
      authHeaders,
    );
    setDetails(res.data.data);
  };

  const approveStudent = async () => {
    const res = await axios.post(
      `${API_BASE_URL}/admin/approve.php`,
      { type: selected.type, id: selected.id },
      authHeaders,
    );
    if (res.data.success) {
      alert(`${res.data.message} Queue number: ${res.data.queue_number}`);
      setSelected(null);
      setDetails(null);
      loadStudents();
    }
  };

  if (loading) {
    return (
      <AdminLayout links={adminLinks}>
        <p>Loading...</p>
      </AdminLayout>
    );
  }

  if (selected && details) {
    const prefix =
      selected.type === "new"
        ? "_new"
        : selected.type === "old"
          ? "_old"
          : "_trans";
    const student = details.basic;
    const fullName = `${student[`fname${prefix}`]} ${student[`mname${prefix}`]} ${student[`lname${prefix}`]}`;

    return (
      <AdminLayout links={adminLinks}>
        <div className="admin-dashboard">
          <button
            className="back-btn"
            onClick={() => {
              setSelected(null);
              setDetails(null);
            }}
          >
            Back to Student List
          </button>
          <h2>
            {fullName} - {selected.type} Student
          </h2>

          <h3>Basic Info</h3>
          <p>LRN: {student[`lrn${prefix}`]}</p>
          <p>Year Level: {student[`yr_lvl${prefix}`]}</p>
          <p>Strand: {student[`strand${prefix}`]}</p>
          <p>Gender: {student[`gender${prefix}`]}</p>
          <p>Phone: {student[`phone${prefix}`]}</p>
          <p>Email: {student[`email${prefix}`]}</p>

          {details.address && (
            <>
              <h3>Address</h3>
              <p>
                {
                  details.address[
                    `prim_add${prefix === "_old" ? "_old" : prefix}`
                  ]
                }
              </p>
            </>
          )}

          {details.parent && (
            <>
              <h3>Parent/Guardian</h3>
              <p>{details.parent[`parent_name${prefix}`]}</p>
              <p>{details.parent[`parent_phone${prefix}`]}</p>
            </>
          )}

          {details.requirements && (
            <>
              <h3>Requirements</h3>
              <ul className="requirements-list">
                {Object.entries(details.requirements)
                  .filter(([key, value]) => !key.startsWith("id_req_") && value)
                  .map(([key, value]) => {
                    const fileHref = value
                      .replace(/\\/g, "/")
                      .replace(/^\/+/, "");
                    return (
                      <li key={key}>
                        <a
                          href={`${API_BASE_URL}/${fileHref}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {formatRequirementLabel(key)}
                        </a>
                      </li>
                    );
                  })}
              </ul>
            </>
          )}

          {student[`status${prefix}`] !== "Approved" ? (
            <button onClick={approveStudent} className="approve-btn">
              Approve Enrollment
            </button>
          ) : (
            <p style={{ color: "green", fontWeight: "bold" }}>
              Enrollment Status: Approved
            </p>
          )}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout links={adminLinks}>
      <div className="admin-dashboard admin-dashboard">
        <h1>Enrollees</h1>
        <div className="tab">
          {["new", "old", "transferee"].map((tab) => (
            <button
              key={tab}
              className={activeTab === tab ? "active" : ""}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "new"
                ? "New Students"
                : tab === "old"
                  ? "Old Students"
                  : "Transferee Students"}
            </button>
          ))}
        </div>

        <table>
          <thead>
            <tr>
              <th>LRN</th>
              <th>Name</th>
              <th>Year Level</th>
              <th>Strand</th>
              <th>Gender</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {students[activeTab].map((s) => (
              <tr key={s.id}>
                <td>{s.lrn}</td>
                <td>{s.full_name}</td>
                <td>{s.year_level}</td>
                <td>{s.strand}</td>
                <td>{s.gender}</td>
                <td
                  style={{
                    color: s.status === "Approved" ? "green" : "orange",
                  }}
                >
                  {s.status}
                </td>
                <td>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      viewDetails(activeTab, s.id);
                    }}
                  >
                    View Details
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
