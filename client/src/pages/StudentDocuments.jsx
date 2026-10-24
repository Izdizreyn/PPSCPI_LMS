import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import StudentSidebar from "../components/StudentSidebar";
import "./StudentDashboard.css";
import "./StudentDocuments.css";

const formatFileSize = (size) => {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const documentCategories = [
  { value: "id_photo", label: "2x2 ID Photo" },
  { value: "birth_certificate", label: "Birth Certificate" },
  { value: "report_card", label: "Report Card" },
  { value: "form_137", label: "Form 137" },
  { value: "good_morale", label: "Certificate of Good Morale" },
  { value: "certificate_of_enrollment", label: "Certificate of Enrollment" },
  { value: "transcript", label: "Transcript of Records" },
  { value: "other", label: "Other Document" },
];

export default function StudentDocuments() {
  const { token, logout } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [enrollmentDocuments, setEnrollmentDocuments] = useState([]);
  const [category, setCategory] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadDocuments = useCallback(async () => {
    setError("");
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [documentsResponse, profileResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/students/my-documents.php`, { headers }),
        axios.get(`${API_BASE_URL}/students/my-profile.php`, { headers }),
      ]);
      setDocuments(documentsResponse.data.documents || []);
      setEnrollmentDocuments(
        profileResponse.data.profile.enrollment_documents || [],
      );
    } catch (err) {
      if (err.response?.status === 401) logout();
      setError(
        err.response?.data?.message ||
          "Your documents could not be loaded. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [token, logout]);

  useEffect(() => {
    const loadId = window.setTimeout(loadDocuments, 0);
    return () => window.clearTimeout(loadId);
  }, [loadDocuments]);

  const handleUpload = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!selectedFile) {
      setError("Choose a PDF, JPEG, or PNG document to upload.");
      return;
    }

    const payload = new FormData();
    payload.append("document", selectedFile);
    payload.append("category", category);
    setUploading(true);
    const form = event.currentTarget;

    try {
      const response = await axios.post(
        `${API_BASE_URL}/students/my-documents.php`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setMessage(response.data.message);
      setSelectedFile(null);
      setCategory("");
      form.reset();
      await loadDocuments();
    } catch (err) {
      if (err.response?.status === 401) logout();
      setError(
        err.response?.data?.message ||
          "The document could not be uploaded. Please try again.",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleView = async (event, document) => {
    event.preventDefault();
    setError("");
    const viewWindow = window.open("about:blank", "_blank");
    if (!viewWindow) {
      setError("Allow pop-ups to view your document.");
      return;
    }

    try {
      const response = await axios.get(
        `${API_BASE_URL}/students/my-documents.php`,
        {
          params: { view: document.id },
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        },
      );
      const documentUrl = window.URL.createObjectURL(response.data);
      viewWindow.location.href = documentUrl;
      window.setTimeout(() => window.URL.revokeObjectURL(documentUrl), 60000);
    } catch (err) {
      viewWindow.close();
      if (err.response?.status === 401) logout();
      setError("This document could not be opened.");
    }
  };

  const uploadedCategories = new Set(documents.map((document) => document.category));
  const displayedDocuments = [
    ...enrollmentDocuments
      .filter((document) => !uploadedCategories.has(document.category))
      .map((document) => ({ ...document, source: "enrollment" })),
    ...documents.map((document) => ({
      ...document,
      label:
        documentCategories.find((item) => item.value === document.category)
          ?.label || "Other Document",
      source: "uploaded",
    })),
  ];

  return (
    <div className="student-dashboard">
      <StudentSidebar />
      <main className="student-content student-documents-page">
        <h1>My Documents</h1>
        <p className="student-documents-intro">
          Upload a document by category. Uploading to an existing category
          replaces the previous file in that category.
        </p>

        {error && <div className="student-documents-alert error">{error}</div>}
        {message && <div className="student-documents-alert success">{message}</div>}

        <section className="card student-upload-card">
          <h2>Upload a Document</h2>
          <p>Accepted file types: PDF, JPEG, or PNG. Maximum file size: 10 MB.</p>
          <form onSubmit={handleUpload}>
            <label htmlFor="student-document-category">Document type</label>
            <select
              id="student-document-category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              required
            >
              <option value="">Choose a document type</option>
              {documentCategories.map((documentCategory) => (
                <option
                  key={documentCategory.value}
                  value={documentCategory.value}
                >
                  {documentCategory.label}
                </option>
              ))}
            </select>
            <label htmlFor="student-document-file">Choose a file</label>
            <input
              id="student-document-file"
              type="file"
              accept={
                category === "id_photo"
                  ? ".jpg,.jpeg,.png,image/jpeg,image/png"
                  : ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              }
              onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
            />
            {selectedFile && (
              <p className="student-selected-file">{selectedFile.name}</p>
            )}
            <button className="btn-primary" type="submit" disabled={uploading}>
              {uploading ? "Uploading..." : "Upload Document"}
            </button>
          </form>
        </section>

        <section className="card student-documents-card">
          <h2>Uploaded Documents</h2>
          {loading ? (
            <p>Loading documents...</p>
          ) : displayedDocuments.length === 0 ? (
            <p>No documents have been uploaded yet.</p>
          ) : (
            <ul className="student-document-list">
              {displayedDocuments.map((document) => (
                <li key={`${document.source}-${document.id || document.url}`}>
                  <div>
                    <strong>{document.label}</strong>
                    <small>
                      {document.source === "uploaded"
                        ? `${document.original_name} · ${formatFileSize(Number(document.file_size))} · ${new Date(document.uploaded_at).toLocaleString()}`
                        : "Submitted with enrollment"}
                    </small>
                  </div>
                  {document.source === "uploaded" ? (
                    <a
                      href={`${API_BASE_URL}/students/my-documents.php?view=${document.id}`}
                      onClick={(event) => handleView(event, document)}
                    >
                      View document
                    </a>
                  ) : (
                    <a
                      href={`${API_BASE_URL}/${document.url.replace(/^\/+/, "")}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View document
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
