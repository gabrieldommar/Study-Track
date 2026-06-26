import { api } from "./apiClient";

// Endpoints de categorías (ver memory/api_contract.md).
export const categoryService = {
  list: () => api.get("/categories"),
  create: (data) => api.post("/categories", data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  remove: (id) => api.del(`/categories/${id}`),
};
