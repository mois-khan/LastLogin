import { useEffect, useState } from "react";
import {
  Lock, ShieldCheck, Globe, Banknote, Coins, Shield, FileText, CreditCard, ScrollText, Trash2, Send, Ban,
} from "lucide-react";
import { SiGmail, SiInstagram, SiFacebook, SiX, SiYoutube, SiGithub, SiReddit } from "react-icons/si";
import { api } from "../../lib/api.js";

// Pre-defined platforms (online accounts) — real brand marks, never emoji.
const PLATFORMS = [
  { key: "gmail", label: "Gmail", Icon: SiGmail },
  { key: "instagram", label: "Instagram", Icon: SiInstagram },
  { key: "facebook", label: "Facebook", Icon: SiFacebook },
  { key: "x", label: "X", Icon: SiX },
  { key: "youtube", label: "YouTube", Icon: SiYoutube },
  { key: "github", label: "GitHub", Icon: SiGithub },
  { key: "reddit", label: "Reddit", Icon: SiReddit },
  { key: "other", label: "Other site", Icon: Globe },
];
const PLATFORM_ICON = Object.fromEntries(PLATFORMS.map((p) => [p.key, p.Icon]));

// Custom asset categories + their fields.
const SCHEMAS = {
  account: { label: "Online account", Icon: Globe, fields: [
    { k: "username", label: "Username or email" },
    { k: "password", label: "Password", secret: true },
    { k: "url", label: "Login URL" },
    { k: "notes", label: "Notes", area: true } ] },
  bank: { label: "Bank account", Icon: Banknote, fields: [
    { k: "bank", label: "Bank", ph: "e.g. HDFC Bank" },
    { k: "accountNumber", label: "Account number" },
    { k: "ifsc", label: "IFSC / SWIFT" },
    { k: "netbanking", label: "Net-banking login" },
    { k: "nominee", label: "Nominee" },
    { k: "notes", label: "Notes", area: true } ] },
  crypto: { label: "Crypto", Icon: Coins, fields: [
    { k: "wallet", label: "Wallet / exchange" },
    { k: "address", label: "Public address" },
    { k: "seedPhrase", label: "Seed phrase / private key", secret: true },
    { k: "beneficiary", label: "Who inherits this" },
    { k: "notes", label: "Notes", area: true } ] },
  insurance: { label: "Insurance", Icon: Shield, fields: [
    { k: "provider", label: "Provider", ph: "e.g. LIC" },
    { k: "policyNumber", label: "Policy number" },
    { k: "kind", label: "Type", ph: "life / health / term" },
    { k: "sumAssured", label: "Sum assured" },
    { k: "nominee", label: "Nominee" },
    { k: "notes", label: "Notes", area: true } ] },
  loan: { label: "Loan", Icon: ScrollText, fields: [
    { k: "lender", label: "Lender" },
    { k: "loanAccount", label: "Loan account no." },
    { k: "kind", label: "Type", ph: "home / car / personal" },
    { k: "outstanding", label: "Outstanding amount" },
    { k: "emi", label: "EMI" },
    { k: "notes", label: "Notes", area: true } ] },
  document: { label: "Document", Icon: FileText, fields: [
    { k: "docType", label: "Document", ph: "passport / will / deed" },
    { k: "number", label: "Document number" },
    { k: "issuer", label: "Issued by" },
    { k: "location", label: "Where the original is kept" },
    { k: "notes", label: "Notes", area: true } ] },
  subscription: { label: "Subscription", Icon: CreditCard, fields: [
    { k: "service", label: "Service" },
    { k: "plan", label: "Plan" },
    { k: "login", label: "Login" },
    { k: "billing", label: "Billing / card" },
    { k: "notes", label: "Notes", area: true } ] },
};
const CATEGORIES = Object.keys(SCHEMAS);
const humanize = (k) => k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
const iconFor = (i) => (i.platform && PLATFORM_ICON[i.platform]) || SCHEMAS[i.type]?.Icon || Globe;

