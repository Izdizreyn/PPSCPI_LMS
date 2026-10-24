import { useState, useEffect } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import watermarkLogo from "../assets/translogo.png";
import "./PrintBalance.css";

export default function PrintBalance() {
  const [searchParams] = useSearchParams();
  const lrn = searchParams.get("lrn");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/students/balance-detail.php?lrn=${lrn}`,
        );
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Balance record not found.");
      }
    })();
  }, [lrn]);

  if (error) {
    return <div className="cert-error">{error}</div>;
  }

  if (!data) {
    return <div className="cert-error">Loading...</div>;
  }

  const {
    balance,
    transactions,
    fee_statuses: feeStatuses = [],
    student_name: studentName,
    lrn: statementLrn,
  } = data;

  return (
    <div className="print-balance">
      <button className="print-button" onClick={() => window.print()}>
        Print Statement
      </button>

      <div className="balance-container">
        <img src={watermarkLogo} alt="School Watermark" className="watermark" />

        <div className="balance-header">
          <h1 className="school-name">Statement of Account</h1>
          {studentName && <p className="student-name">{studentName}</p>}
          {statementLrn && <p className="student-lrn">LRN: {statementLrn}</p>}
        </div>

        <h2 className="section-title">Fee Breakdown &amp; Payments</h2>
        {feeStatuses.length > 0 ? (
          <table className="fee-status-table">
            <thead>
              <tr>
                <th>Fee Item</th>
                <th>Amount Due</th>
                <th>Amount Paid</th>
                <th>Remaining</th>
              </tr>
            </thead>
            <tbody>
              {feeStatuses.map((fee) => (
                <tr key={fee.fee_id}>
                  <td>{fee.fee_name}</td>
                  <td>₱ {Number(fee.amount_due).toFixed(2)}</td>
                  <td>₱ {Number(fee.amount_paid).toFixed(2)}</td>
                  <td>₱ {Number(fee.remaining).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="no-payment">No fee information available.</p>
        )}

        {balance ? (
          <>
            <h2 className="section-title">Account Summary</h2>
            <table className="balance-table">
              <tbody>
                <tr>
                  <td>
                    <strong>Total Fees:</strong>
                  </td>
                  <td align="right">
                    ₱ {Number(balance.total_fees).toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Paid Amount:</strong>
                  </td>
                  <td align="right">
                    ₱ {Number(balance.paid_amount).toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td>
                    <strong>Remaining Balance:</strong>
                  </td>
                  <td align="right">
                    ₱ {Number(balance.remaining_balance).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>

            {transactions && transactions.length > 0 && (
              <>
                <h3 className="section-title">Payment History</h3>
                <table className="transaction-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Receipt #</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t.transaction_id}>
                        <td>{new Date(t.payment_date).toLocaleDateString()}</td>
                        <td>₱ {Number(t.amount).toFixed(2)}</td>
                        <td>{t.payment_method}</td>
                        <td>{t.receipt_number}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </>
        ) : feeStatuses.length > 0 ? (
          <p className="no-payment">
            No payments have been recorded yet.
          </p>
        ) : (
          <p className="no-payment">
            No financial information found for this student.
          </p>
        )}
      </div>
    </div>
  );
}
