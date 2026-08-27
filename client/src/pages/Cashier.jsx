import { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import CashierLayout from "../components/CashierLayout";
import "./Cashier.css";
import { cashierLinks } from "../config/navLinks";

export default function Cashier() {
  const { token } = useAuth();
  const [lrn, setLrn] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [selectedFees, setSelectedFees] = useState([]);
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
    setSelectedFees([]);
    setReceiptNumber("");
    setRemarks("");
  };

  const toggleFee = (fee) => {
    setSelectedFees((current) => {
      const alreadySelected = current.some((selected) => selected.fee_id === fee.fee_id);
      if (alreadySelected) {
        return current.filter((selected) => selected.fee_id !== fee.fee_id);
      }

      return [...current, { ...fee, amount: fee.remaining.toFixed(2) }];
    });
  };

  const updateFeeAmount = (feeId, value) => {
    setSelectedFees((current) => current.map((fee) => (
      fee.fee_id === feeId ? { ...fee, amount: value } : fee
    )));
  };

  const clearSelectedFees = () => {
    setSelectedFees([]);
    setRemarks("");
  };

  const recordPayment = async (e) => {
    e.preventDefault();
    if (selectedFees.length === 0) {
      setError("Select at least one unpaid fee before recording a payment.");
      return;
    }

    try {
      await axios.post(
        `${API_BASE_URL}/cashier/record-payment.php`,
        {
          balance_id: data.balance.balance_id,
          amount: selectedFees.reduce((total, fee) => total + Number(fee.amount || 0), 0),
          payment_method: paymentMethod,
          receipt_number: receiptNumber,
          remarks,
          fee_id: selectedFees.length === 1 ? selectedFees[0].fee_id : null,
          payments: selectedFees.map((fee) => ({ fee_id: fee.fee_id, amount: Number(fee.amount) })),
        },
        authHeaders,
      );
      alert("Payment recorded successfully.");
      setSelectedFees([]);
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
                  <strong>LRN:</strong> {data.student.lrn}
                </p>
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
                    className={`fee-item ${fee.is_paid ? "paid" : "clickable"} ${selectedFees.some((selected) => selected.fee_id === fee.fee_id) ? "selected" : ""}`}
                    onClick={() => !fee.is_paid && toggleFee(fee)}
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

                  {selectedFees.length > 0 && (
                    <div className="selected-fees">
                      <div className="selected-fees-header">
                        <strong>Selected fees</strong>
                        <button type="button" className="btn-clear" onClick={clearSelectedFees}>Clear</button>
                      </div>
                      {selectedFees.map((fee) => (
                        <label className="selected-fee-row" key={fee.fee_id}>
                          <span>{fee.fee_name}</span>
                          <input
                            type="number"
                            min="0.01"
                            max={fee.remaining}
                            step="0.01"
                            value={fee.amount}
                            onChange={(e) => updateFeeAmount(fee.fee_id, e.target.value)}
                            required
                          />
                        </label>
                      ))}
                      <p className="selected-fee-total">
                        Total payment: ₱ {selectedFees.reduce((total, fee) => total + Number(fee.amount || 0), 0).toFixed(2)}
                      </p>
                    </div>
                  )}

                  <form onSubmit={recordPayment} className="payment-form">
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
                    <button type="submit" className="btn-primary" disabled={selectedFees.length === 0}>
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
