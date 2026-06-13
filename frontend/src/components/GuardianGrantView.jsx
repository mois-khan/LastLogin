import { Lock, Download, AudioLines, Paperclip, KeyRound } from "lucide-react";

// One estate's grants for a verified guardian, in strict order: messages (audio + text)
// first, then the accounts/assets they were given, then files, then a single export.
// Reused by /access (the universal hub) and /guardian/:userId.
export default function GuardianGrantView({ name, messages = [], items = [], files = [] }) {
  const hasAny = messages.length + items.length + files.length > 0;

  const downloadAll = () => {
    const lines = [`LastLogin — released to ${name || "you"}`, ""];
    if (messages.length) {
      lines.push("=== MESSAGES ===");
      messages.forEach((m) => lines.push(`\nFor ${m.recipientName || "family"} (${m.language}):`, m.text));
      lines.push("");
    }
    if (items.length) {
      lines.push("=== ACCOUNTS & ASSETS ===");
      items.forEach((it) => {
        lines.push(`\n• ${it.label} [${it.platform || it.type}]`);
        if (it.locked) lines.push("  (encrypted — opens with the guardian quorum)");
        else Object.entries(it.fields || {}).forEach(([k, v]) => lines.push(`  ${k}: ${v}`));
      });
    }
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `lastlogin-${name || "estate"}.txt`; a.click();
    URL.revokeObjectURL(url);
    files.forEach((f, i) => setTimeout(() => {
      const el = document.createElement("a"); el.href = f.dataUrl; el.download = f.name; el.click();
    }, 200 * (i + 1)));
  };

  if (!hasAny) return <p className="text-mist text-sm">Nothing was assigned to you.</p>;

  return (
    <>
      <section className="mb-8">
        <h3 className="font-display text-h mb-3 flex items-center gap-2"><AudioLines size={18} className="text-ember" /> Their messages</h3>
        {messages.length ? (
          <div className="space-y-3">
            {messages.map((m) => (
              <div key={m.id} className="card rise">
                <p className="text-xs uppercase tracking-wide text-mist mb-1">For {m.recipientName || "the family"}</p>
                <p className="text-sm text-graphite leading-relaxed mb-3">{m.text}</p>
                {m.audioUrl && (
                  <>
                    <audio controls src={m.audioUrl} className="w-full" />
                    <a href={m.audioUrl} download="message.mp3" className="inline-flex items-center gap-1.5 mt-2 text-xs text-ember hover:underline"><Download size={13} /> Download</a>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-mist">No messages were left.</p>}
      </section>

      <section className="mb-8">
        <h3 className="font-display text-h mb-3 flex items-center gap-2"><KeyRound size={18} className="text-ember" /> Accounts & assets</h3>
        {items.length ? (
          <div className="space-y-3">
            {items.map((it, idx) => (
              <div key={idx} className="card rise">
                <div className="flex items-center gap-3 mb-2">
                  <span className="flex-1 font-medium">{it.label}</span>
                  <span className="pill bg-paper text-mist border border-line">{it.platform || it.type}</span>
                </div>
                {it.locked ? (
                  <p className="text-xs text-mist flex items-center gap-1.5"><Lock size={12} /> Encrypted — opens when 2 guardians combine their keys.</p>
                ) : (
                  <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                    {Object.entries(it.fields || {}).map(([k, v]) => (
                      <div key={k}><dt className="text-xs uppercase tracking-wide text-mist">{k}</dt><dd className="mono text-ink break-words">{v}</dd></div>
                    ))}
                  </dl>
                )}
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-mist">No accounts were shared with you.</p>}
      </section>

      {files.length > 0 && (
        <section className="mb-8">
          <h3 className="font-display text-h mb-3 flex items-center gap-2"><Paperclip size={18} className="text-ember" /> Files</h3>
          <ul className="space-y-2">
            {files.map((f) => (
              <li key={f.id} className="card flex items-center gap-3 !py-3">
                <span className="flex-1 min-w-0 text-sm truncate">{f.name}</span>
                <a href={f.dataUrl} download={f.name} className="btn-secondary btn-sm"><Download size={13} /> Download</a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <button className="btn-primary w-full" onClick={downloadAll}><Download size={16} /> Download everything</button>
    </>
  );
}
