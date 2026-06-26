import { api } from "./apiClient";

// Construye el query string ignorando valores vacíos.
function qs(params) {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "");
  if (!entries.length) return "";
  return "?" + new URLSearchParams(entries).toString();
}

// Endpoints de sesiones de estudio y calendario (ver memory/api_contract.md).
export const sessionService = {
  list: (filters = {}) => api.get(`/sessions${qs(filters)}`),
  create: (data) => api.post("/sessions", data),
  update: (id, data) => api.put(`/sessions/${id}`, data),
  remove: (id) => api.del(`/sessions/${id}`),
  stats: (period, categoryId) => api.get(`/sessions/stats${qs({ period, category_id: categoryId })}`),
  calendar: (from, to) => api.get(`/calendar${qs({ from, to })}`),
};
