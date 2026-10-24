import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import AdminLayout from "../components/AdminLayout";
import { GradeCheckIcon } from "../components/AdminIcons";
import "./AdminDashboard.css";
import { adminLinks } from "../config/navLinks";
import TablePagination from "../components/TablePagination";

const PAGE_SIZE = 10;

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

export default function AdminDashboard({ showApplicants = false }) {
  const { token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("pending");
  const [applicantPage, setApplicantPage] = useState(1);
  const [students, setStudents] = useState({
    new: [],
    old: [],
    transferee: [],
  });
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [approvalMessage, setApprovalMessage] = useState(null);
  const [approving, setApproving] = useState(false);
  const [overviewLoadError, setOverviewLoadError] = useState("");
  const [overview, setOverview] = useState({
    applicants: null,
    enrollmentOverview: null,
    queue: null,
    queueBatch: "",
    enrolled: null,
    requests: null,
    gradesPending: null,
  });

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token],
  );

  const loadStudents = useCallback(
    async ({ showLoading = true } = {}) => {
      setLoadError("");
      if (showLoading) setLoading(true);
      try {
        const res = await axios.get(
          `${API_BASE_URL}/admin/students.php`,
          authHeaders,
        );
        setStudents({
          new: (res.data.new || []).map((student) => ({
            ...student,
            type: "new",
          })),
          old: (res.data.old || []).map((student) => ({
            ...student,
            type: "old",
          })),
          transferee: (res.data.transferee || []).map((student) => ({
            ...student,
            type: "transferee",
          })),
        });
        return res.data;
      } catch (err) {
        if (err.response?.status === 401) logout();
        setLoadError(
          err.response?.data?.message ||
            "Could not refresh the applicant list.",
        );
        return null;
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [authHeaders, logout],
  );

  useEffect(() => {
    if (!showApplicants) return undefined;

    const loadId = window.setTimeout(loadStudents, 0);
    return () => window.clearTimeout(loadId);
  }, [loadStudents, showApplicants]);

  useEffect(() => {
    if (showApplicants) return;

    Promise.allSettled([
      axios.get(`${API_BASE_URL}/admin/students.php`, authHeaders),
      axios.get(`${API_BASE_URL}/admin/approved-students.php`, authHeaders),
      axios.get(`${API_BASE_URL}/admin/queue-dashboard.php`, authHeaders),
      axios.get(`${API_BASE_URL}/admin/enrolled-students.php`, authHeaders),
      axios.get(`${API_BASE_URL}/admin/document-requests.php`, authHeaders),
      axios.get(`${API_BASE_URL}/admin/grades-review.php?status=Submitted`, authHeaders),
    ]).then((results) => {
      if (results.some((result) => result.status === "rejected" && result.reason.response?.status === 401)) {
        logout();
      }
      const payloads = results.map((result) =>
        result.status === "fulfilled" && result.value.data?.success !== false
          ? result.value.data
          : null,
      );
      const payloadChecks = [
        (data) =>
          Array.isArray(data?.new) &&
          Array.isArray(data?.old) &&
          Array.isArray(data?.transferee),
        (data) => Array.isArray(data?.students),
        (data) =>
          Array.isArray(data?.queue) &&
          Number.isFinite(Number(data?.today_queue_count)) &&
          Number.isFinite(Number(data?.yesterday_queue_count)),
        (data) => Array.isArray(data?.students),
        (data) => Array.isArray(data?.requests),
        (data) => Array.isArray(data?.batches),
      ];
      const validPayloads = payloads.map(
        (data, index) => data && payloadChecks[index](data),
      );
      const [applicants, approved, queue, enrolled, requests, gradesPending] =
        payloads.map((data, index) =>
          validPayloads[index] ? data : null,
        );
      const failedCount = validPayloads.filter((isValid) => !isValid).length;
      setOverviewLoadError(
        failedCount
          ? `${failedCount} dashboard count${failedCount === 1 ? "" : "s"} could not be loaded. Refresh the page to retry.`
          : "",
      );
      const applicantLists = [
        applicants?.new || [],
        applicants?.old || [],
        applicants?.transferee || [],
      ];
      setOverview({
        applicants: applicants
          ? applicantLists.reduce(
              (total, list) =>
                total +
                list.filter(
                  (student) => student.status?.toLowerCase() !== "approved",
                ).length,
              0,
            )
          : null,
        enrollmentOverview: approved ? approved.students?.length ?? 0 : null,
        queue: queue
          ? Number(queue.today_queue_count || 0) +
            Number(queue.yesterday_queue_count || 0)
          : null,
        queueBatch: queue?.queue_batch || "",
        enrolled: enrolled ? enrolled.students?.length ?? 0 : null,
        requests:
          requests?.requests?.filter(
            (request) => request.status?.toLowerCase() === "pending",
          ).length ?? (requests ? 0 : null),
        gradesPending: gradesPending
          ? gradesPending.batches?.length ?? 0
          : null,
      });
    });
  }, [authHeaders, logout, showApplicants]);

  const viewDetails = async (type, id) => {
    setSelected({ type, id });
    const res = await axios.get(
      `${API_BASE_URL}/admin/student-details.php?type=${type}&id=${id}`,
      authHeaders,
    );
    setDetails(res.data.data);
  };

  const approveStudent = async () => {
    if (!selected || approving) return;

    const approvedApplicant = selected;
    setApproving(true);
    setApprovalMessage(null);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/admin/approve.php`,
        { type: approvedApplicant.type, id: approvedApplicant.id },
        authHeaders,
      );
      if (res.data.success) {
        setApprovalMessage({
          type: "success",
          text: `${res.data.message} Queue number: ${res.data.queue_number}.`,
        });
        setStudents((current) => ({
          ...current,
          [approvedApplicant.type]: current[approvedApplicant.type].map(
            (student) =>
              student.id === approvedApplicant.id
                ? { ...student, status: "Approved" }
                : student,
          ),
        }));
        setSelected(null);
        setDetails(null);
        await loadStudents({ showLoading: false });
      } else {
        const refreshedStudents = await loadStudents({ showLoading: false });
        const refreshedApplicant = refreshedStudents?.[
          approvedApplicant.type
        ]?.find((student) => student.id === approvedApplicant.id);

        if (refreshedApplicant?.status === "Approved") {
          setSelected(null);
          setDetails(null);
          setApprovalMessage({
            type: "success",
            text: "Student approval was completed successfully.",
          });
        } else {
          setApprovalMessage({
            type: "error",
            text:
              res.data.message ||
              "The approval endpoint returned an unsuccessful response, and the applicant list does not show this student as approved.",
          });
        }
      }
    } catch (err) {
      const refreshedStudents = await loadStudents({ showLoading: false });
      const refreshedApplicant = refreshedStudents?.[
        approvedApplicant.type
      ]?.find((student) => student.id === approvedApplicant.id);

      if (refreshedApplicant?.status === "Approved") {
        setSelected(null);
        setDetails(null);
        setApprovalMessage({
          type: "success",
          text: "Student approval was completed successfully.",
        });
      } else {
        const responseData = err.response?.data;
        const responseMessage =
          typeof responseData === "string"
            ? responseData
            : responseData?.message;
        const status = err.response?.status
          ? ` (HTTP ${err.response.status})`
          : "";
        setApprovalMessage({
          type: "error",
          text:
            responseMessage ||
            `Approval request failed${status}: ${err.message || "No response details were returned."}`,
        });
      }
    } finally {
      setApproving(false);
    }
  };

  if (!showApplicants) {
    const overviewCards = [
      {
        title: "Applicants to Approve",
        count: overview.applicants,
        description: "Review pending enrollment applications",
        to: "/admin/applicants",
        className: "overview-card-applicants",
      },
      {
        title: "Student Enrollment Overview",
        count: overview.enrollmentOverview,
        description: "Approved students and balances",
        to: "/admin/students",
        className: "overview-card-purple",
      },
      {
        title: "Live Queue Dashboard",
        count: overview.queue,
        description: overview.queueBatch
          ? `Current queue batch: ${overview.queueBatch}`
          : "Current enrollment queue numbers",
        to: "/admin/queue",
        className: "overview-card-gold",
      },
      {
        title: "Enrolled Students",
        count: overview.enrolled,
        description: "Students assigned to rooms",
        to: "/admin/enrolled",
        className: "overview-card-green",
      },
      {
        title: "Document Requests",
        count: overview.requests,
        description: "Requests waiting for review",
        to: "/admin/requests",
        className: "overview-card-blue",
      },
      {
        title: "Grade Validation",
        count: overview.gradesPending,
        description: "Submitted grade batches waiting for review",
        to: "/admin/grades",
        className: "overview-card-orange",
        icon: <GradeCheckIcon />,
      },
    ];

    return (
      <AdminLayout links={adminLinks}>
        <main className="admin-overview">
          <header className="admin-overview-header">
            <p className="admin-overview-eyebrow">Power Purple LMS</p>
            <h1>Admin Dashboard</h1>
          </header>
          {overviewLoadError && (
            <p className="admin-overview-error" role="status">
              {overviewLoadError}
            </p>
          )}
          <section
            className="admin-overview-grid"
            aria-label="Admin dashboard overview"
          >
            {overviewCards.map((card) => (
              <article
                className={`admin-overview-card ${card.className}`}
                key={card.to}
              >
                <div>
                  <div className="admin-overview-card-heading">
                    {card.icon && (
                      <span className="admin-overview-card-icon">
                        {card.icon}
                      </span>
                    )}
                    <p className="admin-overview-card-title">{card.title}</p>
                  </div>
                  <strong>{card.count ?? "—"}</strong>
                  <p>{card.description}</p>
                </div>
                <Link to={card.to}>Open</Link>
              </article>
            ))}
          </section>
        </main>
      </AdminLayout>
    );
  }

  if (loading) {
    return (
      <AdminLayout links={adminLinks}>
        <p>Loading...</p>
      </AdminLayout>
    );
  }

  const allApplicants = [
    ...students.new,
    ...students.old,
    ...students.transferee,
  ].sort((first, second) => {
    const firstPending = first.status?.toLowerCase() !== "approved";
    const secondPending = second.status?.toLowerCase() !== "approved";
    return Number(secondPending) - Number(firstPending);
  });
  const applicantsByTab =
    activeTab === "pending"
      ? allApplicants.filter((student) => student.status?.toLowerCase() !== "approved")
      : [...students[activeTab]].sort((first, second) => {
          const firstPending = first.status?.toLowerCase() !== "approved";
          const secondPending = second.status?.toLowerCase() !== "approved";
          return Number(secondPending) - Number(firstPending);
        });
  const applicantPageCount = Math.max(
    1,
    Math.ceil(applicantsByTab.length / PAGE_SIZE),
  );
  const currentApplicantPage = Math.min(applicantPage, applicantPageCount);
  const visibleApplicants = applicantsByTab.slice(
    (currentApplicantPage - 1) * PAGE_SIZE,
    currentApplicantPage * PAGE_SIZE,
  );

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
          {approvalMessage && (
            <p className={`approval-message approval-message-${approvalMessage.type}`} role={approvalMessage.type === "error" ? "alert" : "status"}>
              {approvalMessage.text}
            </p>
          )}
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
            <button onClick={approveStudent} className="approve-btn" disabled={approving}>
              {approving ? "Approving..." : "Approve Enrollment"}
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
        <h1>Applicants to Approve</h1>
        {approvalMessage && (
          <p className={`approval-message approval-message-${approvalMessage.type}`} role={approvalMessage.type === "error" ? "alert" : "status"}>
            {approvalMessage.text}
          </p>
        )}
        {loadError && <p role="alert">{loadError}</p>}
        <div className="tab">
          {["pending", "new", "old", "transferee"].map((tab) => (
            <button
              key={tab}
              className={activeTab === tab ? "active" : ""}
              onClick={() => {
                setActiveTab(tab);
                setApplicantPage(1);
              }}
            >
              {tab === "pending"
                ? "Pending Approval"
                : tab === "new"
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
            {visibleApplicants.map((s) => (
              <tr key={`${s.type}-${s.id}`}>
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
                      viewDetails(s.type, s.id);
                    }}
                  >
                    View Details
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {applicantsByTab.length === 0 && <p>No applicants in this list.</p>}
        <TablePagination
          page={currentApplicantPage}
          pageSize={PAGE_SIZE}
          totalItems={applicantsByTab.length}
          onPageChange={(page) =>
            setApplicantPage(Math.min(Math.max(page, 1), applicantPageCount))
          }
        />
      </div>
    </AdminLayout>
  );
}