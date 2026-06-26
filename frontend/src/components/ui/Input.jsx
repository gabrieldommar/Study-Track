// Campo de formulario con label y mensaje de error opcional.
export default function Input({ label, error, id, className = "", ...props }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="field-label">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full rounded-xl border bg-surface px-3.5 py-2.5 text-sm text-ink
          placeholder:text-muted/60 outline-none transition
          focus:border-primary focus:ring-2 focus:ring-primary/15
          ${error ? "border-danger" : "border-line"}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
