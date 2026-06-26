import { NavLink, Outlet } from "react-router-dom";

import Button from "../ui/Button";
import { useAuth } from "../../context/AuthContext";

// Rutas de la navegación principal. Las páginas se completan en bloques posteriores.
const NAV = [
  { to: "/", label: "Agenda", end: true },
  { to: "/sessions", label: "Estudio" },
  { to: "/habits", label: "Hábitos" },
  { to: "/stats", label: "Estadísticas" },
];

export default function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-8">
            <span className="font-display text-xl text-ink">StudyTrack</span>
            <nav className="hidden items-center gap-1 sm:flex">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                      isActive ? "bg-primary-soft text-primary-dark" : "text-muted hover:text-ink"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted sm:inline">{user?.name}</span>
            <Button variant="ghost" onClick={logout} className="py-1.5">Salir</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
