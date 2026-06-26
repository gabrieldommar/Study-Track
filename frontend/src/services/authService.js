import { api } from "./apiClient";

// Endpoints de autenticación definidos en el contrato (no inventar otros).
export const authService = {
  register: (data) => api.post("/auth/register", data, { auth: false }),
  login: (data) => api.post("/auth/login", data, { auth: false }),
  googleLogin: (idToken) => api.post("/auth/google", { id_token: idToken }, { auth: false }),
  me: () => api.get("/auth/me"),
};
