import AdminSidebar from "./AdminSidebar";
import "./AdminLayout.css";

export default function AdminLayout({ children, links }) {
  return (
    <div className="admin-layout">
      <AdminSidebar links={links} />
      <div className="admin-content">{children}</div>
    </div>
  );
}