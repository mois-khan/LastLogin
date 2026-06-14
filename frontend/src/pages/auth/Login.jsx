import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { ShieldCheck, Users, AudioLines, ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import Candle from "../../components/ui/Candle.jsx";

const TRUST = [
  { Icon: ShieldCheck, text: "Encrypted, and released only after a death is verified." },
  { Icon: Users, text: "No one acts alone — 2 of your 3 guardians must agree." },
  { Icon: AudioLines, text: "Your final words, delivered in your own voice." },
];

export default function Login() {
  const { user, login, register } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState("register");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [agreed, setAgreed] = useState(false);

  if (user) return <Navigate to="/app/assistant" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      if (mode === "register") await register(form.email, form.password, form.name, form.phone);
      else await login(form.email, form.password);
      nav("/app/assistant");
    } catch (e2) {
      setErr(e2.response?.data?.error || "Something went wrong. Try again.");
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Hero — the thesis */}
      <div className="relative flex flex-col justify-center px-8 sm:px-14 py-16 border-b lg:border-b-0 lg:border-r border-line">
        <div className="max-w-md rise">
          <Candle size={76} />
          <h1 className="mt-9 font-display text-hero leading-[1.04]">
            Your digital life, handed on with care.
          </h1>
          <p className="mt-5 text-graphite text-lg leading-relaxed max-w-sm">
            Prepare your accounts, documents and final words while you're here.
            They're passed on only after your death is verified — gently, and in your own voice.
          </p>

          <ul className="mt-10 space-y-4">
            {TRUST.map(({ Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <span className="mt-0.5 grid place-items-center h-8 w-8 shrink-0 rounded-lg bg-sage/12 text-sage-600">
                  <Icon size={17} strokeWidth={2} />
                </span>
                <span className="text-sm text-graphite leading-relaxed">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Auth */}
      <div className="flex flex-col items-center justify-center px-8 sm:px-14 py-16">
        <form onSubmit={submit} className="w-full max-w-sm rise">
          <h2 className="font-display text-title mb-1">
            {mode === "register" ? "Begin your estate" : "Welcome back"}
          </h2>
          <p className="text-sm text-mist mb-7">
            {mode === "register" ? "A few minutes now spares your family months later." : "Sign in to continue."}
          </p>

          <div className="inline-flex p-1 mb-7 rounded-full bg-line/50">
            {["register", "login"].map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${mode === m ? "bg-card text-ink shadow-card" : "text-graphite hover:text-ink"}`}>
                {m === "register" ? "Create account" : "Sign in"}
              </button>
            ))}
          </div>

          {mode === "register" && (
            <>
              <div className="mb-4">
                <label className="label">Your name</label>
                <input className="field" value={form.name} autoComplete="name"
                  onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="mb-4">
                <label className="label">Phone <span className="text-mist font-body">· lets a guardian find your estate by number</span></label>
                <input className="field" type="tel" value={form.phone} autoComplete="tel" placeholder="+91…"
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </>
          )}
          <div className="mb-4">
            <label className="label">Email</label>
            <input className="field" type="email" required value={form.email} autoComplete="email"
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="mb-6">
            <label className="label">Password</label>
            <input className="field" type="password" required value={form.password}
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>

          {mode === "register" && (
            <label className="flex items-start gap-3 mb-5 p-3 rounded-xl bg-paper border border-line cursor-pointer">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 accent-ember" />
              <span className="text-xs text-graphite leading-relaxed">
                I understand that <span className="text-ink">nothing activates while I'm alive</span>, that I'm opting in freely, and that releasing my estate requires <span className="text-ink">2 of my 3 guardians</span> and a verified certificate.
              </span>
            </label>
          )}

          {err && <p className="text-sm text-ember mb-4">{err}</p>}

          <button className="btn-primary w-full" disabled={busy || (mode === "register" && !agreed)}>
            {busy ? "One moment…" : (mode === "register" ? "Begin" : "Sign in")}
            {!busy && <ArrowRight size={16} strokeWidth={2.25} />}
          </button>
        </form>
        <p className="mt-8 text-sm text-mist text-center">
          Here as a guardian?{" "}
          <a href="/access" className="text-ember hover:underline font-medium">Open what was left for you →</a>
        </p>
      </div>
    </div>
  );
}
