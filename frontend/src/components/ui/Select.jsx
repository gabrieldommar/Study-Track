// Selector del sistema de diseño con label y error opcional.
export default function Select({ label, error, id, children, className = "", ...props }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="field-label">
          {label}
        </label>
      )}
      <select
        id={id}
        className={`w-full rounded-xl border bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition
          focus:border-primary focus:ring-2 focus:ring-primary/15
          ${error ? "border-danger" : "border-line"}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
