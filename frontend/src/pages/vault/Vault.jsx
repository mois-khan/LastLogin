import { useEffect, useRef, useState } from "react";
import {
  Lock, ShieldCheck, Globe, Banknote, Coins, Shield, FileText, CreditCard, ScrollText,
  Trash2, Send, Ban, Upload, Paperclip, Image as ImageIcon, Loader2,
} from "lucide-react";
import { api } from "../../lib/api.js";
import { PROVIDERS, providerIcon } from "../../lib/providers.js";

// Custom asset categories + their fields. Online "account" items now flow through the
// provider picker (PROVIDERS) which auto-fills the login URL + platform; these remain
// for everything a brand tile can't express.
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
const CATEGORIES = Object.keys(SCHEMAS).filter((c) => c !== "account");
const humanize = (k) => k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
// A saved item's mark: brand provider first, else its category icon.
const iconFor = (i) => (i.platform && providerIcon(i.platform)) || SCHEMAS[i.type]?.Icon || Globe;
const isImage = (m) => /^image\//.test(m || "");
const fmtSize = (n) => (!n ? "" : n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1048576).toFixed(1)} MB`);

export default function Vault() {
  const [items, setItems] = useState(null);
  const [type, setType] = useState("account");
  const [platform, setPlatform] = useState("gmail"); // active provider key when type==="account"
  const [label, setLabel] = useState("");
  const [values, setValues] = useState({});
  const [disposition, setDisposition] = useState("transfer");
  const [saving, setSaving] = useState(false);
  const [revealed, setRevealed] = useState({});
  const [fp, setFp] = useState("");
  const [tab, setTab] = useState("accounts"); // accounts | files

  const load = async () => setItems((await api.get("/vault")).data);
  useEffect(() => { load().catch(() => setItems([])); }, []);

  const schema = SCHEMAS[type];
  const set = (k, v) => setValues((p) => ({ ...p, [k]: v }));

  // Pick a brand provider -> auto-fill login URL + platform + a default label,
  // leaving the user to type only username + password.
  const pickProvider = (p) => {
    setType("account");
    setPlatform(p.key);
    setValues(p.loginUrl ? { url: p.loginUrl } : {});
    setLabel(p.label === "Other site" ? "" : p.label);
  };
  const pickCategory = (t) => { setType(t); setPlatform(""); setValues({}); setLabel(""); };

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

  const activeProvider = type === "account" ? platform : null;

  return (
    <div className="rise">
      <h1 className="font-display text-title mb-1">Your vault</h1>
      <p className="text-mist mb-6 max-w-xl">The real details your family will need — encrypted at rest, released only to the guardians you choose.</p>

      <div className="seg mb-8">
        <button className={`seg-btn ${tab === "accounts" ? "seg-btn-active" : ""}`} onClick={() => setTab("accounts")}><Lock size={15} /> Accounts & assets</button>
        <button className={`seg-btn ${tab === "files" ? "seg-btn-active" : ""}`} onClick={() => setTab("files")}><Paperclip size={15} /> Files & media</button>
      </div>

      {tab === "files" ? <FileVault /> : (
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Add */}
        <div className="card lg:col-span-2 self-start">
          <h3 className="text-h mb-4">Add to vault</h3>

          <label className="label">Pick a service — we fill in the rest</label>
          <div className="grid grid-cols-4 gap-2 mb-4 max-h-64 overflow-y-auto pr-1 -mr-1">
            {PROVIDERS.map((p) => {
              const Icon = p.Icon;
              const on = activeProvider === p.key;
              return (
                <button key={p.key} onClick={() => pickProvider(p)} title={p.label}
                  className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 transition ${on ? "border-ember bg-ember/10 text-ink" : "border-line text-mist hover:border-mist/50"}`}>
                  <Icon size={18} /><span className="text-[10px] leading-tight text-center truncate w-full">{p.label}</span>
                </button>
              );
            })}
          </div>

          <label className="label">Or a custom category</label>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {CATEGORIES.map((t) => {
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
            <button className="btn-secondary btn-sm" onClick={anchor} disabled={!items?.length}>Seal this vault</button>
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
                        ? <span className="pill bg-mist/10 text-mist border border-line"><Ban size={12} /> Close quietly</span>
                        : <span className="pill bg-sage/12 text-sage-600"><Send size={12} /> Pass on</span>}
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
              <p className="text-xs text-mist mb-1">Sealed. This is the proof your family's records were never altered.</p>
              <p className="mono text-xs break-all text-ink">{fp}</p>
            </div>
          )}

          <p className="mt-6 flex items-center gap-2 text-xs text-mist">
            <ShieldCheck size={14} className="text-sage-600" /> Encrypted at rest. <span className="text-ink">Pass on</span> items reach the guardians you choose; items you <span className="text-ink">close</span> are quietly shut down when you're gone, and never shown to anyone.
          </p>
        </div>
      </div>
      )}
    </div>
  );
}