export default function Vault() {
  const [items, setItems] = useState(null);
  const [type, setType] = useState("account");
  const [platform, setPlatform] = useState("gmail");
  const [label, setLabel] = useState("");
  const [values, setValues] = useState({});
  const [disposition, setDisposition] = useState("transfer");
  const [saving, setSaving] = useState(false);
  const [revealed, setRevealed] = useState({});
  const [fp, setFp] = useState("");

  const load = async () => setItems((await api.get("/vault")).data);
  useEffect(() => { load().catch(() => setItems([])); }, []);

  const schema = SCHEMAS[type];
  const set = (k, v) => setValues((p) => ({ ...p, [k]: v }));
  const pickPlatform = (key) => {
    setType("account"); setPlatform(key); setValues({});
    if (!label.trim()) setLabel(PLATFORMS.find((p) => p.key === key)?.label || "");
  };
  const pickCategory = (t) => { setType(t); setPlatform(""); setValues({}); };

  const add = async () => {
    if (!label.trim()) return;
    setSaving(true);
    const fields = Object.fromEntries(Object.entries(values).filter(([, v]) => String(v ?? "").trim()));
    try {
      await api.post("/vault", { type, platform: type === "account" ? platform : undefined, label: label.trim(), fields, disposition });
      setLabel(""); setValues({}); setDisposition("transfer"); await load();
    } finally { setSaving(false); }
  };

  const reveal = async (id) => {
    if (revealed[id]) return setRevealed((p) => { const n = { ...p }; delete n[id]; return n; });
    const { data } = await api.get(`/vault/${id}/reveal`);
    setRevealed((p) => ({ ...p, [id]: data.fields || {} }));
  };
  const flip = async (i) => {
    const next = i.disposition === "delete" ? "transfer" : "delete";
    setItems((arr) => arr.map((x) => (x.id === i.id ? { ...x, disposition: next } : x)));
    await api.patch(`/vault/${i.id}/disposition`, { disposition: next });
  };
  const remove = async (id) => { setItems((a) => a.filter((x) => x.id !== id)); await api.delete(`/vault/${id}`); };
  const anchor = async () => setFp((await api.get("/vault/fingerprint")).data.fingerprint);

  return (
    <div className="rise">
      <h1 className="font-display text-title mb-1">Your vault</h1>
      <p className="text-mist mb-8 max-w-xl">The real details your family will need — encrypted at rest, released only to the guardians you choose.</p>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Add */}
        <div className="card lg:col-span-2 self-start">
          <h3 className="text-h mb-4">Add to vault</h3>

          <label className="label">Common platforms</label>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {PLATFORMS.map(({ key, label: pl, Icon }) => (
              <button key={key} onClick={() => pickPlatform(key)} title={pl}
                className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 transition ${type === "account" && platform === key ? "border-ember bg-ember/10 text-ink" : "border-line text-mist hover:border-mist/50"}`}>
                <Icon size={18} /><span className="text-[10px] leading-tight">{pl}</span>
              </button>
            ))}
          </div>

          <label className="label">Or a custom category</label>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {CATEGORIES.filter((c) => c !== "account").map((t) => {
              const Icon = SCHEMAS[t].Icon;
              return (
                <button key={t} onClick={() => pickCategory(t)}
                  className={`flex items-center gap-1.5 rounded-xl border px-2 py-1.5 text-xs transition ${type === t ? "border-ember bg-ember/10 text-ink" : "border-line text-mist hover:border-mist/50"}`}>
                  <Icon size={13} /> {SCHEMAS[t].label}
                </button>
              );
            })}
          </div>

          <label className="label">Name it</label>
          <input className="field mb-4" value={label} placeholder="e.g. Personal Gmail"
            onChange={(e) => setLabel(e.target.value)} />

          {schema.fields.map((f) => (
            <div key={f.k} className="mb-3">
              <label className="label">{f.label}{f.secret && <span className="text-ember"> · secret</span>}</label>
              {f.area ? (
                <textarea className="field" rows={2} value={values[f.k] || ""} placeholder={f.ph || ""} onChange={(e) => set(f.k, e.target.value)} />
              ) : (
                <input className="field" type={f.secret ? "password" : "text"} value={values[f.k] || ""} placeholder={f.ph || ""} onChange={(e) => set(f.k, e.target.value)} />
              )}
            </div>
          ))}

          <label className="label mt-1">On my passing</label>
          <DispositionSelector value={disposition} onChange={setDisposition} className="mb-4" />

          <button className="btn-primary w-full" onClick={add} disabled={saving || !label.trim()}>
            {saving ? "Saving…" : "Save to vault"}
          </button>
        </div>

        {/* List */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-h">{items?.length ?? "…"} item{items?.length === 1 ? "" : "s"}</h3>
            <button className="btn-secondary btn-sm" onClick={anchor} disabled={!items?.length}>Anchor integrity hash</button>
          </div>

          {items === null ? (
            <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-16" />)}</div>
          ) : items.length === 0 ? (
            <div className="card text-center py-12 text-mist">
              <Lock size={26} className="mx-auto mb-2 text-mist" />
              Nothing here yet. Add your first account or document on the left.
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((i) => {
                const fields = revealed[i.id];
                const Icon = iconFor(i);
                const del = i.disposition === "delete";
                return (
                  <div key={i.id} className="card card-hover">
                    <div className="flex items-center gap-3">
                      <span className={`grid place-items-center h-9 w-9 rounded-xl shrink-0 ${del ? "bg-mist/10 text-mist" : "bg-sage/12 text-sage-600"}`}><Icon size={17} /></span>
                      <span className="flex-1 min-w-0">
                        <span className="block font-medium truncate">{i.label}</span>
                        <span className="block text-xs text-mist">{i.platform || i.type}</span>
                      </span>
                      {del
                        ? <span className="pill bg-mist/10 text-mist border border-line"><Ban size={12} /> Deletion request</span>
                        : <span className="pill bg-sage/12 text-sage-600"><Send size={12} /> Visible / Transfer</span>}
                      <button className="btn-secondary btn-sm" onClick={() => reveal(i.id)}>{fields ? "Hide" : "Reveal"}</button>
                      <button className="text-mist hover:text-ember p-1.5 rounded-lg hover:bg-line/40 transition" title="Remove" onClick={() => remove(i.id)}><Trash2 size={15} /></button>
                    </div>

                    <div className="mt-3 ml-12">
                      <DispositionSelector value={i.disposition} onChange={() => flip(i)} small />
                    </div>

                    {fields && (
                      <dl className="mt-4 pt-4 border-t border-line grid sm:grid-cols-2 gap-x-6 gap-y-2 rise">
                        {Object.entries(fields).map(([k, v]) => (
                          <div key={k} className="text-sm">
                            <dt className="text-xs uppercase tracking-wide text-mist">{humanize(k)}</dt>
                            <dd className="text-ink break-words mono">{v}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {fp && (
            <div className="mt-4 rounded-xl bg-paper border border-line p-3 rise">
              <p className="text-xs text-mist mb-1">Tamper-proof fingerprint (anchored on-chain):</p>
              <p className="mono text-xs break-all text-ink">{fp}</p>
            </div>
          )}

          <p className="mt-6 flex items-center gap-2 text-xs text-mist">
            <ShieldCheck size={14} className="text-sage-600" /> Encrypted at rest. <span className="text-ink">Deletion-request</span> items are closed on your passing and never shown to a guardian.
          </p>
        </div>
      </div>
    </div>
  );
}

// Two-state lifecycle selector — Visible/Transfer vs Deletion request.
function DispositionSelector({ value, onChange, small, className = "" }) {
  const opts = [
    { v: "transfer", label: "Visible / Transfer", Icon: Send },
    { v: "delete", label: "Deletion request", Icon: Ban },
  ];
  return (
    <div className={`inline-flex rounded-xl border border-line p-0.5 ${className}`}>
      {opts.map(({ v, label, Icon }) => (
        <button key={v} onClick={() => onChange(v)}
          className={`inline-flex items-center gap-1.5 rounded-lg transition ${small ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"} ${value === v ? (v === "delete" ? "bg-mist/15 text-ink" : "bg-sage/15 text-sage-600") : "text-mist hover:text-ink"}`}>
          <Icon size={small ? 12 : 14} /> {label}
        </button>
      ))}
    </div>
  );
}
