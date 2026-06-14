import { useEffect, useState } from "react";
import { Plus, Send, Loader2, Check, Trash2, FileText, Globe, Banknote } from "lucide-react";
import { api } from "../../lib/api.js";
import { providerIcon, providerColor } from "../../lib/providers.js";
import { useAuth } from "../../context/AuthContext.jsx";

const PRESETS = [
  { platform: "Google", domain: "google.com", category: "email" },
  { platform: "Outlook", domain: "outlook.com", category: "email" },
  { platform: "Instagram", domain: "instagram.com", category: "social" },
  { platform: "Facebook", domain: "facebook.com", category: "social" },
  { platform: "X", domain: "x.com", category: "social" },
  { platform: "LinkedIn", domain: "linkedin.com", category: "social" },
  { platform: "Netflix", domain: "netflix.com", category: "subscription" },
  { platform: "Spotify", domain: "spotify.com", category: "subscription" },
  { platform: "Amazon", domain: "amazon.com", category: "shopping" },
  { platform: "Apple", domain: "apple.com", category: "account" },
  { platform: "PayPal", domain: "paypal.com", category: "finance" },
  { platform: "Dropbox", domain: "dropbox.com", category: "storage" },
];
const ACTION_LABEL = { delete: "Delete", memorialize: "Memorialize", transfer: "Transfer" };

// Build a human, brand-coloured send status from the backend's lastSend proof.
function sendStatus(a) {
  const ls = a.lastSend;
  if (a.status === "failed" || (ls && ls.error)) {
    return { tone: "ember", line: ls?.error || "Send failed", meta: ls };
  }
  if (a.status === "sent" && ls) {
    if (ls.code === 202) return { tone: "sage", line: "Sent - SendGrid accepted (202)", meta: ls };
    if (ls.code === 0 || ls.provider === "mock") return { tone: "mist", line: "Mock send (no SENDGRID key set)", meta: ls };
    return { tone: "sage", line: `Sent${ls.provider ? ` via ${ls.provider}` : ""}`, meta: ls };
  }
  return null;
}

const TONE = { sage: "text-sage-600", mist: "text-mist", ember: "text-ember" };

function fmtTime(at) {
  if (!at) return null;
  const d = new Date(at);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleString();
}

// Vector brand mark from our provider set (offline, crisp on paper) - falls back to a category glyph.
const KEY_BY_NAME = { google: "gmail", gmail: "gmail", outlook: "outlook", instagram: "instagram", facebook: "facebook", x: "x", twitter: "x", linkedin: "linkedin", netflix: "netflix", spotify: "spotify", amazon: "amazon", apple: "apple", icloud: "icloud", paypal: "paypal", dropbox: "dropbox", github: "github" };
const markFor = (name, category) => {
  const k = KEY_BY_NAME[(name || "").toLowerCase().replace(/[^a-z]/g, "")];
  if (k) return providerIcon(k);
  return /bank|financ|pay|money/.test(category || "") ? Banknote : Globe;
};
const markColor = (name) => providerColor(KEY_BY_NAME[(name || "").toLowerCase().replace(/[^a-z]/g, "")]);

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
      await api.post(`/accounts/${id}/send`);
      // Reload so the persisted lastSend proof (code/provider/to/at/error) drives the UI.
      await load();
    } catch (e) {
      setNotice((n) => ({ ...n, [id]: e.response?.data?.error || "Send failed" }));
    } finally { setB(id, null); }
  };

  const taken = new Set((accounts || []).map((a) => a.domain));

  return (
    <div className="rise">
      <h1 className="font-display text-title mb-1">Account executor</h1>
      <p className="text-mist mb-8 max-w-xl">
        List the services you use. When the time comes, we send each one a request - to close, memorialize, or transfer the account - drafted for you.
      </p>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-1 self-start">
          <h3 className="text-h mb-4">Add an account</h3>
          <label className="label">Common services</label>
          <div className="grid grid-cols-3 gap-2 mb-5">
            {PRESETS.map((p) => {
              const Icon = markFor(p.platform, p.category);
              return (
              <button key={p.domain} disabled={taken.has(p.domain)}
                onClick={() => add({ platform: p.platform, domain: p.domain, category: p.category, action: "delete" })}
                className="chip flex-col gap-1.5 py-3 border-line hover:border-ember disabled:opacity-30 disabled:cursor-not-allowed">
                <Icon size={20} className="text-ink" style={{ color: markColor(p.platform) }} />
                <span className="text-xs">{p.platform}</span>
              </button>
            ); })}
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
              {accounts.map((a) => {
                const st = sendStatus(a);
                const sent = a.status === "sent" && st?.tone !== "ember";
                const Icon = markFor(a.platform, a.category);
                return (
                <div key={a._id} className="card card-hover">
                  <div className="flex items-center gap-3">
                    <span className="grid place-items-center h-10 w-10 rounded-xl bg-paper border border-line/70 text-ink shrink-0"><Icon size={18} style={{ color: markColor(a.platform) }} /></span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{a.platform}</div>
                      <div className="text-xs text-mist truncate">{a.domain}</div>
                    </div>
                    <span className={`pill ${a.action === "delete" ? "bg-mist/10 text-mist border border-line" : a.action === "memorialize" ? "bg-sage/15 text-sage-600" : "bg-paper text-graphite border border-line"}`}>
                      {ACTION_LABEL[a.action]}
                    </span>
                    {sent ? (
                      <span className="pill bg-sage/15 text-sage-600"><Check size={13} /> Sent</span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button className="btn-secondary btn-sm" disabled={!!busy[a._id]} onClick={() => draft(a._id)}>
                          {busy[a._id] === "drafting" ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />} Draft
                        </button>
                        <button className="btn-primary btn-sm" disabled={!!busy[a._id]} onClick={() => send(a._id)}>
                          {busy[a._id] === "sending" ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} {st?.tone === "ember" ? "Retry" : "Send"}
                        </button>
                      </div>
                    )}
                    <button className="text-mist hover:text-ember p-1" onClick={() => remove(a._id)} aria-label="Remove"><Trash2 size={15} /></button>
                  </div>
                  {drafts[a._id] && (
                    <pre className="mt-4 pt-4 border-t border-line text-xs text-graphite whitespace-pre-wrap font-body leading-relaxed rise">{drafts[a._id]}</pre>
                  )}
                  {st && (
                    <div className="mt-3 rise">
                      <p className={`text-xs font-medium ${TONE[st.tone]}`}>{st.line}</p>
                      {st.meta && (st.meta.to || st.meta.provider || st.meta.at) && (
                        <p className="text-xs text-mist mono mt-0.5">
                          {[st.meta.provider, st.meta.to, fmtTime(st.meta.at)].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                  )}
                  {notice[a._id] && (
                    <p className="mt-3 text-xs text-ember">{notice[a._id]}</p>
                  )}
                </div>
                );
              })}
            </div>
          )}
          <p className="mt-4 text-xs text-mist">Requests are sent to your test inbox for the demo - never to real companies.</p>
          <p className="mt-1.5 text-xs text-mist">A 202 means SendGrid accepted it for delivery - see the SendGrid Activity feed (sendgrid.com &rarr; Activity) for the delivery receipt.</p>
        </div>
      </div>
    </div>
  );
}
