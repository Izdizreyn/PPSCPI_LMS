import { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import CashierLayout from "../components/CashierLayout";
import "./Cashier.css";
import { CashierIcon } from "../components/AdminIcons";

const cashierLinks = [{ to: "/cashier", label: "Dashboard", icon: <CashierIcon /> }];

export default function Cashier() {
  const { token } = useAuth();
  const [lrn, setLrn] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [selectedFee, setSelectedFee] = useState(null);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [remarks, setRemarks] = useState("");

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const searchStudent = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.get(
        `${API_BASE_URL}/cashier/search-student.php?lrn=${lrn}`,
        authHeaders,
      );
      setData(res.data);

      if (!res.data.balance) {
        await axios.post(
          `${API_BASE_URL}/cashier/update-balance.php`,
          {
            student_id: res.data.student.id,
            student_type: res.data.student.type,
            year_level: res.data.student.year_level,
            strand: res.data.student.strand,
            student_lrn: res.data.student.lrn,
          },
          authHeaders,
        );
        const refreshed = await axios.get(
          `${API_BASE_URL}/cashier/search-student.php?lrn=${lrn}`,
          authHeaders,
        );
        setData(refreshed.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Student not found.");
      setData(null);
    }
  };

  const backToSearch = () => {
    setData(null);
    setLrn("");
    setError("");
    setSelectedFee(null);
    setAmount("");
    setReceiptNumber("");
    setRemarks("");
  };

  const selectFee = (fee) => {
    setSelectedFee(fee.fee_id);
    setAmount(fee.remaining.toFixed(2));
    setRemarks(`Payment for ${fee.fee_name}`);
  };

  const clearSelectedFee = () => {
    setSelectedFee(null);
    setAmount("");
    setRemarks("");
  };

  const recordPayment = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${API_BASE_URL}/cashier/record-payment.php`,
        {
          balance_id: data.balance.balance_id,
          amount,
          payment_method: paymentMethod,
          receipt_number: receiptNumber,
          remarks,
          fee_id: selectedFee,
        },
        authHeaders,
      );
      alert("Payment recorded successfully.");
      setSelectedFee(null);
      setAmount("");
      setReceiptNumber("");
      setRemarks("");
      const refreshed = await axios.get(
        `${API_BASE_URL}/cashier/search-student.php?lrn=${lrn}`,
        authHeaders,
      );
      setData(refreshed.data);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to record payment.");
    }
  };

  return (
    <CashierLayout links={cashierLinks}>
      <div className="cashier-container">
        {!data ? (
          <div className="card">
            <div className="card-header">
              <h5>Search Student</h5>
            </div>
            <div className="card-body">
              <form onSubmit={searchStudent} className="search-form">
                <input
                  type="text"
                  value={lrn}
                  onChange={(e) => setLrn(e.target.value)}
                  placeholder="Learner Reference Number (LRN)"
                  required
                />
                <button type="submit" className="btn-primary">
                  Search
                </button>
              </form>
              {error && <p className="error-text">{error}</p>}
            </div>
          </div>
        ) : (
          <>
            <button className="back-btn" onClick={backToSearch}>
              ← Back to Search
            </button>

            <div className="card">
              <div className="card-header">
                <h5>Student Information</h5>
              </div>
              <div className="card-body">
                <p>
                  <strong>Name:</strong> {data.student.full_name}
                </p>
                <p>
                  <strong>Year Level:</strong> {data.student.year_level}
                </p>
                {data.student.strand && (
                  <p>
                    <strong>Strand:</strong> {data.student.strand}
                  </p>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h5>Fee Breakdown & Payments</h5>
              </div>
              <div className="card-body">
                {data.fee_statuses.map((fee) => (
                  <div
                    key={fee.fee_id}
                    className={`fee-item ${fee.is_paid ? "paid" : "clickable"} ${selectedFee === fee.fee_id ? "selected" : ""}`}
                    onClick={() => !fee.is_paid && selectFee(fee)}
                  >
                    <span>
                      {fee.fee_name} <small>({fee.category_name})</small>
                    </span>
                    <span
                      className={fee.is_paid ? "paid-label" : "unpaid-label"}
                    >
                      {fee.is_paid
                        ? `Paid · ₱ ${fee.amount_due.toFixed(2)}`
                        : `Pay ₱ ${fee.remaining.toFixed(2)}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {data.balance && (
              <div className="card">
                <div className="card-header">
                  <h5>Balance Information</h5>
                </div>
                <div className="card-body">
                  <p>
                    <strong>Total Fees:</strong> ₱{" "}
                    {Number(data.balance.total_fees).toFixed(2)}
                  </p>
                  <p>
                    <strong>Paid Amount:</strong> ₱{" "}
                    {Number(data.balance.paid_amount).toFixed(2)}
                  </p>
                  <p>
                    <strong>Remaining Balance:</strong> ₱{" "}
                    {Number(data.balance.remaining_balance).toFixed(2)}
                  </p>

                  <h6>Record New Payment</h6>

                  {selectedFee && (
                    <div className="selected-fee-badge active">
                      Paying: {remarks} — ₱ {amount}
                      <button
                        type="button"
                        className="btn-clear"
                        onClick={clearSelectedFee}
                      >
                        Clear
                      </button>
                    </div>
                  )}

                  <form onSubmit={recordPayment} className="payment-form">
                    <input
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Amount"
                      required
                    />
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <option value="Cash">Cash</option>
                      <option value="Online Payment">Online Payment</option>
                    </select>
                    <input
                      type="text"
                      value={receiptNumber}
                      onChange={(e) => setReceiptNumber(e.target.value)}
                      placeholder="Receipt Number"
                      required
                    />
                    <input
                      type="text"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Remarks"
                      required
                    />
                    <button type="submit" className="btn-primary">
                      Record Payment
                    </button>
                  </form>
                </div>
              </div>
            )}

            {data.payment_history.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h5>Payment History</h5>
                </div>
                <div className="card-body">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>Receipt #</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.payment_history.map((p) => (
                        <tr key={p.transaction_id}>
                          <td>{new Date(p.payment_date).toLocaleString()}</td>
                          <td>₱ {Number(p.amount).toFixed(2)}</td>
                          <td>{p.payment_method}</td>
                          <td>{p.receipt_number}</td>
                          <td>{p.remarks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </CashierLayout>
  );
}
