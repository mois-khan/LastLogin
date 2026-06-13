import { useEffect, useState } from "react";
import { Plus, Send, Loader2, Check, Trash2, FileText } from "lucide-react";
import { api } from "../../lib/api.js";
import { useAuth } from "../../context/AuthContext.jsx";

const PRESETS = [
  { platform: "Google", domain: "google.com", category: "email" },
  { platform: "Instagram", domain: "instagram.com", category: "social" },
  { platform: "Facebook", domain: "facebook.com", category: "social" },
  { platform: "X", domain: "x.com", category: "social" },
  { platform: "LinkedIn", domain: "linkedin.com", category: "social" },
  { platform: "Netflix", domain: "netflix.com", category: "subscription" },
];
const ACTION_LABEL = { delete: "Delete", memorialize: "Memorialize", transfer: "Transfer" };

function Logo({ domain, size = 32 }) {
  const [src, setSrc] = useState(`https://logo.clearbit.com/${domain}`);
  return (
    <img src={src} alt="" width={size} height={size}
      onError={() => setSrc(`https://www.google.com/s2/favicons?domain=${domain}&sz=64`)}
      className="rounded-lg bg-paper border border-line object-contain p-0.5" />
  );
}

export default function Executor() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState(null);
  const [busy, setBusy] = useState({});
  const [drafts, setDrafts] = useState({});
  const [custom, setCustom] = useState({ platform: "", domain: "", action: "delete" });
  const [notice, setNotice] = useState({});

  const load = async () => setAccounts((await api.get("/accounts")).data);
  useEffect(() => { load(); }, []);

  const add = async (acc) => { await api.post("/accounts", { ...acc, contactEmail: user?.email }); await load(); };
  const addCustom = async () => {
    if (!custom.platform.trim()) return;
    await add({ platform: custom.platform.trim(), domain: (custom.domain || custom.platform.toLowerCase().replace(/\s+/g, "") + ".com").trim(), action: custom.action, category: "other" });
    setCustom({ platform: "", domain: "", action: "delete" });
  };
  const remove = async (id) => { await api.delete(`/accounts/${id}`); await load(); };
  const setB = (id, v) => setBusy((b) => ({ ...b, [id]: v }));
  const draft = async (id) => { setB(id, "drafting"); try { const { data } = await api.post(`/accounts/${id}/draft`); setDrafts((d) => ({ ...d, [id]: data.draft })); } finally { setB(id, null); } };
  const send = async (id) => {
    setB(id, "sending");
    try {
      const { data } = await api.post(`/accounts/${id}/send`);
      setNotice((n) => ({ ...n, [id]: data.ok ? { ok: true, msg: `Request sent to ${data.sentTo}` } : { ok: false, msg: data.error } }));
      await load();
    } catch (e) {
      setNotice((n) => ({ ...n, [id]: { ok: false, msg: e.response?.data?.error || "Send failed" } }));
    } finally { setB(id, null); }
  };

  const taken = new Set((accounts || []).map((a) => a.domain));

  return (
    <div className="rise">
      <h1 className="font-display text-title mb-1">Account executor</h1>
      <p className="text-mist mb-8 max-w-xl">
        List the services you use. When the time comes, we send each one a request — to close, memorialize, or transfer the account — drafted for you.
      </p>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-1 self-start">
          <h3 className="text-h mb-4">Add an account</h3>
          <label className="label">Common services</label>
          <div className="grid grid-cols-3 gap-2 mb-5">
            {PRESETS.map((p) => (
              <button key={p.domain} disabled={taken.has(p.domain)}
                onClick={() => add({ platform: p.platform, domain: p.domain, category: p.category, action: "delete" })}
                className="chip flex-col gap-1.5 py-3 border-line hover:border-ember disabled:opacity-30 disabled:cursor-not-allowed">
                <Logo domain={p.domain} size={24} />
                <span className="text-xs">{p.platform}</span>
              </button>
            ))}
          </div>
          <label className="label">Or add your own</label>
          <input className="field mb-2" placeholder="Platform (e.g. HDFC Bank)" value={custom.platform}
            onChange={(e) => setCustom({ ...custom, platform: e.target.value })} />
          <input className="field mb-2" placeholder="Domain (e.g. hdfcbank.com)" value={custom.domain}
            onChange={(e) => setCustom({ ...custom, domain: e.target.value })} />
          <select className="field mb-3" value={custom.action} onChange={(e) => setCustom({ ...custom, action: e.target.value })}>
            <option value="delete">Delete the account</option>
            <option value="memorialize">Memorialize it</option>
            <option value="transfer">Transfer ownership</option>
          </select>
          <button className="btn-primary w-full" onClick={addCustom} disabled={!custom.platform.trim()}><Plus size={16} /> Add</button>
        </div>

        <div className="lg:col-span-2">
          {accounts === null ? (
            <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-20" />)}</div>
          ) : accounts.length === 0 ? (
            <div className="card text-center py-12 text-mist text-sm">No accounts yet. Add the services you use on the left.</div>
          ) : (
            <div className="space-y-3">
              {accounts.map((a) => (
                <div key={a._id} className="card card-hover">
                  <div className="flex items-center gap-3">
                    <Logo domain={a.domain} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{a.platform}</div>
                      <div className="text-xs text-mist truncate">{a.domain}</div>
                    </div>
                    <span className={`pill ${a.action === "delete" ? "bg-ember/12 text-ember" : a.action === "memorialize" ? "bg-sage/15 text-sage-600" : "bg-paper text-graphite border border-line"}`}>
                      {ACTION_LABEL[a.action]}
                    </span>
                    {a.status === "sent" ? (
                      <span className="pill bg-sage/15 text-sage-600"><Check size={13} /> Sent</span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button className="btn-secondary btn-sm" disabled={!!busy[a._id]} onClick={() => draft(a._id)}>
                          {busy[a._id] === "drafting" ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />} Draft
                        </button>
                        <button className="btn-primary btn-sm" disabled={!!busy[a._id]} onClick={() => send(a._id)}>
                          {busy[a._id] === "sending" ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Send
                        </button>
                      </div>
                    )}
                    <button className="text-mist hover:text-ember p-1" onClick={() => remove(a._id)} aria-label="Remove"><Trash2 size={15} /></button>
                  </div>
                  {drafts[a._id] && (
                    <pre className="mt-4 pt-4 border-t border-line text-xs text-graphite whitespace-pre-wrap font-body leading-relaxed rise">{drafts[a._id]}</pre>
                  )}
                  {notice[a._id] && (
                    <p className={`mt-3 text-xs ${notice[a._id].ok ? "text-sage-600" : "text-ember"}`}>{notice[a._id].msg}</p>
                  )}
                </div>
              ))}
            </div>
          )}
          <p className="mt-4 text-xs text-mist">Requests are sent to your test inbox for the demo — never to real companies.</p>
        </div>
      </div>
    </div>
  );
}
