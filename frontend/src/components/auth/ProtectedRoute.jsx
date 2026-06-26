import { Navigate } from "react-router-dom";

import Spinner from "../ui/Spinner";
import { useAuth } from "../../context/AuthContext";

// Bloquea rutas privadas: espera la validación inicial del token y redirige si no hay sesión.
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <div className="min-h-screen"><Spinner label="Cargando sesión..." /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}
