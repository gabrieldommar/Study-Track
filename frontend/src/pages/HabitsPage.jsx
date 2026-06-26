import { useState } from "react";

import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import Spinner from "../components/ui/Spinner";
import { EmptyState, ErrorMessage } from "../components/ui/Feedback";
import HabitForm from "../components/habits/HabitForm";
import HabitCard from "../components/habits/HabitCard";
import { useHabits } from "../hooks/useHabits";

export default function HabitsPage() {
  const { habits, loading, error, create, remove } = useHabits();
  const [formOpen, setFormOpen] = useState(false);

  const handleSubmit = async (payload) => {
    await create(payload);
    setFormOpen(false);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-ink">Hábitos</h1>
          <p className="text-sm text-muted">Definí hábitos y registrá su cumplimiento.</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>+ Nuevo hábito</Button>
      </div>

      {loading ? (
        <Spinner label="Cargando hábitos..." />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : !habits.length ? (
        <EmptyState
          message="Todavía no creaste hábitos."
          action={<Button onClick={() => setFormOpen(true)}>Crear el primero</Button>}
        />
      ) : (
        <div className="space-y-3">
          {habits.map((h) => (
            <HabitCard key={h.id} habit={h} onDelete={remove} />
          ))}
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Nuevo hábito">
        <HabitForm onSubmit={handleSubmit} onCancel={() => setFormOpen(false)} />
      </Modal>
    </div>
  );
}
