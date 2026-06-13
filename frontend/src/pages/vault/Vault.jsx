import { useEffect, useState } from "react";
import { Lock, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { api } from "../../lib/api.js";
import { useVaultKey } from "../../context/VaultKeyContext.jsx";
import { encryptJSON, decryptJSON } from "../../lib/crypto.js";

// Each type captures the REAL details, encrypted in the browser before they're sent.
const SCHEMAS = {
  account: { icon: "Online account", fields: [
    { k: "platform", label: "Service / platform", ph: "e.g. Gmail, Instagram" },
    { k: "username", label: "Username or email" },
    { k: "password", label: "Password", secret: true },
    { k: "url", label: "Login URL" },
    { k: "notes", label: "Notes", area: true } ] },
  bank: { icon: "Bank account", fields: [
    { k: "bank", label: "Bank", ph: "e.g. HDFC Bank" },
    { k: "accountNumber", label: "Account number" },
    { k: "ifsc", label: "IFSC / SWIFT" },
    { k: "netbanking", label: "Net-banking login" },
    { k: "nominee", label: "Nominee" },
    { k: "notes", label: "Notes", area: true } ] },
  crypto: { icon: "Crypto", fields: [
    { k: "wallet", label: "Wallet / exchange" },
    { k: "address", label: "Public address" },
    { k: "seedPhrase", label: "Seed phrase / private key", secret: true },
    { k: "beneficiary", label: "Who inherits this" },
    { k: "notes", label: "Notes", area: true } ] },
  insurance: { icon: "Insurance", fields: [
    { k: "provider", label: "Provider", ph: "e.g. LIC, HDFC Ergo" },
    { k: "policyNumber", label: "Policy number" },
    { k: "kind", label: "Type", ph: "life / health / term" },
    { k: "sumAssured", label: "Sum assured" },
    { k: "premium", label: "Premium" },
    { k: "nominee", label: "Nominee" },
    { k: "notes", label: "Notes", area: true } ] },
  loan: { icon: "Loan", fields: [
    { k: "lender", label: "Lender" },
    { k: "loanAccount", label: "Loan account no." },
    { k: "kind", label: "Type", ph: "home / car / personal" },
    { k: "outstanding", label: "Outstanding amount" },
    { k: "emi", label: "EMI" },
    { k: "endDate", label: "Ends on" },
    { k: "notes", label: "Notes", area: true } ] },
  document: { icon: "Document", fields: [
    { k: "docType", label: "Document", ph: "passport / will / deed" },
    { k: "number", label: "Document number" },
    { k: "issuer", label: "Issued by" },
    { k: "location", label: "Where the original is kept" },
    { k: "notes", label: "Notes", area: true } ] },
  subscription: { icon: "Subscription", fields: [
    { k: "service", label: "Service" },
    { k: "plan", label: "Plan" },
    { k: "login", label: "Login" },
    { k: "billing", label: "Billing / card" },
    { k: "notes", label: "Notes", area: true } ] },
};
const TYPES = Object.keys(SCHEMAS);
const humanize = (k) => k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

function LockGate() {
  const { status, setup, unlock } = useVaultKey();
  const [mode, setMode] = useState(null); // null=loading | 'setup' | 'unlock'
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    status().then((s) => setMode(s.needsSetup ? "setup" : "unlock")).catch(() => setMode("unlock"));
  }, []);

  const submit = async (e) => {
    e.preventDefault(); setErr("");
    if (mode === "setup") {
      if (pass.length < 8) return setErr("Use at least 8 characters.");
      if (pass !== confirm) return setErr("The two entries don't match.");
    }
    setBusy(true);
    try {
      if (mode === "setup") await setup(pass); else await unlock(pass);
    } catch {
      setErr(mode === "unlock" ? "That passphrase didn't open the vault." : "Couldn't set the key — try again.");
    } finally { setBusy(false); }
  };

  if (!mode) return <div className="card max-w-md mx-auto"><div className="skeleton h-28" /></div>;

  return (
    <div className="max-w-md mx-auto rise">
      <div className="card">
        <span className="grid place-items-center h-12 w-12 rounded-xl bg-ember/12 text-ember mb-5"><Lock size={22} /></span>
        <h2 className="font-display text-h mb-1">{mode === "setup" ? "Create your master key" : "Unlock your vault"}</h2>
        <p className="text-sm text-mist mb-6">
          {mode === "setup"
            ? "One passphrase encrypts everything in your vault — here, on your device. We never see it, and we can't reset it. Choose something you'll remember."
            : "Enter your master passphrase. It's used on your device only; it never reaches our servers."}
        </p>
        <form onSubmit={submit}>
          <label className="label">Master passphrase</label>
          <div className="relative mb-3">
            <input className="field pr-10" type={show ? "text" : "password"} value={pass} autoFocus
              onChange={(e) => setPass(e.target.value)} />
            <button type="button" onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-2.5 text-mist hover:text-ink" tabIndex={-1}>
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {mode === "setup" && (
            <div className="mb-3">
              <label className="label">Confirm passphrase</label>
              <input className="field" type={show ? "text" : "password"} value={confirm}
                onChange={(e) => setConfirm(e.target.value)} />
            </div>
          )}
          {err && <p className="text-sm text-ember mb-3">{err}</p>}
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? "Working…" : mode === "setup" ? "Create & unlock" : "Unlock"}
          </button>
        </form>
        <p className="mt-5 flex items-center gap-2 text-xs text-mist">
          <ShieldCheck size={14} className="text-sage-600" /> Zero-knowledge — stored as ciphertext we can't open.
        </p>
      </div>
    </div>
  );
}

