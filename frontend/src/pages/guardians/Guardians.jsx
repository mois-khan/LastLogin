import { useEffect, useState } from "react";
import { UserPlus, ShieldCheck, Check, KeyRound } from "lucide-react";
import { api } from "../../lib/api.js";

const CATEGORIES = ["account", "bank", "crypto", "insurance", "loan", "document", "subscription"];

export default function Guardians() {
  const [state, setState] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", walletAddress: "" });
  const [saving, setSaving] = useState(false);
  const [sq, setSq] = useState({ question: "", answer: "" });
  const [sqSaved, setSqSaved] = useState(false);

  const load = async () => setState((await api.get("/guardians")).data);
  useEffect(() => {
    load().catch(() => setState({ guardians: [], confirmed: 0, threshold: 2 }));
    api.get("/guardians/security").then((r) => setSq((s) => ({ ...s, question: r.data.question || "" }))).catch(() => {});
  }, []);

  const add = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try { await api.post("/guardians", form); setForm({ name: "", email: "", walletAddress: "" }); await load(); }
    finally { setSaving(false); }
  };

  const toggleAccess = async (g, cat) => {
    const has = (g.access || []).includes(cat);
    const access = has ? g.access.filter((c) => c !== cat) : [...(g.access || []), cat];
    setState((s) => ({ ...s, guardians: s.guardians.map((x) => (x._id === g._id ? { ...x, access } : x)) })); // optimistic
    await api.post(`/guardians/${g._id}/access`, { access });
  };

  const saveSq = async () => {
    await api.post("/guardians/security", { question: sq.question, answer: sq.answer });
    setSq((s) => ({ ...s, answer: "" })); setSqSaved(true); setTimeout(() => setSqSaved(false), 2500);
  };

  const guardians = state?.guardians ?? [];
  const confirmed = state?.confirmed ?? 0;
  const threshold = state?.threshold ?? 2;

  return (
    <div className="rise">
      <h1 className="font-display text-title mb-1">Trusted guardians</h1>
      <p className="text-mist mb-8 max-w-xl">Choose 3 people. Any 2 together can confirm your passing — and each one only sees what you allow.</p>

      <div className="card max-w-xl mb-6 flex items-center gap-3">
        <span className="grid place-items-center h-9 w-9 rounded-xl bg-sage/12 text-sage-600 shrink-0"><ShieldCheck size={18} /></span>
        <div className="flex-1 h-2 rounded-full bg-line overflow-hidden">
          <div className="h-full bg-sage transition-all duration-500" style={{ width: `${Math.min(100, (confirmed / threshold) * 100)}%` }} />
        </div>
        <span className="text-sm text-mist whitespace-nowrap">{confirmed} of {threshold} confirmed</span>
      </div>

      {/* Security question */}
      <div className="card max-w-xl mb-6">
        <h3 className="text-h mb-1 flex items-center gap-2"><KeyRound size={18} className="text-ember" /> Security question <span className="text-xs text-mist font-body">· optional</span></h3>
        <p className="text-sm text-mist mb-4">An extra layer — a guardian must answer this (plus their emailed code) to confirm.</p>
        <input className="field mb-2" placeholder="e.g. What was the name of our first pet?" value={sq.question}
          onChange={(e) => setSq({ ...sq, question: e.target.value })} />
        <div className="flex gap-2">
          <input className="field" placeholder="Answer (stored hashed)" value={sq.answer}
            onChange={(e) => setSq({ ...sq, answer: e.target.value })} />
          <button className="btn-secondary shrink-0" onClick={saveSq} disabled={!sq.question.trim() || !sq.answer.trim()}>
            {sqSaved ? <><Check size={15} /> Saved</> : "Save"}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-1 self-start">
          <h3 className="text-h mb-4 flex items-center gap-2"><UserPlus size={18} className="text-ember" /> Add a guardian</h3>
          <label className="label">Name</label>
          <input className="field mb-3" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <label className="label">Email</label>
          <input className="field mb-3" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <label className="label">Wallet address</label>
          <input className="field mb-4 mono text-xs" value={form.walletAddress}
            onChange={(e) => setForm({ ...form, walletAddress: e.target.value })} placeholder="0x…" />
          <button className="btn-primary w-full" onClick={add} disabled={saving || !form.name.trim()}>{saving ? "Adding…" : "Add guardian"}</button>
        </div>

        <div className="card lg:col-span-2">
          {state === null ? (
            <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-20" />)}</div>
          ) : guardians.length ? (
            <ul className="divide-y divide-line">
              {guardians.map((g) => (
                <li key={g._id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <span className="grid place-items-center h-9 w-9 rounded-full bg-paper border border-line text-sm text-mist shrink-0">{g.name?.[0] || "?"}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm">{g.name}</span>
                      {g.email && <span className="block text-xs text-mist truncate">{g.email}</span>}
                    </span>
                    {g.confirmed
                      ? <span className="pill bg-sage/15 text-sage-600"><Check size={13} /> confirmed</span>
                      : <span className="pill bg-paper text-mist border border-line">standing by</span>}
                  </div>
                  <div className="mt-3 ml-12">
                    <p className="text-xs text-mist mb-1.5">Can access:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {CATEGORIES.map((c) => {
                        const on = (g.access || []).includes(c);
                        return (
                          <button key={c} onClick={() => toggleAccess(g, c)}
                            className={`chip text-xs !py-1 ${on ? "border-sage bg-sage/10 text-sage-600" : "border-line text-mist hover:border-mist/50"}`}>
                            {on && <Check size={11} />} {c}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-12 text-mist text-sm">No guardians yet. Add three people you trust on the left.</div>
          )}
        </div>
      </div>
    </div>
  );
}
