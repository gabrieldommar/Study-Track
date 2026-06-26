// Mensajes de estado: error y vacío. Componentes pequeños reutilizables.
export function ErrorMessage({ message }) {
  return (
    <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
      {message}
    </div>
  );
}

export function EmptyState({ message, action }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line py-12 text-center">
      <p className="text-sm text-muted">{message}</p>
      {action}
    </div>
  );
}
