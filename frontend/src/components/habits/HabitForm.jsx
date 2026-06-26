import { useState } from "react";

import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";
import { ErrorMessage } from "../ui/Feedback";

export default function HabitForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({ name: "", frequency: "daily", target_duration: "" });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Ingresá un nombre";
    if (!(Number(form.target_duration) > 0)) errs.target_duration = "Horas > 0";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);
    setErrors({});
    setApiError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        name: form.name.trim(),
        frequency: form.frequency,
        target_duration: Number(form.target_duration),
      });
    } catch (err) {
      setApiError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {apiError && <ErrorMessage message={apiError} />}

      <Input id="habitName" label="Nombre del hábito" value={form.name} onChange={setField("name")} error={errors.name} />

      <Select id="frequency" label="Frecuencia" value={form.frequency} onChange={setField("frequency")}>
        <option value="daily">Diaria</option>
        <option value="weekly">Semanal</option>
      </Select>

      <Input
        id="target"
        label="Horas objetivo por ocurrencia"
        type="number"
        min="0"
        step="0.5"
        value={form.target_duration}
        onChange={setField("target_duration")}
        error={errors.target_duration}
      />

      <div className="flex justify-between pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={submitting}>{submitting ? "Guardando..." : "Guardar hábito"}</Button>
      </div>
    </form>
  );
}
