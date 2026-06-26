// Indicador de carga reutilizable.
export default function Spinner({ label = "Cargando..." }) {
  return (
    <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-primary" />
      {label}
    </div>
  );
}
