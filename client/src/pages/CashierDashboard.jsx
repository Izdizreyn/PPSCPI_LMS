import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import CashierLayout from "../components/CashierLayout";
import { cashierLinks } from "../config/navLinks";
import TablePagination from "../components/TablePagination";
import "./CashierDashboard.css";

const PAGE_SIZE = 5;

export default function CashierDashboard() {
  const { token } = useAuth();
  const [paymentRecords, setPaymentRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  const loadPaymentRecords = useCallback(async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/cashier/payment-records.php`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setPaymentRecords(response.data.records || []);
      setPage((currentPage) =>
        Math.min(
          currentPage,
          Math.max(1, Math.ceil((response.data.records || []).length / PAGE_SIZE)),
        ),
      );
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

  const pageCount = Math.max(1, Math.ceil(paymentRecords.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleRecords = paymentRecords.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <CashierLayout links={cashierLinks}>
      <main className="cashier-dashboard">
        <div className="cashier-dashboard-card">
          <header className="cashier-dashboard-header">
            <div>
              <p className="cashier-overview-eyebrow">Power Purple LMS</p>
              <h1>Cashier Dashboard</h1>
            </div>
            <div className="cashier-dashboard-actions">
              <Link className="cashier-action primary" to="/cashier/search">
                Search Student
              </Link>
              <Link className="cashier-action secondary" to="/cashier/queue">
                Queue Numbers
              </Link>
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
                      <tr>
                        <th>Date</th>
                        <th>LRN</th>
                        <th>Student</th>
                        <th>Amount</th>
                        <th>Receipt #</th>
                        <th>Remaining</th>
                        <th>Statement</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRecords.map((record) => (
                        <tr key={record.transaction_id}>
                          <td data-label="Date">
                            {new Date(record.payment_date).toLocaleDateString()}
                          </td>
                          <td data-label="LRN">{record.lrn}</td>
                          <td data-label="Student">{record.full_name || "Unknown student"}</td>
                          <td data-label="Amount">₱ {Number(record.amount).toFixed(2)}</td>
                          <td data-label="Receipt #">{record.receipt_number}</td>
                          <td data-label="Remaining">
                            ₱ {Number(record.remaining_balance).toFixed(2)}
                          </td>
                          <td data-label="Statement">
                            <Link
                              className="cashier-statement-link"
                              to={`/admin/print-balance?lrn=${encodeURIComponent(record.lrn)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View SOA
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <TablePagination
                    page={currentPage}
                    pageSize={PAGE_SIZE}
                    totalItems={paymentRecords.length}
                    onPageChange={(nextPage) =>
                      setPage(Math.min(Math.max(nextPage, 1), pageCount))
                    }
                  />
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </main>
    </CashierLayout>
  );
}
