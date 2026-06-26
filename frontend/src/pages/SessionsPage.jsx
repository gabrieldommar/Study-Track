import { useState } from "react";

import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import Spinner from "../components/ui/Spinner";
import { EmptyState, ErrorMessage } from "../components/ui/Feedback";
import SessionForm from "../components/sessions/SessionForm";
import SessionCard from "../components/sessions/SessionCard";
import { useSessions } from "../hooks/useSessions";
import { useCategories } from "../hooks/useCategories";

export default function SessionsPage() {
  const { sessions, loading, error, create, remove } = useSessions();
  const { categories, create: createCategory } = useCategories();
  const [formOpen, setFormOpen] = useState(false);

  const handleSubmit = async (payload) => {
    await create(payload);
    setFormOpen(false);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-ink">Estudio</h1>
          <p className="text-sm text-muted">Registrá sesiones planeadas y completadas.</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>+ Nueva sesión</Button>
      </div>

      {loading ? (
        <Spinner label="Cargando sesiones..." />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : !sessions.length ? (
        <EmptyState
          message="Todavía no registraste sesiones de estudio."
          action={<Button onClick={() => setFormOpen(true)}>Crear la primera</Button>}
        />
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <SessionCard key={s.id} session={s} onDelete={remove} />
          ))}
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Nueva sesión de estudio">
        <SessionForm
          categories={categories}
          onCreateCategory={createCategory}
          onSubmit={handleSubmit}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>
    </div>
  );
}
