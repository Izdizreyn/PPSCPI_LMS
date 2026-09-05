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

  const { balance, transactions, fee_breakdown, student_name } = data;

  return (
    <div className="print-balance">
      <button className="print-button" onClick={() => window.print()}>
        Print Statement
      </button>

      <div className="balance-container">
        <img src={watermarkLogo} alt="School Watermark" className="watermark" />

        <div className="balance-header">
          <h1 className="school-name">Statement of Account</h1>
          {student_name && <p className="student-name">{student_name}</p>}
        </div>

        {balance ? (
          <>
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
        ) : fee_breakdown ? (
          <p className="no-payment">
            No payments recorded yet. Total fees due: ₱{" "}
            {Number(fee_breakdown.total).toFixed(2)}
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
