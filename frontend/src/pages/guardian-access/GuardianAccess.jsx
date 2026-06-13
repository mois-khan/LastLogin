import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Loader2, ShieldCheck, ArrowRight, ArrowLeft } from "lucide-react";
import { api } from "../../lib/api.js";
import Candle from "../../components/ui/Candle.jsx";
import GuardianGrantView from "../../components/GuardianGrantView.jsx";

// Universal guardian hub. A guardian enters their OWN email — no userId needed — and
// re-verifies with a fresh code every visit. They see only the estates they guard, and
// for each, only what was assigned to them.
export default function GuardianAccess() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [step, setStep] = useState("email"); // email | code | done
  const [otpInfo, setOtpInfo] = useState(null);
  const [code, setCode] = useState("");
  const [estates, setEstates] = useState([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const start = async (e) => {
    e?.preventDefault(); setErr(""); setBusy(true);
    try { setOtpInfo((await api.post("/trigger/guardian-start", { email: email.trim() })).data); setStep("code"); }
    catch (e2) { setErr(e2.response?.data?.error || "Couldn't send a code."); } finally { setBusy(false); }
  };
  const verify = async (e) => {
    e?.preventDefault(); setErr(""); setBusy(true);
    try { setEstates((await api.post("/trigger/guardian-portal", { email: email.trim(), code: code.trim() })).data.estates); setStep("done"); }
    catch (e2) { setErr(e2.response?.data?.error || "Invalid code."); } finally { setBusy(false); }
  };
  const reset = () => { setStep("email"); setCode(""); setEstates([]); setOtpInfo(null); setErr(""); };

  if (step === "done") {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-2xl px-6 py-16">
          <p className="text-xs uppercase tracking-[0.2em] text-mist">Guardian access</p>
          <h1 className="font-display text-title mt-2 mb-1">What was left in your care</h1>
          <p className="text-mist mb-8">Verified as {email}.</p>

          {estates.length === 0 ? (
            <div className="card text-center py-12 text-mist"><ShieldCheck size={26} className="mx-auto mb-2 text-sage-600" /> Nothing is shared with you yet.</div>
          ) : estates.map((es) => {
            const executing = es.estateState === "EXECUTING";
            return (
              <section key={es.userId} className="mb-10 pb-10 border-b border-line last:border-0 last:pb-0">
                <div className="flex items-center gap-2.5 mb-4">
                  <Candle size={26} still={executing} />
                  <h2 className="font-display text-h flex-1">{es.ownerName}</h2>
                  {!executing && <span className="pill bg-sage/12 text-sage-600">still with us</span>}
                </div>
                {executing ? (
                  <GuardianGrantView name={es.guardianName} messages={es.messages} items={es.items} files={es.files} />
                ) : (
                  <div className="card">
                    <p className="text-sm text-graphite mb-3">Nothing is released while {es.ownerName} is alive. If they've passed, you can begin the verified handover.</p>
                    <button className="btn-secondary btn-sm" onClick={() => nav(`/report/${es.userId}`)}>Report a passing <ArrowRight size={14} /></button>
                  </div>
                )}
              </section>
            );
          })}

          <button onClick={reset} className="text-sm text-mist hover:text-ink flex items-center gap-1.5"><ArrowLeft size={14} /> Lock and exit</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="card max-w-sm w-full rise">
        <Candle size={48} />
        <h1 className="font-display text-h mt-4 mb-1">Guardian access</h1>
        <p className="text-sm text-mist mb-6">Enter the email you were entrusted with. We send a one-time code each time you visit.</p>
        {step === "email" ? (
          <form onSubmit={start}>
            <label className="label">Your email</label>
            <input className="field mb-4" type="email" value={email} autoFocus placeholder="you@example.com" onChange={(e) => setEmail(e.target.value)} />
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
            <button type="button" onClick={reset} className="w-full mt-2 text-xs text-mist hover:text-ink">Use a different email</button>
          </form>
        )}
        {err && <p className="text-sm text-ember mt-3">{err}</p>}
        <p className="mt-5 flex items-center gap-2 text-xs text-mist"><ShieldCheck size={14} className="text-sage-600" /> You only ever see what was assigned to you.</p>
      </div>
    </div>
  );
}
