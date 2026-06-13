import { useEffect, useState } from "react";
import { api } from "../../lib/api.js";

// Each type captures the REAL details (encrypted before it leaves the server), not just a label.
const SCHEMAS = {
  account: { icon: "👤", title: "Online account", fields: [
    { k: "platform", label: "Service / platform", ph: "e.g. Gmail, Instagram" },
    { k: "username", label: "Username or email" },
    { k: "password", label: "Password", secret: true },
    { k: "url", label: "Login URL" },
    { k: "notes", label: "Notes", area: true } ] },
  bank: { icon: "🏦", title: "Bank account", fields: [
    { k: "bank", label: "Bank", ph: "e.g. HDFC Bank" },
    { k: "accountNumber", label: "Account number" },
    { k: "ifsc", label: "IFSC / SWIFT" },
    { k: "netbanking", label: "Net-banking login" },
    { k: "nominee", label: "Nominee" },
    { k: "notes", label: "Notes", area: true } ] },
  crypto: { icon: "🪙", title: "Crypto", fields: [
    { k: "wallet", label: "Wallet / exchange" },
    { k: "address", label: "Public address" },
    { k: "seedPhrase", label: "Seed phrase / private key", secret: true },
    { k: "beneficiary", label: "Who inherits this" },
    { k: "notes", label: "Notes", area: true } ] },
  insurance: { icon: "🛡️", title: "Insurance", fields: [
    { k: "provider", label: "Provider", ph: "e.g. LIC, HDFC Ergo" },
    { k: "policyNumber", label: "Policy number" },
    { k: "kind", label: "Type", ph: "life / health / term" },
    { k: "sumAssured", label: "Sum assured" },
    { k: "premium", label: "Premium" },
    { k: "nominee", label: "Nominee" },
    { k: "notes", label: "Notes", area: true } ] },
  loan: { icon: "💳", title: "Loan", fields: [
    { k: "lender", label: "Lender" },
    { k: "loanAccount", label: "Loan account no." },
    { k: "kind", label: "Type", ph: "home / car / personal" },
    { k: "outstanding", label: "Outstanding amount" },
    { k: "emi", label: "EMI" },
    { k: "endDate", label: "Ends on" },
    { k: "notes", label: "Notes", area: true } ] },
  document: { icon: "📄", title: "Document", fields: [
    { k: "docType", label: "Document", ph: "passport / will / property deed" },
    { k: "number", label: "Document number" },
    { k: "issuer", label: "Issued by" },
    { k: "location", label: "Where the original is kept" },
    { k: "notes", label: "Notes", area: true } ] },
  subscription: { icon: "🔁", title: "Subscription", fields: [
    { k: "service", label: "Service" },
    { k: "plan", label: "Plan" },
    { k: "login", label: "Login" },
    { k: "billing", label: "Billing / card" },
    { k: "notes", label: "Notes", area: true } ] },
};
const TYPES = Object.keys(SCHEMAS);
const humanize = (k) => k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

export default function Vault() {
  const [items, setItems] = useState(null); // null = loading
  const [type, setType] = useState("bank");
  const [label, setLabel] = useState("");
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [revealed, setRevealed] = useState({}); // id -> fields
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
      await api.post("/vault", { type, label: label.trim(), fields });
      setLabel(""); setValues({}); await load();
    } finally { setSaving(false); }
  };

  const reveal = async (id) => {
    if (revealed[id]) return setRevealed((p) => { const n = { ...p }; delete n[id]; return n; }); // toggle closed
    const { data } = await api.get(`/vault/${id}/reveal`);
    setRevealed((p) => ({ ...p, [id]: data.fields }));
  };
  const anchor = async () => setFp((await api.get("/vault/fingerprint")).data.fingerprint);

  return (
    <div className="rise">
      <h1 className="text-3xl mb-1">Your vault</h1>
      <p className="text-mist mb-8 max-w-xl">
        The real details your family will need — account numbers, policies, documents.
        Encrypted before it's stored; we never see the contents.
      </p>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Add panel */}
        <div className="card lg:col-span-2 self-start">
          <h3 className="text-lg mb-4">Add to vault</h3>

          <label className="label">What is it?</label>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {TYPES.map((t) => (
              <button key={t} onClick={() => pickType(t)}
                className={`chip ${type === t ? "border-ember bg-ember/10 text-ink" : "border-line text-mist hover:border-mist/50"}`}>
                <span>{SCHEMAS[t].icon}</span>{SCHEMAS[t].title}
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

          <button className="btn-ember w-full mt-2" onClick={add} disabled={saving || !label.trim()}>
            {saving ? "Encrypting…" : "Add to vault"}
          </button>
        </div>

        {/* Items panel */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg">{items?.length ?? "…"} item{items?.length === 1 ? "" : "s"}</h3>
            <button className="btn-ghost" onClick={anchor} disabled={!items?.length}>Anchor integrity hash</button>
          </div>

          {items === null ? (
            <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-16" />)}</div>
          ) : items.length === 0 ? (
            <div className="card text-center py-12 text-mist">
              <div className="text-3xl mb-2">🔒</div>
              Nothing here yet. Add your first account or document on the left.
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((i) => {
                const sc = SCHEMAS[i.type] || { icon: "📦" };
                const fields = revealed[i.id];
                return (
                  <div key={i.id} className="card card-hover">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{sc.icon}</span>
                      <span className="flex-1 font-medium">{i.label}</span>
                      <span className="pill bg-paper text-mist border border-line">{i.type}</span>
                      <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => reveal(i.id)}>
                        {fields ? "Hide" : "Reveal"}
                      </button>
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
    </div>
  );
}
