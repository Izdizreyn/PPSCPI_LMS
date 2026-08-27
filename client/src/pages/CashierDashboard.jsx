import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import CashierLayout from "../components/CashierLayout";
import { cashierLinks } from "../config/navLinks";
import "./CashierDashboard.css";

export default function CashierDashboard() {
  const { token } = useAuth();
  const [paymentRecords, setPaymentRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPaymentRecords = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/cashier/payment-records.php`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPaymentRecords(response.data.records || []);
      setError("");
    } catch {
      setError("Payment records could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const initialLoadId = window.setTimeout(loadPaymentRecords, 0);
    const intervalId = window.setInterval(loadPaymentRecords, 10000);
    return () => {
      window.clearTimeout(initialLoadId);
      window.clearInterval(intervalId);
    };
  }, [loadPaymentRecords]);

  return (
    <CashierLayout links={cashierLinks}>
      <main className="cashier-dashboard">
        <div className="cashier-dashboard-card">
          <header className="cashier-dashboard-header">
            <div>
              <h1>Cashier Dashboard</h1>
            </div>
            <div className="cashier-dashboard-actions">
              <Link className="cashier-action primary" to="/cashier/search">Search Student</Link>
              <Link className="cashier-action secondary" to="/cashier/queue">Queue Numbers</Link>
            </div>
          </header>

          <section className="cashier-records">
            <div className="card-header">
              <h2>All Student Payments</h2>
            </div>
            <div className="card-body">
              {error ? <p className="error-text">{error}</p> : null}
              {loading ? <p>Loading payment records...</p> : null}
              {!loading && !error && paymentRecords.length === 0 ? (
                <p>No student payments have been recorded yet.</p>
              ) : null}
              {!loading && paymentRecords.length > 0 ? (
                <div className="cashier-records-table-wrap">
                  <table>
                    <thead>
                      <tr><th>Date</th><th>LRN</th><th>Student</th><th>Amount</th><th>Receipt #</th><th>Remaining</th></tr>
                    </thead>
                    <tbody>
                      {paymentRecords.map((record) => (
                        <tr key={record.transaction_id}>
                          <td>{new Date(record.payment_date).toLocaleString()}</td>
                          <td>{record.lrn}</td>
                          <td>{record.full_name || "Unknown student"}</td>
                          <td>₱ {Number(record.amount).toFixed(2)}</td>
                          <td>{record.receipt_number}</td>
                          <td>₱ {Number(record.remaining_balance).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </main>
    </CashierLayout>
  );
}
