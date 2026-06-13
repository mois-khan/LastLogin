import { useEffect, useState } from "react";
import { api } from "../../lib/api.js";

const TYPES = ["account", "crypto", "document", "subscription"];
const ICON = { account: "👤", crypto: "🪙", document: "📄", subscription: "🔁" };

export default function Vault() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ type: "account", label: "", secret: "" });
  const [fp, setFp] = useState("");

  const load = async () => setItems((await api.get("/vault")).data);
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.label) return;
    await api.post("/vault", form);
    setForm({ ...form, label: "", secret: "" });
    load();
  };
  const anchor = async () => setFp((await api.get("/vault/fingerprint")).data.fingerprint);

  return (
    <div>
      <h1 className="text-3xl mb-1">Your vault</h1>
      <p className="text-mist mb-6">Everything is encrypted before it leaves your device. We never see the contents.</p>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="card md:col-span-1">
          <h3 className="text-lg mb-3">Add something</h3>
          <label className="label">Type</label>
          <select className="field mb-3" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
          <label className="label">Label</label>
          <input className="field mb-3" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          <label className="label">Secret (encrypted)</label>
          <input className="field mb-4" value={form.secret} onChange={(e) => setForm({ ...form, secret: e.target.value })} />
          <button className="btn-ember w-full" onClick={add}>Add to vault</button>
        </div>

        <div className="card md:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg">{items.length} items</h3>
            <button className="btn-ghost" onClick={anchor}>Anchor integrity hash</button>
          </div>
          <ul className="divide-y divide-line">
            {items.map((i) => (
              <li key={i.id} className="py-3 flex items-center gap-3">
                <span>{ICON[i.type]}</span>
                <span className="flex-1">{i.label}</span>
                <span className="pill bg-paper text-mist">{i.type}</span>
              </li>
            ))}
          </ul>
          {fp && (
            <div className="mt-4 rounded-xl bg-paper border border-line p-3">
              <p className="text-xs text-mist mb-1">Tamper-proof fingerprint (store on-chain):</p>
              <p className="mono text-xs break-all text-ink">{fp}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