// The file vault: upload, list, set each file's disposition, delete. Mirrors the
// account items' "Pass on" vs "Close quietly" lifecycle.
function FileVault() {
  const [files, setFiles] = useState(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);

  const load = async () => setFiles((await api.get("/attachments")).data);
  useEffect(() => { load().catch(() => setFiles([])); }, []);

  const upload = async (fileList) => {
    const picked = Array.from(fileList || []);
    if (!picked.length) return;
    setBusy(true);
    try {
      for (const file of picked) {
        const fd = new FormData();
        fd.append("file", file);
        await api.post("/attachments", fd);
      }
      await load();
    } finally { setBusy(false); if (inputRef.current) inputRef.current.value = ""; }
  };

  const flip = async (f) => {
    const next = f.disposition === "delete" ? "transfer" : "delete";
    setFiles((arr) => arr.map((x) => (x.id === f.id ? { ...x, disposition: next } : x)));
    await api.patch(`/attachments/${f.id}/disposition`, { disposition: next });
  };
  const remove = async (id) => { setFiles((a) => a.filter((x) => x.id !== id)); await api.delete(`/attachments/${id}`); };

  const onDrop = (e) => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files); };

  return (
    <section className="rise">
      <p className="text-mist mb-5 max-w-xl text-sm">Photos, scanned documents, a will, a video — kept encrypted and released to the guardians you choose, just like your accounts.</p>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Dropzone */}
        <div className="lg:col-span-2 self-start">
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`card card-hover cursor-pointer text-center py-10 border-dashed ${drag ? "border-ember bg-ember/5" : ""}`}>
            <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => upload(e.target.files)} />
            {busy ? (
              <Loader2 size={24} className="mx-auto mb-2 text-ember animate-spin" />
            ) : (
              <Upload size={24} className="mx-auto mb-2 text-mist" />
            )}
            <p className="text-sm text-ink font-medium">{busy ? "Uploading…" : "Drop files here, or click to choose"}</p>
            <p className="text-xs text-mist mt-1">Images, PDFs, video — encrypted on upload.</p>
          </div>
        </div>

        {/* File list */}
        <div className="lg:col-span-3">
          <h3 className="text-h mb-3">{files?.length ?? "…"} file{files?.length === 1 ? "" : "s"}</h3>

          {files === null ? (
            <div className="space-y-3">{[0, 1].map((i) => <div key={i} className="skeleton h-14" />)}</div>
          ) : files.length === 0 ? (
            <div className="card text-center py-10 text-mist">
              <Paperclip size={24} className="mx-auto mb-2 text-mist" />
              No files yet. Add a photo, a scan, or a video on the left.
            </div>
          ) : (
            <div className="space-y-3">
              {files.map((f) => {
                const del = f.disposition === "delete";
                const Glyph = isImage(f.mimeType) ? ImageIcon : Paperclip;
                return (
                  <div key={f.id} className="card card-hover">
                    <div className="flex items-center gap-3">
                      <span className={`grid place-items-center h-9 w-9 rounded-xl shrink-0 ${del ? "bg-mist/10 text-mist" : "bg-sage/12 text-sage-600"}`}><Glyph size={17} /></span>
                      <span className="flex-1 min-w-0">
                        <span className="block font-medium truncate">{f.name}</span>
                        <span className="block text-xs text-mist">{[f.mimeType, fmtSize(f.size)].filter(Boolean).join(" · ")}</span>
                      </span>
                      {del
                        ? <span className="pill bg-mist/10 text-mist border border-line"><Ban size={12} /> Close quietly</span>
                        : <span className="pill bg-sage/12 text-sage-600"><Send size={12} /> Pass on</span>}
                      <button className="text-mist hover:text-ember p-1.5 rounded-lg hover:bg-line/40 transition" title="Remove" onClick={() => remove(f.id)}><Trash2 size={15} /></button>
                    </div>
                    <div className="mt-3 ml-12">
                      <DispositionSelector value={f.disposition} onChange={() => flip(f)} small />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// Two-state lifecycle selector — Visible/Transfer vs Close quietly.
function DispositionSelector({ value, onChange, small, className = "" }) {
  const opts = [
    { v: "transfer", label: "Pass on", Icon: Send },
    { v: "delete", label: "Close quietly", Icon: Ban },
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
