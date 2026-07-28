import CashierSidebar from "./CashierSidebar";
import "./CashierLayout.css";

export default function CashierLayout({ children, links }) {
  return (
    <div className="cashier-layout">
      <CashierSidebar links={links} />
      <div className="cashier-content">{children}</div>
    </div>
  );
}