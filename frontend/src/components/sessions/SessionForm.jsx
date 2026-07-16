import { useState } from "react";

import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";
import { ErrorMessage } from "../ui/Feedback";
import SchedulePicker, { isScheduleValid } from "../scheduling/SchedulePicker";

const NEW_CATEGORY = "__new__";

// Alta de un plan de estudio: categoría + tema + días agendados (misma lógica que hábitos).
export default function SessionForm({ categories, onCreateCategory, onSubmit, onCancel }) {
  const [form, setForm] = useState({ category_id: "", topic: "" });
  const [schedule, setSchedule] = useState({ recurring_weekly: true, days: [] });
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    setCreatingCategory(true);
    setApiError(null);
    try {
      const created = await onCreateCategory({ name: newCategoryName.trim() });
      setForm((f) => ({ ...f, category_id: String(created.id) }));
      setNewCategoryName("");
    } catch (err) {
      setApiError(err.message);
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.category_id || form.category_id === NEW_CATEGORY) errs.category_id = "Elegí una categoría";
    if (!form.topic.trim()) errs.topic = "Ingresá el tema";
    if (!isScheduleValid(schedule)) errs.schedule = "Agendá al menos un día con horas > 0";
    if (Object.keys(errs).length) return setErrors(errs);
    setErrors({});
    setApiError(null);
    setSubmitting(true);
    try {
      await onSubmit({ topic: form.topic.trim(), category_id: Number(form.category_id), ...schedule });
    } catch (err) {
      setApiError(err.message);
      setSubmitting(false);
    }
  };

  const showNewCategory = form.category_id === NEW_CATEGORY;

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {apiError && <ErrorMessage message={apiError} />}

      <Select id="category" label="Categoría" value={form.category_id} onChange={setField("category_id")} error={errors.category_id}>
        <option value="">Seleccioná...</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.full_path}</option>
        ))}
        <option value={NEW_CATEGORY}>+ Crear nueva categoría</option>
      </Select>

      {showNewCategory && (
        <div className="flex items-end gap-2">
          <Input
            id="newCategory"
            label="Nombre de la categoría"
            placeholder="Ej. Matemáticas > Álgebra"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="flex-1"
          />
          <Button type="button" variant="ghost" onClick={handleCreateCategory} disabled={creatingCategory}>
            {creatingCategory ? "..." : "Crear"}
          </Button>
        </div>
      )}

      <Input id="topic" label="Tema de estudio" value={form.topic} onChange={setField("topic")} error={errors.topic} />

      <SchedulePicker onChange={setSchedule} error={errors.schedule} />

      <div className="flex justify-between pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={submitting}>{submitting ? "Guardando..." : "Guardar plan"}</Button>
      </div>
    </form>
  );
}
