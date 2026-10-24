import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config/api";
import StudentSidebar from "../components/StudentSidebar";
import { GradesIcon } from "../components/AdminIcons";
import "./StudentDashboard.css";

const displayValue = (value) => value || "Not provided";

const AddProfileIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 640 640"
    width="20"
    height="20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M352 128C352 110.3 337.7 96 320 96C302.3 96 288 110.3 288 128L288 288L128 288C110.3 288 96 302.3 96 320C96 337.7 110.3 352 128 352L288 352L288 512C288 529.7 302.3 544 320 544C337.7 544 352 529.7 352 512L352 352L512 352C529.7 352 544 337.7 544 320C544 302.3 529.7 288 512 288L352 288L352 128z" />
  </svg>
);

const RequestDocumentIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 640 640"
    width="20"
    height="20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M192 64C156.7 64 128 92.7 128 128L128 512C128 547.3 156.7 576 192 576L448 576C483.3 576 512 547.3 512 512L512 245.3C512 228.3 505.3 212 493.3 200L376 82.7C364 70.7 347.7 64 330.7 64L192 64zM320 96L320 208C320 234.5 341.5 256 368 256L480 256L480 512C480 529.7 465.7 544 448 544L192 544C174.3 544 160 529.7 160 512L160 128C160 110.3 174.3 96 192 96L320 96zM352 100L476 224L368 224C358.1 224 352 217.9 352 208L352 100zM208 320C199.2 320 192 327.2 192 336C192 344.8 199.2 352 208 352L432 352C440.8 352 448 344.8 448 336C448 327.2 440.8 320 432 320L208 320zM208 400C199.2 400 192 407.2 192 416C192 424.8 199.2 432 208 432L432 432C440.8 432 448 424.8 448 416C448 407.2 440.8 400 432 400L208 400z" />
  </svg>
);

const UploadDocumentIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 640 640"
    width="20"
    height="20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M416.5 88L416.5 160L352.5 160C273 160 208.5 224.5 208.5 304C208.5 397.4 291.3 438.8 309.1 446.6C311.3 447.6 313.7 448 316.2 448L318.7 448C328.5 448 336.5 440 336.5 430.2C336.5 421.9 330.6 414.7 323.7 409.9C314.8 403.7 304.5 391.7 304.5 369.4C304.5 324.4 341 287.9 386 287.9L416.5 287.9L416.5 359.9C416.5 369.6 422.3 378.4 431.3 382.1C440.3 385.8 450.6 383.8 457.5 376.9L593.5 240.9C602.9 231.5 602.9 216.3 593.5 207L457.5 71C450.6 64.1 440.3 62.1 431.3 65.8C422.3 69.5 416.5 78.3 416.5 88zM144.5 160C100.3 160 64.5 195.8 64.5 240L64.5 496C64.5 540.2 100.3 576 144.5 576L400.5 576C444.7 576 480.5 540.2 480.5 496L480.5 464C480.5 446.3 466.2 432 448.5 432C430.8 432 416.5 446.3 416.5 464L416.5 496C416.5 504.8 409.3 512 400.5 512L144.5 512C135.7 512 128.5 504.8 128.5 496L128.5 240C128.5 231.2 135.7 224 144.5 224L160.5 224C178.2 224 192.5 209.7 192.5 192C192.5 174.3 178.2 160 160.5 160L144.5 160z" />
  </svg>
);

const StatementIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 640 640"
    width="20"
    height="20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M142 66.2C150.5 62.3 160.5 63.7 167.6 69.8L208 104.4L248.4 69.8C257.4 62.1 270.7 62.1 279.6 69.8L320 104.4L360.4 69.8C369.4 62.1 382.6 62.1 391.6 69.8L432 104.4L472.4 69.8C479.5 63.7 489.5 62.3 498 66.2C506.5 70.1 512 78.6 512 88L512 552C512 561.4 506.5 569.9 498 573.8C489.5 577.7 479.5 576.3 472.4 570.2L432 535.6L391.6 570.2C382.6 577.9 369.4 577.9 360.4 570.2L320 535.6L279.6 570.2C270.6 577.9 257.3 577.9 248.4 570.2L208 535.6L167.6 570.2C160.5 576.3 150.5 577.7 142 573.8C133.5 569.9 128 561.4 128 552L128 88C128 78.6 133.5 70.1 142 66.2zM232 200C218.7 200 208 210.7 208 224C208 237.3 218.7 248 232 248L408 248C421.3 248 432 237.3 432 224C432 210.7 421.3 200 408 200L232 200zM208 416C208 429.3 218.7 440 232 440L408 440C421.3 440 432 429.3 432 416C432 402.7 421.3 392 408 392L232 392C218.7 392 208 402.7 208 416zM232 296C218.7 296 208 306.7 208 320C208 333.3 218.7 344 232 344L408 344C421.3 344 432 333.3 432 320C432 306.7 421.3 296 408 296L232 296z" />
  </svg>
);