function VaultItems({ vkey }) {
  const [items, setItems] = useState(null);
  const [type, setType] = useState("bank");
  const [label, setLabel] = useState("");
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [revealed, setRevealed] = useState({});
  const [fp, setFp] = useState("");

  const load = async () => setItems((await api.get("/vault")).data);
  useEffect(() => { load(); }, []);
  const schema = SCHEMAS[type];
  const set = (k, v) => setValues((p) => ({ ...p, [k]: v }));
  const pickType = (t) => { setType(t); setValues({}); };

  const add = async () => {
    if (!label.trim()) return;
    setSaving(true);
    const fields = Object.fromEntries(Object.entries(values).filter(([, v]) => String(v ?? "").trim()));
    try {
      const blob = await encryptJSON(fields, vkey); // encrypted in the browser
      await api.post("/vault", { type, label: label.trim(), blob });
      setLabel(""); setValues({}); await load();
    } finally { setSaving(false); }
  };

  const reveal = async (id) => {
    if (revealed[id]) return setRevealed((p) => { const n = { ...p }; delete n[id]; return n; });
    const { data } = await api.get(`/vault/${id}/reveal`);
    const fields = data.scheme === "client" ? await decryptJSON(data.blob, vkey) : data.fields;
    setRevealed((p) => ({ ...p, [id]: fields }));
  };
  const anchor = async () => setFp((await api.get("/vault/fingerprint")).data.fingerprint);

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      <div className="card lg:col-span-2 self-start">
        <h3 className="text-h mb-4">Add to vault</h3>
        <label className="label">What is it?</label>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {TYPES.map((t) => (
            <button key={t} onClick={() => pickType(t)}
              className={`chip ${type === t ? "border-ember bg-ember/10 text-ink" : "border-line text-mist hover:border-mist/50"}`}>
              {SCHEMAS[t].icon}
            </button>
          ))}
        </div>
        <label className="label">Name it</label>
        <input className="field mb-4" value={label} placeholder="e.g. HDFC salary account"
          onChange={(e) => setLabel(e.target.value)} />
        {schema.fields.map((f) => (
          <div key={f.k} className="mb-3">
            <label className="label">{f.label}{f.secret && <span className="text-ember"> · secret</span>}</label>
            {f.area ? (
              <textarea className="field" rows={2} value={values[f.k] || ""} placeholder={f.ph || ""}
                onChange={(e) => set(f.k, e.target.value)} />
            ) : (
              <input className="field" type={f.secret ? "password" : "text"} value={values[f.k] || ""}
                placeholder={f.ph || ""} onChange={(e) => set(f.k, e.target.value)} />
            )}
          </div>
        ))}
        <button className="btn-primary w-full mt-2" onClick={add} disabled={saving || !label.trim()}>
          {saving ? "Encrypting…" : "Add to vault"}
        </button>
      </div>

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
              return (
                <div key={i.id} className="card card-hover">
                  <div className="flex items-center gap-3">
                    <span className="flex-1 font-medium">{i.label}</span>
                    {i.scheme === "client" && <ShieldCheck size={15} className="text-sage-600" title="Encrypted on your device" />}
                    <span className="pill bg-paper text-mist border border-line">{i.type}</span>
                    <button className="btn-secondary btn-sm" onClick={() => reveal(i.id)}>{fields ? "Hide" : "Reveal"}</button>
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
      </div>
    </div>
  );
}

export default function Vault() {
  const { unlocked, key, lock } = useVaultKey();
  return (
    <div className="rise">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-title mb-1">Your vault</h1>
          <p className="text-mist mb-8 max-w-xl">
            The real details your family will need — encrypted on your device. We store only ciphertext we can't open.
          </p>
        </div>
        {unlocked && (
          <button className="btn-ghost btn-sm shrink-0" onClick={lock}><Lock size={14} /> Lock</button>
        )}
      </div>
      {unlocked ? <VaultItems vkey={key} /> : <LockGate />}
    </div>
  );
}
