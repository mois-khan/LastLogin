import { useState } from "react";
import { useParams } from "react-router-dom";
import { Mail, Loader2, ShieldCheck, Lock, ArrowRight, Download, AudioLines, Paperclip, KeyRound } from "lucide-react";
import { api } from "../../lib/api.js";

// A guardian verifies their email (OTP), then sees — in strict order — the messages left
// for the family, the accounts/assets granted to them, and their files. Deletion-flagged
// items never reach this screen (filtered server-side).
export default function GuardianPortal() {
  const { userId } = useParams();
  const [email, setEmail] = useState("");
  const [step, setStep] = useState("email"); // email | code | done
  const [otpInfo, setOtpInfo] = useState(null);
  const [code, setCode] = useState("");
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const requestOtp = async (e) => {
    e?.preventDefault(); setErr(""); setBusy(true);
    try { setOtpInfo((await api.post("/trigger/guardian-otp", { userId, email: email.trim() })).data); setStep("code"); }
    catch (e2) { setErr(e2.response?.data?.error || "Couldn't send a code."); } finally { setBusy(false); }
  };
  const verify = async (e) => {
    e?.preventDefault(); setErr(""); setBusy(true);
    try { setData((await api.post("/trigger/guardian-access", { userId, email: email.trim(), code: code.trim() })).data); setStep("done"); }
    catch (e2) { setErr(e2.response?.data?.error || "Invalid code."); } finally { setBusy(false); }
  };

  // Export everything granted: a readable credentials file + each attached file.
  const downloadAll = () => {
    const lines = [`LastLogin — released to ${data.name}`, ""];
    if (data.messages?.length) {
      lines.push("=== MESSAGES ===");
      data.messages.forEach((m) => lines.push(`\nFor ${m.recipientName || "family"} (${m.language}):`, m.text));
      lines.push("");
    }
    if (data.items?.length) {
      lines.push("=== ACCOUNTS & ASSETS ===");
      data.items.forEach((it) => {
        lines.push(`\n• ${it.label} [${it.platform || it.type}]`);
        if (it.locked) lines.push("  (encrypted — opens with the guardian quorum)");
        else Object.entries(it.fields || {}).forEach(([k, v]) => lines.push(`  ${k}: ${v}`));
      });
    }
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `lastlogin-${data.name || "estate"}.txt`; a.click();
    URL.revokeObjectURL(url);
    (data.files || []).forEach((f, i) => setTimeout(() => {
      const el = document.createElement("a"); el.href = f.dataUrl; el.download = f.name; el.click();
    }, 200 * (i + 1)));
  };

  if (step === "done" && data) {
    const executing = data.estateState === "EXECUTING";
    const hasAny = (data.messages?.length || 0) + (data.items?.length || 0) + (data.files?.length || 0) > 0;
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-2xl px-6 py-16">
          <p className="text-xs uppercase tracking-[0.2em] text-mist">Guardian access</p>
          <h1 className="font-display text-title mt-2 mb-1">Welcome, {data.name}</h1>

          {!executing ? (
            <div className="card text-center py-12 text-mist mt-6">
              <ShieldCheck size={26} className="mx-auto mb-2 text-sage-600" />
              Nothing is released while they're alive. You'll have access here once a passing is verified.
            </div>
          ) : (
            <>
              <p className="text-mist mb-8">Everything they left for you.</p>

              {/* 1 — Audio phase: messages first */}
              <section className="mb-8">
                <h2 className="font-display text-h mb-3 flex items-center gap-2"><AudioLines size={18} className="text-ember" /> Their messages</h2>
                {data.messages?.length ? (
                  <div className="space-y-3">
                    {data.messages.map((m) => (
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

              {/* 2 — Asset phase: only what was toggled on for this guardian */}
              <section className="mb-8">
                <h2 className="font-display text-h mb-3 flex items-center gap-2"><KeyRound size={18} className="text-ember" /> Accounts & assets</h2>
                {data.items?.length ? (
                  <div className="space-y-3">
                    {data.items.map((it, idx) => (
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

              {/* 3 — Files */}
              {data.files?.length > 0 && (
                <section className="mb-8">
                  <h2 className="font-display text-h mb-3 flex items-center gap-2"><Paperclip size={18} className="text-ember" /> Files</h2>
                  <ul className="space-y-2">
                    {data.files.map((f) => (
                      <li key={f.id} className="card flex items-center gap-3 !py-3">
                        <span className="flex-1 min-w-0 text-sm truncate">{f.name}</span>
                        <a href={f.dataUrl} download={f.name} className="btn-secondary btn-sm"><Download size={13} /> Download</a>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* 4 — Export everything */}
              {hasAny && (
                <button className="btn-primary w-full" onClick={downloadAll}><Download size={16} /> Download everything</button>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="card max-w-sm w-full rise">
        <span className="grid place-items-center h-12 w-12 rounded-xl bg-sage/12 text-sage-600 mb-5"><ShieldCheck size={22} /></span>
        <h1 className="font-display text-h mb-1">Guardian access</h1>
        <p className="text-sm text-mist mb-6">Confirm the email you were entrusted with to continue.</p>
        {step === "email" ? (
          <form onSubmit={requestOtp}>
            <label className="label">Your email</label>
            <input className="field mb-4" type="email" value={email} autoFocus placeholder="you@example.com"
              onChange={(e) => setEmail(e.target.value)} />
            <button className="btn-primary w-full" disabled={busy || !email.trim()}>
              {busy ? <Loader2 size={16} className="animate-spin" /> : <>Send me a code <ArrowRight size={16} /></>}
            </button>
          </form>
        ) : (
          <form onSubmit={verify}>
            <p className="text-xs text-mist flex items-center gap-1.5 mb-2"><Mail size={13} /> Code sent to {email}</p>
            {otpInfo?.demoCode && <p className="text-xs text-mist mb-2">Demo code: <span className="mono text-ink">{otpInfo.demoCode}</span></p>}
            <input className="field mb-4 mono tracking-[0.3em]" placeholder="000000" maxLength={6} value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
            <button className="btn-primary w-full" disabled={busy || code.length < 6}>
              {busy ? <Loader2 size={16} className="animate-spin" /> : "Enter"}
            </button>
          </form>
        )}
        {err && <p className="text-sm text-ember mt-3">{err}</p>}
      </div>
    </div>
  );
}
