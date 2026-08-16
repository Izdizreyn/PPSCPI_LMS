import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import AdminLayout from "../components/AdminLayout";
import "./ApprovedStudents.css";

const adminLinks = [
  { to: "/admin/dashboard", label: "Dashboard", icon: "🏠" },
  { to: "/admin/students", label: "Students", icon: "👨‍🎓" },
  { to: "/admin/enrolled", label: "Enrolled", icon: "📚" },
  { to: "/admin/requests", label: "Requests", icon: "📩" },
];

const STRAND_ORDER = { STEM: 1, ABM: 2, HUMSS: 3, "": 4 };
const strandSort = (a, b) => (STRAND_ORDER[a] ?? 5) - (STRAND_ORDER[b] ?? 5);

export default function ApprovedStudents() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [students, setStudents] = useState([]);
  const [balances, setBalances] = useState({});
  const [enrolledLrns, setEnrolledLrns] = useState([]);
  const [loading, setLoading] = useState(true);

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/admin/approved-students.php`, authHeaders);
      setStudents(res.data.students);
      setBalances(res.data.balances);
      setEnrolledLrns(res.data.enrolled_lrns);
      setLoading(false);
    })();
  }, []);

  const balanceCell = (lrn) => {
    const b = balances[lrn];
    if (!b) return <span className="balance-none">Not set</span>;
    const remaining = Number(b.remaining_balance);
    return (
      <span className={remaining <= 0 ? "balance-paid" : "balance-due"}>
        ₱ {remaining.toFixed(2)}
      </span>
    );
  };

  if (loading) {
    return (
      <AdminLayout links={adminLinks}>
        <p>Loading...</p>
      </AdminLayout>
    );
  }

  const renderTable = (list) => (
    <table className="student-table">
      <thead>
        <tr>
          <th>LRN</th>
          <th>Name</th>
          <th>Gender</th>
          <th>Year Level</th>
          <th>Strand</th>
          <th>Type</th>
          <th>Remaining Balance</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {list.map((s) => (
          <tr key={`${s.type}-${s.id}`}>
            <td>{s.lrn}</td>
            <td>{s.full_name}</td>
            <td>{s.gender}</td>
            <td>{s.year_level}</td>
            <td>{s.strand}</td>
            <td>{s.type.charAt(0).toUpperCase() + s.type.slice(1)}</td>
            <td>{balanceCell(s.lrn)}</td>
            <td>
              <Link to={`/admin/queue?type=${s.type}&id=${s.id}`} className="view-link">
                View Queue Number
              </Link>
              {" | "}
              <Link
                to={`/admin/print-balance?lrn=${s.lrn}`}
                target="_blank"
                rel="noopener noreferrer"
                className="view-link"
              >
                View Balance
              </Link>
              {!enrolledLrns.includes(s.lrn) && (
                <>
                  {" | "}
                  <Link
                    to={`/admin/enroll?lrn=${s.lrn}&name=${encodeURIComponent(s.full_name)}&year=${s.year_level}&strand=${encodeURIComponent(s.strand || "")}`}
                    className="view-link"
                  >
                    Enroll
                  </Link>
                </>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const byYearLevel = {};
  students.forEach((s) => {
    if (!byYearLevel[s.year_level]) byYearLevel[s.year_level] = [];
    byYearLevel[s.year_level].push(s);
  });

  const byStrand = {};
  students.forEach((s) => {
    const strand = s.strand || "Junior High";
    if (!byStrand[strand]) byStrand[strand] = [];
    byStrand[strand].push(s);
  });

  return (
    <AdminLayout links={adminLinks}>
      <div className="approved-students">
        <h1>Student Enrollment Overview</h1>

        <div className="tab">
          <button className={activeTab === "all" ? "active" : ""} onClick={() => setActiveTab("all")}>
            All Students
          </button>
          <button className={activeTab === "year" ? "active" : ""} onClick={() => setActiveTab("year")}>
            By Year Level
          </button>
          <button className={activeTab === "strand" ? "active" : ""} onClick={() => setActiveTab("strand")}>
            By Strand
          </button>
        </div>

        {activeTab === "all" &&
          (students.length > 0 ? renderTable(students) : <p>No enrolled students found.</p>)}

        {activeTab === "year" &&
          Object.keys(byYearLevel)
            .sort((a, b) => a - b)
            .map((yr) => (
              <div className="year-level-section" key={yr}>
                <div className="year-level-header">
                  <h3>Grade {yr}</h3>
                </div>
                {renderTable(byYearLevel[yr])}
              </div>
            ))}

        {activeTab === "strand" &&
          Object.keys(byStrand)
            .sort(strandSort)
            .map((strand) => (
              <div className="year-level-section" key={strand}>
                <div className="year-level-header">
                  <h3>{strand}</h3>
                </div>
                {renderTable(byStrand[strand])}
              </div>
            ))}
      </div>
    </AdminLayout>
  );
}