import "../styles/admin-dashboard.css";

export default function AdminDashboard() {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <p className="admin-logo">Proptee</p>
        <p className="">Admin workspace</p>
      </aside>
      <main className="admin-main">
        <h1>Admin Dashboard</h1>
        <p>Manage your users, properties and leads.</p>
      </main>
    </div>
  );
}
