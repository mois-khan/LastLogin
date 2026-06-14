import { useState } from "react";
import { Lock, Download, Eye, EyeOff, Copy, Check, Image as ImageIcon, Paperclip, AudioLines, KeyRound } from "lucide-react";
import { providerIcon } from "../lib/providers.js";
import AudioPlayer from "./ui/AudioPlayer.jsx";
import Candle from "./ui/Candle.jsx";

// One estate's grants for a verified guardian — organized into tabs (Messages / Accounts /
// Files [/ Talk]) so it's a calm dashboard, not an endless scroll. extraTab lets the caller
// add a section (the companion chat). Reused by /access and /guardian/:userId.
export default function GuardianGrantView({ name, messages = [], items = [], files = [], extraTab }) {
  const tabs = [];
  if (messages.length) tabs.push({ key: "messages", label: "Messages", Icon: AudioLines });
  if (items.length) tabs.push({ key: "accounts", label: "Accounts", Icon: KeyRound });
  if (files.length) tabs.push({ key: "files", label: "Files", Icon: Paperclip });
  if (extraTab) tabs.push({ key: extraTab.key || "talk", label: extraTab.label, Icon: extraTab.Icon });

  const [tab, setTab] = useState(tabs[0]?.key);
  const active = tabs.find((t) => t.key === tab)?.key || tabs[0]?.key;
  const talkKey = extraTab?.key || "talk";

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
        lines.push(`\n- ${it.label} [${it.platform || it.type}]`);
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

  if (tabs.length === 0) {
    return (
      <div className="text-center py-12">
        <Candle size={64} still />
        <p className="text-mist text-sm max-w-sm mx-auto mt-5 leading-relaxed">
          There was nothing left specifically in your care — but thank you for being someone {name || "they"} trusted.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto -mx-1 px-1 mb-8">
        <div className="seg w-max">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`seg-btn ${active === t.key ? "seg-btn-active" : ""}`}>
              <t.Icon size={15} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      {active === "messages" && <MessagesSection messages={messages} />}
      {active === "accounts" && <AccountsSection items={items} />}
      {active === "files" && <FilesSection files={files} />}
      {extraTab && active === talkKey && extraTab.node}

      {active !== talkKey && (
        <div className="mt-8">
          <button className="btn-secondary btn-sm" onClick={downloadAll}><Download size={14} /> Save a copy of everything</button>
        </div>
      )}
    </div>
  );
}

function MessagesSection({ messages }) {
  return (
    <>
      <p className="text-sm text-mist mb-5">Read slowly. There's no rush.</p>
      <div className="space-y-4">
        {messages.map((m, i) => (
          <article key={m.id} className="surface p-8 rise" style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}>
            <p className="eyebrow mb-4">For {m.recipientName || "the family"}</p>
            <p className="font-display text-[1.2rem] sm:text-[1.35rem] leading-[1.7] text-ink max-w-[34rem]">{m.text}</p>
            {m.audioUrl && (
              <div className="mt-6">
                <AudioPlayer src={m.audioUrl} />
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="text-xs text-mist">In their own voice</span>
                  <a href={m.audioUrl} download="message.mp3" className="inline-flex items-center gap-1.5 text-xs text-ember hover:underline"><Download size={12} /> Save audio</a>
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
    </>
  );
}

function AccountsSection({ items }) {
  return (
    <>
      <p className="text-sm text-mist mb-5">Tap any value to copy it.</p>
      <div className="space-y-4">
        {items.map((it, idx) => {
          const Icon = (it.platform && providerIcon(it.platform)) || Paperclip;
          return (
            <article key={idx} className="surface p-6 rise" style={{ animationDelay: `${Math.min(idx, 6) * 50}ms` }}>
              <div className="flex items-center gap-3.5 mb-4">
                <span className="grid place-items-center h-10 w-10 rounded-xl bg-paper border border-line/70 text-ink shrink-0"><Icon size={19} /></span>
                <div className="min-w-0">
                  <p className="font-medium text-ink truncate">{it.label}</p>
                  <p className="eyebrow mt-0.5">{it.platform || it.type}</p>
                </div>
              </div>
              {it.locked ? (
                <p className="text-xs text-mist flex items-center gap-1.5 bg-paper/70 rounded-xl px-3 py-2.5"><Lock size={13} /> Encrypted — opens when two guardians combine their keys.</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(it.fields || {}).map(([k, v]) => <Cred key={k} field={k} value={String(v)} />)}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}

function FilesSection({ files }) {
  return (
    <div className="space-y-2">
      {files.map((f) => {
        const Glyph = /^image\//.test(f.mimeType || "") ? ImageIcon : Paperclip;
        return (
          <div key={f.id} className="surface flex items-center gap-3.5 px-4 py-3 rise">
            <span className="grid place-items-center h-10 w-10 rounded-xl bg-paper border border-line/70 text-graphite shrink-0"><Glyph size={17} /></span>
            <span className="flex-1 min-w-0 text-sm text-ink truncate">{f.name}</span>
            <a href={f.dataUrl} download={f.name} className="btn-secondary btn-sm"><Download size={13} /> Download</a>
          </div>
        );
      })}
    </div>
  );
}

// A single credential row — masks secrets, reveals on demand, copies on tap. A non-interactive
// container with SIBLING buttons (copy + reveal) so both are keyboard-reachable.
const SECRET_RE = /pass|secret|seed|private|pin|cvv|key|otp/i;
function Cred({ field, value }) {
  const secret = SECRET_RE.test(field);
  const [show, setShow] = useState(!secret);
  const [copied, setCopied] = useState(false);
  const label = field.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
  const copy = async () => {
    try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1400); } catch {}
  };
  return (
    <div className="group flex items-center gap-2 rounded-xl bg-paper/60 hover:bg-paper px-3.5 py-2.5 transition">
      <button onClick={copy} aria-label={`Copy ${label}`} className="min-w-0 flex-1 text-left rounded-lg focus-visible:outline-none focus-visible:shadow-focus">
        <p className="eyebrow mb-0.5">{label}</p>
        <p className="mono text-sm text-ink break-all">{show ? value : "•".repeat(Math.min(12, value.length || 8))}</p>
      </button>
      <span aria-live="polite" className="sr-only">{copied ? "Copied" : ""}</span>
      {secret && (
        <button onClick={() => setShow((s) => !s)} aria-label={show ? "Hide value" : "Show value"} aria-pressed={show}
          className="text-mist hover:text-ink p-1.5 shrink-0 rounded-lg focus-visible:outline-none focus-visible:shadow-focus">
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      )}
      <button onClick={copy} aria-label={`Copy ${label}`} className="shrink-0 p-1.5 rounded-lg focus-visible:outline-none focus-visible:shadow-focus">
        {copied ? <Check size={15} className="text-sage-600" /> : <Copy size={15} className="text-mist group-hover:text-ember" />}
      </button>
    </div>
  );
}
