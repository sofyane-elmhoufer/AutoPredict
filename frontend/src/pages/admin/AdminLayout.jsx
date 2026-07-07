import { NavLink, Outlet } from "react-router-dom";

const linkClass = ({ isActive }) =>
  `rounded px-3 py-2 text-sm ${isActive ? "bg-primary-500 text-white" : "hover:bg-gray-100"}`;

export function AdminLayout() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold text-primary-700">Administration</h1>
      <div className="mb-6 flex gap-2">
        <NavLink to="/admin" end className={linkClass}>
          Dashboard
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
