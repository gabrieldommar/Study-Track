import { api } from "./apiClient";

// Construye el query string ignorando valores vacíos.
function qs(params) {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "");
  if (!entries.length) return "";
  return "?" + new URLSearchParams(entries).toString();
}

// Endpoints de hábitos y sus registros (ver memory/api_contract.md).
export const habitService = {
  list: () => api.get("/habits"),
  create: (data) => api.post("/habits", data),
  update: (id, data) => api.put(`/habits/${id}`, data),
  remove: (id) => api.del(`/habits/${id}`),
  logs: (id, range = {}) => api.get(`/habits/${id}/logs${qs(range)}`),
  addLog: (id, data) => api.post(`/habits/${id}/logs`, data),
  removeLog: (logId) => api.del(`/habits/logs/${logId}`),
  stats: (period) => api.get(`/habits/stats${qs({ period })}`),
};
