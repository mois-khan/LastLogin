import { useEffect, useState } from "react";
import { api } from "../../lib/api.js";

export default function Guardians() {
  const [state, setState] = useState({ guardians: [], confirmed: 0, threshold: 2 });
  const [form, setForm] = useState({ name: "", email: "", walletAddress: "" });

  const load = async () => setState((await api.get("/guardians")).data);
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.name) return;
    await api.post("/guardians", form);
    setForm({ name: "", email: "", walletAddress: "" }); load();
  };

  return (
    <div>
      <h1 className="text-3xl mb-1">Trusted guardians</h1>
      <p className="text-mist mb-6">Choose 3 people. Any 2 together can confirm your passing — no single person can act alone.</p>

      <div className="card max-w-xl mb-6">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-line overflow-hidden">
            <div className="h-full bg-sage transition-all"
              style={{ width: `${Math.min(100, (state.confirmed / state.threshold) * 100)}%` }} />
          </div>
          <span className="text-sm text-mist">{state.confirmed} of {state.threshold} confirmations</span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg mb-3">Add a guardian</h3>
          <label className="label">Name</label>
          <input className="field mb-3" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <label className="label">Email</label>
          <input className="field mb-3" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <label className="label">Wallet address</label>
          <input className="field mb-4 mono text-xs" value={form.walletAddress}
            onChange={(e) => setForm({ ...form, walletAddress: e.target.value })} placeholder="0x…" />
          <button className="btn-ember w-full" onClick={add}>Add guardian</button>
        </div>
        <div className="card md:col-span-2">
          <ul className="divide-y divide-line">
            {state.guardians.map((g) => (
              <li key={g._id} className="py-3 flex items-center gap-3">
                <span className="flex-1">{g.name} <span className="text-mist text-sm">· {g.email}</span></span>
                <span className={`pill ${g.confirmed ? "bg-sage/15 text-sage" : "bg-paper text-mist"}`}>
                  {g.confirmed ? "confirmed" : "standing by"}
                </span>
              </li>
            ))}
            {!state.guardians.length && <li className="py-6 text-mist text-sm">No guardians yet.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
