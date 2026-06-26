import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";

import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { ErrorMessage } from "../components/ui/Feedback";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/authService";

export default function LoginPage() {
  const { persistSession } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState("login"); // 'login' | 'register'
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [loading, setLoading] = useState(false);

  const isRegister = mode === "register";
  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (isRegister && !form.name.trim()) errs.name = "Ingresá tu nombre";
    if (!form.email.trim()) errs.email = "Ingresá tu email";
    if (form.password.length < 6) errs.password = "Mínimo 6 caracteres";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);
    setErrors({});
    setLoading(true);
    try {
      const payload = isRegister ? form : { email: form.email, password: form.password };
      const session = await authService[isRegister ? "register" : "login"](payload);
      persistSession(session);
      navigate("/", { replace: true });
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (credentialResponse) => {
    setApiError(null);
    setLoading(true);
    try {
      const session = await authService.googleLogin(credentialResponse.credential);
      persistSession(session);
      navigate("/", { replace: true });
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl text-ink">StudyTrack</h1>
          <p className="mt-1 text-sm text-muted">Tu tiempo de estudio, con intención.</p>
        </div>

        <div className="card p-6">
          <div className="mb-5 flex rounded-xl bg-paper p-1">
            {["login", "register"].map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setErrors({}); setApiError(null); }}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                  mode === m ? "bg-surface text-ink shadow-soft" : "text-muted"
                }`}
              >
                {m === "login" ? "Ingresar" : "Crear cuenta"}
              </button>
            ))}
          </div>

          {apiError && <div className="mb-4"><ErrorMessage message={apiError} /></div>}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {isRegister && (
              <Input id="name" label="Nombre" value={form.name} onChange={setField("name")} error={errors.name} />
            )}
            <Input id="email" label="Email" type="email" value={form.email} onChange={setField("email")} error={errors.email} />
            <Input id="password" label="Contraseña" type="password" value={form.password} onChange={setField("password")} error={errors.password} />
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Procesando..." : isRegister ? "Crear cuenta" : "Ingresar"}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-line" /> o <span className="h-px flex-1 bg-line" />
          </div>

          <div className="flex justify-center">
            <GoogleLogin onSuccess={handleGoogle} onError={() => setApiError("No se pudo iniciar sesión con Google")} />
          </div>
        </div>
      </div>
    </div>
  );
}
