import { NavLink, Outlet } from "react-router-dom";

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? "bg-ink-800 text-white" : "text-ink-600 hover:bg-asphalt-50"
  }`;

export function AdminLayout() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      <p className="mb-1 text-sm font-medium uppercase tracking-widest text-taxi-500">Back-office</p>
      <h1 className="mb-6 font-display text-3xl font-bold text-ink-800">Administration</h1>
      <div className="mb-6 flex flex-wrap gap-2">
        <NavLink to="/admin" end className={linkClass}>
          Tableau de bord
        </NavLink>
        <NavLink to="/admin/utilisateurs" className={linkClass}>
          Utilisateurs
        </NavLink>
        <NavLink to="/admin/modeles" className={linkClass}>
          Modèle ML
        </NavLink>
        <NavLink to="/admin/cache" className={linkClass}>
          Cache
        </NavLink>
      </div>
      <Outlet />
    </div>
  );
}
