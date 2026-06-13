import { useState } from "react";
import { useParams } from "react-router-dom";
import { Mail, Loader2, ShieldCheck, ArrowRight } from "lucide-react";
import { api } from "../../lib/api.js";
import GuardianGrantView from "../../components/GuardianGrantView.jsx";

// Direct per-estate link (/guardian/:userId). The universal entry is /access, which needs
// no userId — but this stays for a shared deep link. Re-verified each visit.
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
          {!executing ? (
            <div className="card text-center py-12 text-mist mt-6">
              <ShieldCheck size={26} className="mx-auto mb-2 text-sage-600" />
              Nothing is released while they're alive. You'll have access here once a passing is verified.
            </div>
          ) : (
            <>
              <p className="text-mist mb-8">Everything they left for you.</p>
              <GuardianGrantView name={data.name} messages={data.messages} items={data.items} files={data.files} />
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
