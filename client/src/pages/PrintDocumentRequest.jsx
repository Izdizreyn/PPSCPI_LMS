import { useState, useEffect } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import logo from "../assets/logo.png";
import watermarkLogo from "../assets/translogo.png";
import "./PrintDocumentRequest.css";

export default function PrintDocumentRequest() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/students/document-request.php?id=${id}`,
        );
        setData(res.data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Request not found or not approved.",
        );
      }
    })();
  }, [id]);

  if (error) return <div className="cert-error">{error}</div>;
  if (!data) return <div className="cert-error">Loading...</div>;

  const { title, paragraphs, certificate_number } = data;

  return (
    <div className="print-certificate">
      <button className="print-button" onClick={() => window.print()}>
        Print Certificate
      </button>

      <div className="certificate-container">
        <img src={watermarkLogo} alt="School Watermark" className="watermark" />

        <div className="certificate-header">
  <div className="header-row">
    <img src={logo} alt="School Logo" className="corner-logo" />
    <div className="header-text">
      <h1 className="school-name">
        POWER PURPLE COLLEGE OF SOUTHERN PHILIPPINES, INC.
      </h1>
      <p className="school-address">Tuazon Subd., Polomolok, South Cotabato</p>
    </div>
  </div>
</div>

        <h2 className="certificate-title">{title}</h2>

        <div className="certificate-body">
          {paragraphs.map((p, i) => (
            <p key={i} dangerouslySetInnerHTML={{ __html: p }} />
          ))}
        </div>

        <div className="certificate-footer">
          <div className="signature-line"></div>
          <p className="signature-name">Principal / School Head</p>
          <p className="signature-title">
            Power Purple College of Southern Philippines, Inc.
          </p>
        </div>

        <div className="certificate-number">
          Certificate No: {certificate_number}
        </div>
      </div>
    </div>
  );
}