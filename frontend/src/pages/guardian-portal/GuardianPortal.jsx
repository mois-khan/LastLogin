import { useState } from "react";
import { useParams } from "react-router-dom";
import { Mail, Loader2, ShieldCheck, Lock, ArrowRight, Download } from "lucide-react";
import { api } from "../../lib/api.js";

// A guardian verifies their email (OTP) and accesses exactly what the owner permitted (RBAC).
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

  if (step === "done" && data) {
    const executing = data.estateState === "EXECUTING";
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-2xl px-6 py-16">
          <p className="text-xs uppercase tracking-[0.2em] text-mist">Guardian access</p>
          <h1 className="font-display text-title mt-2 mb-1">Welcome, {data.name}</h1>
          <p className="text-mist mb-8">You're entrusted with: <span className="text-ink">{data.access?.length ? data.access.join(", ") : "no categories yet"}</span>.</p>

          {!executing ? (
            <div className="card text-center py-12 text-mist">
              <ShieldCheck size={26} className="mx-auto mb-2 text-sage-600" />
              Nothing is released while they're alive. You'll have access here once a passing is verified.
            </div>
          ) : (
            <>
              {data.items?.length > 0 && (
                <div className="space-y-3">
                  {data.items.map((it, idx) => (
                    <div key={idx} className="card rise">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="flex-1 font-medium">{it.label}</span>
                        <span className="pill bg-paper text-mist border border-line">{it.type}</span>
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
              )}

              {data.messages?.length > 0 && (
                <section className="mt-8">
                  <h2 className="font-display text-h mb-3">Messages left for the family</h2>
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
                </section>
              )}

              {!data.items?.length && !data.messages?.length && (
                <p className="text-mist">Nothing is shared with you.</p>
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
