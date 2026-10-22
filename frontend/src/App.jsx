import { Route, Routes } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { PrivateRoute } from "./components/PrivateRoute";
import { AdminRoute } from "./components/AdminRoute";
import { Home } from "./pages/Home";
import { EstimationForm } from "./pages/EstimationForm";
import { EstimationResult } from "./pages/EstimationResult";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Account } from "./pages/Account";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminUsers } from "./pages/admin/AdminUsers";
import { AdminModels } from "./pages/admin/AdminModels";
import { AdminCache } from "./pages/admin/AdminCache";

export function App() {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/estimation" element={<EstimationForm />} />
          <Route path="/estimation/resultat" element={<EstimationResult />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Réservé aux utilisateurs connectés */}
          <Route element={<PrivateRoute />}>
            <Route path="/compte" element={<Account />} />
          </Route>

          {/* Réservé au rôle ADMINISTRATEUR */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="utilisateurs" element={<AdminUsers />} />
              <Route path="modeles" element={<AdminModels />} />
              <Route path="cache" element={<AdminCache />} />
            </Route>
          </Route>
        </Routes>
      </main>
      <footer className="border-t border-asphalt-200 py-6 text-center text-xs text-asphalt-400">
        AutoPredict — estimation basée sur des annonces réelles du marché marocain de l'occasion.
      </footer>
    </div>
  );
}
