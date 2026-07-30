import { useState, useEffect } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import logo from "../assets/logo.png";
import "./PrintCertificate.css";

export default function PrintCertificate() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/students/certificate.php?id=${id}`);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Certificate request not found or not approved.");
      }
    })();
  }, [id]);

  if (error) {
    return <div className="cert-error">{error}</div>;
  }

  if (!data) {
    return <div className="cert-error">Loading...</div>;
  }

  const { request, school, certificate_number, current_date, school_year } = data;

  return (
    <>
      <button className="print-button" onClick={() => window.print()}>
        Print Certificate
      </button>

      <div className="certificate-container">
        <img src={logo} alt="School Watermark" className="watermark" />

        <div className="certificate-header">
          <img src={logo} alt="School Logo" className="logo" />
          <h1 className="school-name">{school.school_name}</h1>
          <p className="school-address">{school.school_address}</p>
          <p className="school-address">{school.school_contact}</p>
        </div>

        <h2 className="certificate-title">CERTIFICATE OF ENROLLMENT</h2>

        <div className="certificate-body">
          <p>To Whom It May Concern:</p>
          <p>
            {"\u00A0".repeat(10)}This is to certify that{" "}
            <strong>{request.full_name.toUpperCase()}</strong> with Learner Reference
            Number (LRN) <strong>{request.lrn}</strong> is officially enrolled as a
            student of <strong>Power Purple College of Southern Philippines Inc.</strong>{" "}
            for the Academic Year <strong>{school_year}</strong>.
          </p>

          <p>
            This certification is issued upon the request of the above-named student
            for <strong>{request.purpose}</strong> and for whatever legal purpose it
            may serve.
          </p>

          <p>
            Issued this <strong>{current_date}</strong> at Power Purple College of
            Southern Philippines Inc., Tuazon Subdivision Poblacion, Polomolok,
            Philippines.
          </p>
        </div>

        <div className="certificate-footer">
          <div className="signature-line"></div>
          <p className="signature-name">
            {(school.principal_name || "SCHOOL PRINCIPAL").toUpperCase()}
          </p>
          <p className="signature-title">School Principal</p>
        </div>

        <div className="certificate-number">Certificate No: {certificate_number}</div>
      </div>
    </>
  );
}