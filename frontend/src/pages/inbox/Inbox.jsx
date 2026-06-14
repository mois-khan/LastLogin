import { useState } from "react";
import { useParams } from "react-router-dom";
import { Mail, Loader2, Lock, Download, ArrowRight } from "lucide-react";
import { api } from "../../lib/api.js";
import AudioPlayer from "../../components/ui/AudioPlayer.jsx";

// A chosen recipient verifies their email (OTP) to open the messages left for them.
export default function Inbox() {
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
    try { setOtpInfo((await api.post("/trigger/recipient-otp", { userId, email: email.trim() })).data); setStep("code"); }
    catch (e2) { setErr(e2.response?.data?.error || "Couldn't send a code."); }
    finally { setBusy(false); }
  };
  const verify = async (e) => {
    e?.preventDefault(); setErr(""); setBusy(true);
    try { setData((await api.post("/trigger/inbox", { userId, email: email.trim(), code: code.trim() })).data); setStep("done"); }
    catch (e2) { setErr(e2.response?.data?.error || "Invalid code."); }
    finally { setBusy(false); }
  };

  if (step === "done" && data) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-2xl px-6 py-16">
          <h1 className="font-display text-title mb-2">A message from {data.from}</h1>
          <p className="text-mist mb-8">Left for you, with love.</p>
          {data.messages?.length ? data.messages.map((m) => (
            <div key={m._id} className="card mb-5 rise">
              <p className="text-lg leading-relaxed mb-3">{m.text}</p>
              {m.audioUrl && (
                <>
                  <AudioPlayer src={m.audioUrl} />
                  <a href={m.audioUrl} download="message.mp3" className="inline-flex items-center gap-1.5 mt-3 text-xs text-ember hover:underline"><Download size={13} /> Download</a>
                </>
              )}
            </div>
          )) : <p className="text-mist">No messages were left for this address - but you were trusted enough to be given a way in.</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="card max-w-sm w-full rise">
        <span className="grid place-items-center h-12 w-12 rounded-xl bg-ember/12 text-ember mb-5"><Lock size={22} /></span>
        <h1 className="font-display text-h mb-1">Open your message</h1>
        <p className="text-sm text-mist mb-6">A message was left for you. Confirm your email to open it.</p>
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
              {busy ? <Loader2 size={16} className="animate-spin" /> : "Open message"}
            </button>
          </form>
        )}
        {err && <p className="text-sm text-ember mt-3">{err}</p>}
      </div>
    </div>
  );
}
