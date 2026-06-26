import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import Spinner from "../components/ui/Spinner";
import { EmptyState, ErrorMessage } from "../components/ui/Feedback";
import { useStats } from "../hooks/useStats";

const COLORS = { planned: "#C56B4A", completed: "#2F6F5E" };

// Suma una propiedad numérica sobre una lista de filas.
const sum = (rows, key) => rows.reduce((acc, r) => acc + (r[key] || 0), 0);

const pct = (done, target) => (target > 0 ? Math.round((done / target) * 100) : 0);

export default function StatsPage() {
  const [period, setPeriod] = useState("week");
  const { study, habits, loading, error } = useStats(period);

  const studyData = study.map((r) => ({
    name: r.category_path,
    Planeado: r.total_planned,
    Completado: r.total_completed,
  }));
  const habitData = habits.map((r) => ({
    name: r.name,
    Objetivo: r.total_target,
    Hecho: r.total_done,
  }));

  const studyDone = sum(study, "total_completed");
  const studyPlanned = sum(study, "total_planned");
  const habitDone = sum(habits, "total_done");
  const habitTarget = sum(habits, "total_target");

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl text-ink">Estadísticas</h1>
          <p className="text-sm text-muted">Tu progreso de estudio y hábitos.</p>
        </div>
        <div className="inline-flex rounded-lg bg-primary-soft p-1">
          {["week", "month"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                period === p ? "bg-surface text-primary-dark shadow-sm" : "text-muted hover:text-ink"
              }`}
            >
              {p === "week" ? "Semana" : "Mes"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Spinner label="Cargando estadísticas..." />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <SummaryCard label="Horas estudiadas" value={`${studyDone}h`} hint={`de ${studyPlanned}h planeadas`} />
            <SummaryCard label="Cumplimiento estudio" value={`${pct(studyDone, studyPlanned)}%`} />
            <SummaryCard label="Cumplimiento hábitos" value={`${pct(habitDone, habitTarget)}%`} hint={`${habitDone}h / ${habitTarget}h`} />
          </div>

          <ChartCard title="Estudio por categoría">
            {studyData.length ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={studyData} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7E1D8" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "#6F6A63", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#6F6A63", fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Planeado" fill={COLORS.planned} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Completado" fill={COLORS.completed} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="No hay sesiones en este período." />
            )}
          </ChartCard>

          <ChartCard title="Hábitos: objetivo vs cumplido">
            {habitData.length ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={habitData} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7E1D8" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: "#6F6A63", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#6F6A63", fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Objetivo" fill={COLORS.planned} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Hecho" fill={COLORS.completed} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="No hay registros de hábitos en este período." />
            )}
          </ChartCard>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, hint }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl text-ink">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="card p-4">
      <p className="mb-4 font-medium text-ink">{title}</p>
      {children}
    </div>
  );
}
