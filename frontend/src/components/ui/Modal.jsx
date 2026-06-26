import { useEffect } from "react";

// Modal accesible básico: cierra con Escape y clic en el backdrop.
export default function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h3 className="mb-4 text-xl text-ink">{title}</h3>}
        {children}
      </div>
    </div>
  );
}
