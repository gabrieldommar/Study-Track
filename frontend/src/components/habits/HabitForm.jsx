import { useState } from "react";

import Button from "../ui/Button";
import Input from "../ui/Input";
import { ErrorMessage } from "../ui/Feedback";
import SchedulePicker, { isScheduleValid } from "../scheduling/SchedulePicker";

export default function HabitForm({ onSubmit, onCancel }) {
  const [name, setName] = useState("");
  const [schedule, setSchedule] = useState({ recurring_weekly: true, days: [] });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!name.trim()) errs.name = "Ingresá un nombre";
    if (!isScheduleValid(schedule)) errs.schedule = "Agendá al menos un día con horas > 0";
    if (Object.keys(errs).length) return setErrors(errs);
    setErrors({});
    setApiError(null);
    setSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), ...schedule });
    } catch (err) {
      setApiError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {apiError && <ErrorMessage message={apiError} />}

      <Input id="habitName" label="Nombre del hábito" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />

      <SchedulePicker onChange={setSchedule} error={errors.schedule} />

      <div className="flex justify-between pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={submitting}>{submitting ? "Guardando..." : "Guardar hábito"}</Button>
      </div>
    </form>
  );
}
