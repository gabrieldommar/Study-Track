import { useState } from "react";

import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";
import { ErrorMessage } from "../ui/Feedback";
import { toISODate } from "../../utils/dates";

const NEW_CATEGORY = "__new__";

// Formulario de registro de sesión en 2 pasos (requisito del prompt: máx. 2 pasos).
// Paso 1: categoría (con opción de crear nueva) + tema.
// Paso 2: fecha + horas planeadas + (opcional) horas completadas.
export default function SessionForm({ categories, onCreateCategory, onSubmit, onCancel }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    category_id: "",
    topic: "",
    date: toISODate(new Date()),
    planned_hours: "",
    completed_hours: "",
    completed: false,
  });
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const setField = (key) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
  };

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

  const validateStep1 = () => {
    const errs = {};
    if (!form.category_id || form.category_id === NEW_CATEGORY) errs.category_id = "Elegí una categoría";
    if (!form.topic.trim()) errs.topic = "Ingresá el tema";
    return errs;
  };

  const validateStep2 = () => {
    const errs = {};
    if (!form.date) errs.date = "Elegí una fecha";
    if (!(Number(form.planned_hours) > 0)) errs.planned_hours = "Horas > 0";
    if (form.completed && !(Number(form.completed_hours) > 0)) errs.completed_hours = "Horas > 0";
    return errs;
  };

  const next = () => {
    const errs = validateStep1();
    if (Object.keys(errs).length) return setErrors(errs);
    setErrors({});
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateStep2();
    if (Object.keys(errs).length) return setErrors(errs);
    setErrors({});
    setApiError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        topic: form.topic.trim(),
        category_id: Number(form.category_id),
        date: form.date,
        planned_hours: Number(form.planned_hours),
        status: form.completed ? "completed" : "planned",
        ...(form.completed ? { completed_hours: Number(form.completed_hours) } : {}),
      });
    } catch (err) {
      setApiError(err.message);
      setSubmitting(false);
    }
  };

  const showNewCategory = form.category_id === NEW_CATEGORY;

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {apiError && <ErrorMessage message={apiError} />}

      <div className="flex items-center gap-2 text-xs text-muted">
        <span className={step === 1 ? "font-medium text-primary" : ""}>1 · Qué</span>
        <span className="h-px w-6 bg-line" />
        <span className={step === 2 ? "font-medium text-primary" : ""}>2 · Cuándo</span>
      </div>

      {step === 1 ? (
        <>
          <Select
            id="category"
            label="Categoría"
            value={form.category_id}
            onChange={setField("category_id")}
            error={errors.category_id}
          >
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

          <div className="flex justify-between pt-2">
            <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
            <Button type="button" onClick={next}>Siguiente</Button>
          </div>
        </>
      ) : (
        <>
          <Input id="date" label="Fecha" type="date" value={form.date} onChange={setField("date")} error={errors.date} />
          <Input id="planned" label="Horas planeadas" type="number" min="0" step="0.5" value={form.planned_hours} onChange={setField("planned_hours")} error={errors.planned_hours} />

          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={form.completed} onChange={setField("completed")} className="accent-primary" />
            Ya completé esta sesión
          </label>

          {form.completed && (
            <Input id="completed" label="Horas completadas" type="number" min="0" step="0.5" value={form.completed_hours} onChange={setField("completed_hours")} error={errors.completed_hours} />
          )}

          <div className="flex justify-between pt-2">
            <Button type="button" variant="ghost" onClick={() => setStep(1)}>Atrás</Button>
            <Button type="submit" disabled={submitting}>{submitting ? "Guardando..." : "Guardar sesión"}</Button>
          </div>
        </>
      )}
    </form>
  );
}