export default function StudentDashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [studentInfo, setStudentInfo] = useState(user);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState("");
  const [queueInfo, setQueueInfo] = useState(null);
  const [queueRequesting, setQueueRequesting] = useState(false);
  const [queueMessage, setQueueMessage] = useState("");
  const [balanceInfo, setBalanceInfo] = useState(null);
  const [activity, setActivity] = useState([]);
  const [activityError, setActivityError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchStudentData = async () => {
      const authConfig = { headers: { Authorization: `Bearer ${token}` } };
      const profileRequest = axios.get(
        `${API_BASE_URL}/students/my-profile.php`,
        authConfig,
      );
      const queueRequest = user?.lrn
        ? axios.get(
            `${API_BASE_URL}/students/queue-info.php?lrn=${encodeURIComponent(user.lrn)}`,
            authConfig,
          )
        : Promise.resolve(null);
      const balanceRequest = user?.lrn
        ? axios.get(
            `${API_BASE_URL}/students/balance-info.php?lrn=${encodeURIComponent(user.lrn)}`,
            authConfig,
          )
        : Promise.resolve(null);
      const activityRequest = axios.get(
        `${API_BASE_URL}/students/my-activity.php`,
        authConfig,
      );

      const [profileResult, queueResult, balanceResult, activityResult] = await Promise.allSettled([
        profileRequest,
        queueRequest,
        balanceRequest,
        activityRequest,
      ]);

      if (cancelled) return;

      if (profileResult.status === "fulfilled") {
        const profile = profileResult.value.data.profile;
        setStudentInfo({ ...user, ...profile });
        if (profile.id_photo_document_id) {
          try {
            const photoResponse = await axios.get(
              `${API_BASE_URL}/students/my-documents.php`,
              {
                params: { view: profile.id_photo_document_id },
                ...authConfig,
                responseType: "blob",
              },
            );
            if (!cancelled) {
              setUploadedPhotoUrl(URL.createObjectURL(photoResponse.data));
            }
          } catch (photoError) {
            if (photoError.response?.status === 401) logout();
            if (photoError.response?.status !== 401) {
              setError("Your uploaded ID photo could not be loaded.");
            }
          }
        }
      } else {
        if (profileResult.reason.response?.status === 401) logout();
        setError(
          profileResult.reason.response?.data?.message ||
            "Student information could not be loaded.",
        );
      }

      if (
        queueResult.status === "fulfilled" &&
        queueResult.value?.data?.success
      ) {
        setQueueInfo(queueResult.value.data.queue);
      }
      if (
        balanceResult.status === "fulfilled" &&
        balanceResult.value?.data?.success
      ) {
        setBalanceInfo(balanceResult.value.data.balance);
      }
      if (activityResult.status === "fulfilled") {
        setActivity(activityResult.value.data.activities || []);
      } else if (activityResult.reason.response?.status !== 401) {
        setActivityError("Recent activity could not be loaded.");
      }
      if (
        [queueResult, balanceResult, activityResult].some(
          (result) =>
            result.status === "rejected" &&
            result.reason.response?.status === 401,
        )
      ) {
        logout();
      }

      setLoading(false);
    };

    fetchStudentData();
    return () => {
      cancelled = true;
    };
  }, [token, user, logout]);

  useEffect(
    () => () => {
      if (uploadedPhotoUrl) URL.revokeObjectURL(uploadedPhotoUrl);
    },
    [uploadedPhotoUrl],
  );

  const handleEditProfile = () => {
    navigate("/student/edit-profile");
  };

  const handleRequestCertificate = () => {
    navigate("/request-document");
  };

  const handleViewBalance = () => {
    navigate(
      `/admin/print-balance?lrn=${encodeURIComponent(studentInfo?.lrn || "")}`,
    );
  };

  const handleRequestQueueNumber = async () => {
    if (queueRequesting) return;

    setQueueRequesting(true);
    setQueueMessage("");
    try {
      const response = await axios.post(
        `${API_BASE_URL}/students/generate-queue.php`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (!response.data?.success || !response.data.queue) {
        setQueueMessage(
          response.data?.message || "Could not request a new queue number.",
        );
        return;
      }

      setQueueInfo(response.data.queue);
      setQueueMessage(
        `New queue number ${response.data.queue.queue_number} is ready.`,
      );
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        logout();
        return;
      }
      setQueueMessage(
        requestError.response?.data?.message ||
          "Could not request a new queue number. Please try again.",
      );
    } finally {
      setQueueRequesting(false);
    }
  };

  if (loading) {
    return <div className="student-dashboard loading">Loading...</div>;
  }

  const photoUrl =
    uploadedPhotoUrl ||
    (studentInfo?.id_photo
      ? `${API_BASE_URL}/${studentInfo.id_photo.replace(/^\/+/, "")}`
      : null);

  return (
    <div className="student-dashboard">
      <StudentSidebar />
      <div className="student-content">
        <div className="dashboard-grid">
          <section className="card welcome-card">
            <div className="student-id-photo">
              {photoUrl ? (
                <img src={photoUrl} alt={`${studentInfo?.full_name} 2x2 ID`} />
              ) : (
                <div className="student-id-photo-placeholder" aria-hidden="true">
                  {studentInfo?.full_name?.charAt(0) || "S"}
                </div>
              )}
            </div>
            <div className="welcome-details">
              <p className="welcome-eyebrow">Student Portal</p>
              <h2>Welcome, {studentInfo?.full_name || "Student"}!</h2>
              <p>
                Learner Reference Number:{" "}
                <strong>{displayValue(studentInfo?.lrn)}</strong>
              </p>
              <p>
                Email: <strong>{displayValue(studentInfo?.email)}</strong>
              </p>
            </div>
          </section>

          <section className="card student-profile-card">
            <h3>Enrollment Information</h3>
            <div className="student-profile-sections">
              <div className="student-profile-section">
                <h4>Personal Information</h4>
                <dl className="student-profile-details">
                  <div><dt>Enrollment Type</dt><dd>{displayValue(studentInfo?.enrollment_type)}</dd></div>
                  <div><dt>First Name</dt><dd>{displayValue(studentInfo?.first_name)}</dd></div>
                  <div><dt>Middle Name</dt><dd>{displayValue(studentInfo?.middle_name)}</dd></div>
                  <div><dt>Last Name</dt><dd>{displayValue(studentInfo?.last_name)}</dd></div>
                  <div><dt>Extension Name</dt><dd>{displayValue(studentInfo?.extension_name)}</dd></div>
                  <div><dt>Birth Date</dt><dd>{displayValue(studentInfo?.birthday)}</dd></div>
                  <div><dt>Age</dt><dd>{displayValue(studentInfo?.age)}</dd></div>
                  <div><dt>Gender</dt><dd>{displayValue(studentInfo?.gender)}</dd></div>
                  <div><dt>Phone Number</dt><dd>{displayValue(studentInfo?.phone)}</dd></div>
                  <div><dt>Email Address</dt><dd>{displayValue(studentInfo?.email)}</dd></div>
                </dl>
              </div>

              <div className="student-profile-section">
                <h4>Academic Information</h4>
                <dl className="student-profile-details">
                  <div><dt>Year Level</dt><dd>{displayValue(studentInfo?.year_level)}</dd></div>
                  <div><dt>Strand</dt><dd>{displayValue(studentInfo?.strand)}</dd></div>
                  <div><dt>Classroom</dt><dd>{displayValue(studentInfo?.room)}</dd></div>
                  <div><dt>School Level</dt><dd>{displayValue(studentInfo?.level)}</dd></div>
                </dl>
              </div>

              <div className="student-profile-section">
                <h4>Address</h4>
                <dl className="student-profile-details">
                  <div><dt>Primary Address</dt><dd>{displayValue(studentInfo?.primary_address)}</dd></div>
                  <div><dt>Secondary Address</dt><dd>{displayValue(studentInfo?.secondary_address)}</dd></div>
                  <div><dt>Zip Code</dt><dd>{displayValue(studentInfo?.zip_code)}</dd></div>
                </dl>
              </div>

              <div className="student-profile-section">
                <h4>Parent or Guardian</h4>
                <dl className="student-profile-details">
                  <div><dt>Name</dt><dd>{displayValue(studentInfo?.parent_name)}</dd></div>
                  <div><dt>Phone Number</dt><dd>{displayValue(studentInfo?.parent_phone)}</dd></div>
                  <div><dt>Relationship</dt><dd>{displayValue(studentInfo?.parent_relationship)}</dd></div>
                  <div><dt>Address</dt><dd>{displayValue(studentInfo?.parent_address)}</dd></div>
                </dl>
              </div>
            </div>
          </section>

          {balanceInfo && (
            <div className="card balance-card">
              <h3>Account Balance</h3>
              <div className="balance-details">
                <p><span className="label">Total Fees:</span><span className="value">₱{Number(balanceInfo.total_fees).toFixed(2)}</span></p>
                {balanceInfo.remaining_balance !== undefined && (
                  <p><span className="label">Remaining:</span><span className="value">₱{Number(balanceInfo.remaining_balance).toFixed(2)}</span></p>
                )}
              </div>
            </div>
          )}

          <div className="card actions-card">
            <h3>Quick Actions</h3>
            <div className="action-buttons">
              <button onClick={handleEditProfile} className="btn-primary">
                <span className="action-icon"><AddProfileIcon /></span>
                Edit Profile
              </button>
              <button onClick={handleRequestCertificate} className="btn-primary">
                <span className="action-icon"><RequestDocumentIcon /></span>
                Request Document
              </button>
              <button onClick={() => navigate("/student/documents")} className="btn-primary">
                <span className="action-icon"><UploadDocumentIcon /></span>
                Upload Documents
              </button>
              {studentInfo?.lrn && (
                <button onClick={handleViewBalance} className="btn-primary">
                  <span className="action-icon"><StatementIcon /></span>
                  View Statement of Account
                </button>
              )}
              <button onClick={() => navigate("/student/grades")} className="btn-primary">
                <span className="action-icon"><GradesIcon /></span>
                View Grades
              </button>
            </div>
          </div>

          {queueInfo && (
            <div className="card queue-card">
              <h3>Queue Status</h3>
              <div className="queue-details">
                <p><span className="label">Queue Number:</span><span className="value">{queueInfo.queue_number}</span></p>
                <p><span className="label">Status:</span><span className={`status ${(queueInfo.status || "Active").toLowerCase()}`}>{queueInfo.status || "Active"}</span></p>
                <p><span className="label">Enrollment Date:</span><span className="value">{new Date(queueInfo.enrollment_date).toLocaleDateString()}</span></p>
                {["used", "settled"].includes(queueInfo.status?.toLowerCase()) && (
                  <button
                    className="btn-primary"
                    onClick={handleRequestQueueNumber}
                    disabled={queueRequesting}
                  >
                    {queueRequesting
                      ? "Requesting..."
                      : "Request New Queue Number"}
                  </button>
                )}
                {queueMessage && (
                  <p className="queue-message" role="status">
                    {queueMessage}
                  </p>
                )}
              </div>
              {queueInfo.queue_history?.length > 0 && (
                <section className="queue-history" aria-label="Queue number history">
                  <h4>Queue Number History</h4>
                  <ul>
                    {queueInfo.queue_history.map((queue) => {
                      const status = queue.status || "Active";
                      return (
                        <li key={queue.id_sched}>
                          <span className="queue-history-number">
                            {queue.queue_number}
                          </span>
                          <span className={`status ${status.toLowerCase()}`}>
                            {status}
                          </span>
                          <time dateTime={queue.enrollment_date}>
                            {new Date(queue.enrollment_date).toLocaleDateString()}
                          </time>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}
            </div>
          )}

          <div className="card info-card">
            <h3>Important Information</h3>
            <ul>
              <li>Use your registered email to log in to your account</li>
              <li>Change your default password after first login</li>
              <li>Keep your personal information up to date</li>
              <li>Contact administration for account-related concerns</li>
            </ul>
          </div>

          <section className="card student-activity-card">
            <h3>Recent Activity</h3>
            {activityError ? (
              <p className="error-message">{activityError}</p>
            ) : activity.length === 0 ? (
              <p>No profile or document activity yet.</p>
            ) : (
              <ul className="student-activity-list">
                {activity.slice(0, 10).map((item) => (
                  <li key={item.id}>
                    <span>{item.activity}</span>
                    <time dateTime={item.created_at}>
                      {new Date(item.created_at).toLocaleString()}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
}
