// Botón del sistema de diseño. Variantes: primary, accent, ghost.
const VARIANTS = {
  primary: "bg-primary text-white hover:bg-primary-dark",
  accent: "bg-accent text-white hover:opacity-90",
  ghost: "bg-transparent text-ink border border-line hover:bg-paper",
};

export default function Button({ variant = "primary", className = "", disabled, children, ...props }) {
  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium
        transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
