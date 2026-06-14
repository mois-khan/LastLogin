import { useEffect, useState } from "react";
import {
  UserPlus, ShieldCheck, Check, KeyRound, Phone, Wallet, SlidersHorizontal,
  ChevronDown, FileText, Loader2,
} from "lucide-react";
import { api } from "../../lib/api.js";

export default function Guardians() {
  const [state, setState] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", walletAddress: "" });
  const [saving, setSaving] = useState(false);
  const [sq, setSq] = useState({ question: "", answer: "" });
  const [sqSaved, setSqSaved] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [config, setConfig] = useState(null); // { assets, files } for openId
  const [loadingCfg, setLoadingCfg] = useState(false);

  const load = async () => setState((await api.get("/guardians")).data);
  useEffect(() => {
    load().catch(() => setState({ guardians: [], confirmed: 0, threshold: 2 }));
    api.get("/guardians/security").then((r) => setSq((s) => ({ ...s, question: r.data.question || "" }))).catch(() => {});
  }, []);

  const add = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try { await api.post("/guardians", form); setForm({ name: "", email: "", phone: "", walletAddress: "" }); await load(); }
    finally { setSaving(false); }
  };

  const saveSq = async () => {
    await api.post("/guardians/security", { question: sq.question, answer: sq.answer });
    setSq((s) => ({ ...s, answer: "" })); setSqSaved(true); setTimeout(() => setSqSaved(false), 2500);
  };

  const openConfig = async (g) => {
    if (openId === g._id) { setOpenId(null); setConfig(null); return; }
    setOpenId(g._id); setConfig(null); setLoadingCfg(true);
    try { setConfig((await api.get(`/guardians/${g._id}/config`)).data); }
    finally { setLoadingCfg(false); }
  };

  // Per-guardian grant - flip one asset/file and persist this guardian's full grant list.
  const toggleAsset = async (assetId) => {
    const assets = config.assets.map((a) => (a.id === assetId ? { ...a, granted: !a.granted } : a));
    setConfig((c) => ({ ...c, assets }));
    await api.post(`/guardians/${openId}/access`, { assetAccess: assets.filter((a) => a.granted).map((a) => a.id) });
  };
  const toggleFile = async (fileId) => {
    const files = config.files.map((f) => (f.id === fileId ? { ...f, granted: !f.granted } : f));
    setConfig((c) => ({ ...c, files }));
    await api.post(`/guardians/${openId}/access`, { fileAccess: files.filter((f) => f.granted).map((f) => f.id) });
  };

  const guardians = state?.guardians ?? [];
  const confirmed = state?.confirmed ?? 0;
  const threshold = state?.threshold ?? 2;

  return (
    <div className="rise">
      <h1 className="font-display text-title mb-1">Trusted guardians</h1>
      <p className="text-mist mb-8 max-w-xl">Choose people you trust. Any 2 together can confirm your passing - and each one sees only the assets you grant them.</p>

      <div className="card max-w-xl mb-6 flex items-center gap-3">
        <span className="grid place-items-center h-9 w-9 rounded-xl bg-sage/12 text-sage-600 shrink-0"><ShieldCheck size={18} /></span>
        <div className="flex-1 h-2 rounded-full bg-line overflow-hidden">
          <div className="h-full bg-sage transition-all duration-500" style={{ width: `${Math.min(100, (confirmed / threshold) * 100)}%` }} />
        </div>
        <span className="text-sm text-mist whitespace-nowrap">{confirmed} of {threshold} confirmed</span>
      </div>

      {/* Security question */}
      <div className="card max-w-xl mb-6">
        <h3 className="text-h mb-1 flex items-center gap-2"><KeyRound size={18} className="text-graphite" /> Security question <span className="text-xs text-mist font-body">· optional</span></h3>
        <p className="text-sm text-mist mb-4">An extra layer - a guardian must answer this (plus their emailed code) to confirm.</p>
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
        {/* Add */}
        <div className="card lg:col-span-1 self-start">
          <h3 className="text-h mb-4 flex items-center gap-2"><UserPlus size={18} className="text-graphite" /> Add a guardian</h3>
          <label className="label">Name</label>
          <input className="field mb-3" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <label className="label">Email</label>
          <input className="field mb-3" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="they@example.com" />
          <label className="label flex items-center gap-1.5"><Phone size={12} /> Phone number</label>
          <input className="field mb-3" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91…" />
          <label className="label flex items-center gap-1.5"><Wallet size={12} /> Ethereum wallet address <span className="text-mist font-body">· optional</span></label>
          <input className="field mb-4 mono text-xs" value={form.walletAddress}
            onChange={(e) => setForm({ ...form, walletAddress: e.target.value })} placeholder="0x…" />
          <button className="btn-primary w-full" onClick={add} disabled={saving || !form.name.trim()}>{saving ? "Adding…" : "Add guardian"}</button>
        </div>

        {/* List + per-guardian config */}
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
                      <span className="block text-xs text-mist truncate">{[g.email, g.phone].filter(Boolean).join(" · ") || "no contact yet"}</span>
                    </span>
                    {g.confirmed
                      ? <span className="pill bg-sage/15 text-sage-600"><Check size={13} /> confirmed</span>
                      : <span className="pill bg-paper text-mist border border-line">standing by</span>}
                    <button className="btn-secondary btn-sm" onClick={() => openConfig(g)}>
                      <SlidersHorizontal size={13} /> Access
                      <ChevronDown size={13} className={`transition ${openId === g._id ? "rotate-180" : ""}`} />
                    </button>
                  </div>

                  {openId === g._id && (
                    <div className="mt-4 ml-12 rounded-xl bg-paper border border-line p-4 rise">
                      <p className="text-xs text-mist mb-3">These are the assets marked <span className="text-sage-600">Visible / Transfer</span> in your vault - toggle which ones {g.name} receives. Deletion-flagged assets never appear here.</p>
                      {loadingCfg || !config ? (
                        <div className="flex items-center gap-2 text-sm text-mist py-4"><Loader2 size={15} className="animate-spin" /> Loading…</div>
                      ) : (
                        <>
                          {config.assets.length === 0 ? (
                            <p className="text-sm text-mist py-2">No transferable assets yet - add some in your vault.</p>
                          ) : (
                            <ul className="space-y-2">
                              {config.assets.map((a) => (
                                <li key={a.id} className="flex items-center gap-3 rounded-lg bg-card border border-line px-3 py-2">
                                  <span className="flex-1 min-w-0">
                                    <span className="block text-sm truncate">{a.label}</span>
                                    <span className="block text-xs text-mist">{a.platform || a.type}</span>
                                  </span>
                                  <label className="flex items-center gap-1.5 text-xs text-mist shrink-0">
                                    {a.granted ? "On" : "Off"}
                                    <Switch on={a.granted} onClick={() => toggleAsset(a.id)} />
                                  </label>
                                </li>
                              ))}
                            </ul>
                          )}

                          {config.files.length > 0 && (
                            <>
                              <p className="text-xs text-mist mt-4 mb-2 flex items-center gap-1.5"><FileText size={12} /> Files</p>
                              <ul className="space-y-2">
                                {config.files.map((f) => (
                                  <li key={f.id} className="flex items-center gap-3 rounded-lg bg-card border border-line px-3 py-2">
                                    <span className="flex-1 min-w-0 text-sm truncate">{f.name}</span>
                                    <label className="flex items-center gap-1.5 text-xs text-mist shrink-0">
                                      {f.granted ? "On" : "Off"}
                                      <Switch on={f.granted} onClick={() => toggleFile(f.id)} />
                                    </label>
                                  </li>
                                ))}
                              </ul>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-12 text-mist text-sm">No guardians yet. Add people you trust on the left.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Switch({ on, onClick }) {
  return (
    <button onClick={onClick} role="switch" aria-checked={on}
      className={`relative h-5 w-9 rounded-full transition shrink-0 ${on ? "bg-sage" : "bg-line"}`}>
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${on ? "left-[18px]" : "left-0.5"}`} />
    </button>
  );
}
