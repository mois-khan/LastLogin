import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import Candle from "../../components/ui/Candle.jsx";

export default function Login() {
  const { user, login, register } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState("register");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");

  if (user) { nav("/app/assistant"); return null; }

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      if (mode === "register") await register(form.email, form.password, form.name);
      else await login(form.email, form.password);
      nav("/app/assistant");
    } catch (e2) {
      setErr(e2.response?.data?.error || "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Hero — the thesis: a single candle, kept burning */}
      <div className="flex flex-col justify-center items-center px-10 py-16 border-b md:border-b-0 md:border-r border-line">
        <Candle size={88} />
        <h1 className="mt-8 text-4xl md:text-5xl text-center leading-tight max-w-md">
          Your digital life, handled — so your family doesn't have to.
        </h1>
        <p className="mt-5 text-mist max-w-sm text-center">
          Prepare your accounts, crypto and final words while you're here.
          We pass them on only after your death is verified — gently, and in your own voice.
        </p>
      </div>

      {/* Auth */}
      <div className="flex items-center justify-center px-10 py-16">
        <form onSubmit={submit} className="card w-full max-w-sm">
          <div className="flex gap-2 mb-6">
            <button type="button" onClick={() => setMode("register")}
              className={`pill ${mode === "register" ? "bg-ink text-paper" : "bg-paper text-mist"}`}>Create account</button>
            <button type="button" onClick={() => setMode("login")}
              className={`pill ${mode === "login" ? "bg-ink text-paper" : "bg-paper text-mist"}`}>Sign in</button>
          </div>
          {mode === "register" && (
            <div className="mb-4">
              <label className="label">Your name</label>
              <input className="field" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
          )}
          <div className="mb-4">
            <label className="label">Email</label>
            <input className="field" type="email" required value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="mb-5">
            <label className="label">Password</label>
            <input className="field" type="password" required value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          {err && <p className="text-sm text-ember mb-3">{err}</p>}
          <button className="btn-ember w-full">{mode === "register" ? "Begin" : "Sign in"}</button>
        </form>
      </div>
    </div>
  );
}
