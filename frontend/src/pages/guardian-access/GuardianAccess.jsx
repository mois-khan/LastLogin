import { useState } from "react";
import { Mail, Loader2, ShieldCheck, ArrowRight, ArrowLeft, Upload, Sparkles } from "lucide-react";
import { api } from "../../lib/api.js";
import Candle from "../../components/ui/Candle.jsx";
import GuardianGrantView from "../../components/GuardianGrantView.jsx";
import CloneChat from "../../components/CloneChat.jsx";

// The universal guardian hub at /access. A guardian who is NOT logged in finds an estate by
// the deceased's email or phone, proves they're a named guardian with a one-time code, then
// either receives what was left in their care (once 2 guardians confirm) or reports the
// passing by uploading a death certificate - which counts as their own confirmation.
//
// Stateless on purpose: everything lives in React state and is lost on reload, so each visit
// re-verifies. We never show other guardians' names or emails - only counts.

// A calm sage progress bar. Reads e.g. "1 of 3 confirmed · 2 needed".
function StatusBar({ confirmed = 0, total = 0, threshold = 2 }) {
  const pct = total ? Math.min(100, Math.round((confirmed / total) * 100)) : 0;
  return (
    <div className="card !py-4 mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-graphite">
          <span className="mono text-ink">{confirmed}</span> of{" "}
          <span className="mono text-ink">{total}</span> confirmed
        </span>
        <span className="pill bg-sage/12 text-sage-600">{threshold} needed</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-line overflow-hidden">
        <div
          className="h-full rounded-full bg-sage-600 transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function GuardianAccess() {
  const [step, setStep] = useState("identify"); // identify | yourEmail | code | portal
  const [identifier, setIdentifier] = useState(""); // deceased's email or phone
  const [estate, setEstate] = useState(null); // { userId, ownerName, estateState, confirmedGuardians, threshold, totalGuardians }
  const [guardianEmail, setGuardianEmail] = useState(""); // the guardian's OWN email
  const [otpInfo, setOtpInfo] = useState(null); // { name, sent, demoCode }
  const [code, setCode] = useState("");
  const [state, setState] = useState(null); // session: { token, guardianName, ownerName, estateState, youConfirmed, executing, confirmedGuardians, threshold, totalGuardians, items?, files?, messages? }
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [verifying, setVerifying] = useState(false); // cert verification in flight
  const [certReason, setCertReason] = useState(""); // last rejection reason
  const [talkOpen, setTalkOpen] = useState(false); // mobile: clone-chat slide-over open

  // Counts shown in the status bar prefer the live session, falling back to the lookup.
  const confirmed = state?.confirmedGuardians ?? estate?.confirmedGuardians ?? 0;
  const total = state?.totalGuardians ?? estate?.totalGuardians ?? 0;
  const threshold = state?.threshold ?? estate?.threshold ?? 2;
  const ownerName = state?.ownerName || estate?.ownerName || "this person";

  const reset = () => {
    setStep("identify");
    setIdentifier("");
    setEstate(null);
    setGuardianEmail("");
    setOtpInfo(null);
    setCode("");
    setState(null);
    setErr("");
    setBusy(false);
    setVerifying(false);
    setCertReason("");
    setTalkOpen(false);
  };

  // STEP 1 - find the estate by the deceased's email or phone.
  const lookupEstate = async (e) => {
    e?.preventDefault();
    setErr(""); setBusy(true);
    try {
      const { data } = await api.post("/trigger/lookup-estate", { identifier: identifier.trim() });
      setEstate(data);
      setStep("yourEmail");
    } catch (e2) {
      setErr(e2.response?.data?.error || "No estate found for that email or phone.");
    } finally {
      setBusy(false);
    }
  };

  // STEP 2 - confirm this visitor is a named guardian, send them a code.
  const sendOtp = async (e) => {
    e?.preventDefault();
    setErr(""); setBusy(true);
    try {
      const { data } = await api.post("/trigger/guardian-otp", {
        userId: estate.userId,
        email: guardianEmail.trim(),
      });
      setOtpInfo(data);
      setStep("code");
    } catch (e2) {
      setErr(e2.response?.data?.error || "That email isn't a guardian for this person.");
    } finally {
      setBusy(false);
    }
  };

  // STEP 3 - exchange the code for a session + the current estate state.
  const verifyCode = async (e) => {
    e?.preventDefault();
    setErr(""); setBusy(true);
    try {
      const { data } = await api.post("/trigger/guardian-session", {
        userId: estate.userId,
        email: guardianEmail.trim(),
        code: code.trim(),
      });
      setState(data);
      setStep("portal");
    } catch (e2) {
      setErr(e2.response?.data?.error || "Invalid or expired code.");
    } finally {
      setBusy(false);
    }
  };

  // PORTAL - upload a death certificate. This counts as this guardian's confirmation.
  // The session token MUST travel in the FormData (the api interceptor overwrites the
  // Authorization header with the owner's token, so a header alone won't reach the route).
  const uploadCert = async (file) => {
    if (!file) return;
    setErr(""); setCertReason(""); setVerifying(true);
    try {
      const fd = new FormData();
      fd.append("cert", file);
      fd.append("token", state.token);
      const { data } = await api.post("/trigger/guardian-cert", fd);
      if (!data.certValid) {
        setCertReason(data.reason || "We couldn't read that as a valid certificate. Try a clearer copy.");
        return;
      }
      // Merge the fresh counts/state, keeping the token we already hold.
      setState((s) => ({ ...s, ...data, youConfirmed: true }));
    } catch (e2) {
      setErr(e2.response?.data?.error || "Upload failed. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  // PORTAL - re-poll the estate without re-uploading (flips to grants once executing).
  const checkAgain = async () => {
    setErr(""); setBusy(true);
    try {
      const { data } = await api.post("/trigger/guardian-state", { token: state.token });
      setState((s) => ({ ...s, ...data }));
    } catch (e2) {
      setErr(e2.response?.data?.error || "Couldn't refresh just now.");
    } finally {
      setBusy(false);
    }
  };

  // ---- PORTAL ----
  if (step === "portal" && state) {
    const executing = state.executing === true;
    const youConfirmed = state.youConfirmed === true;
    const cloneName = state.ownerName || ownerName;
    const firstName = cloneName.split(" ")[0] || "them";

    // The companion chat, wired to the guardian session. The token travels in the request body -
    // the api interceptor stamps the owner's token on the Authorization header, so a header won't reach.
    const cloneChat = (extra = {}) => (
      <CloneChat name={cloneName} dock {...extra}
        sendMessage={(message, language, withAudio) => api.post("/clone/chat", { token: state.token, message, language, withAudio }).then((r) => r.data)}
        loadHistory={() => api.post("/clone/history", { token: state.token }).then((r) => r.data)}
        clearHistory={() => api.post("/clone/history/clear", { token: state.token })}
        uploadContext={(file) => { const fd = new FormData(); fd.append("chat", file); fd.append("token", state.token); return api.post("/clone/guardian-context", fd).then((r) => r.data); }}
        transcribe={(blob) => { const fd = new FormData(); fd.append("audio", blob, "a.wav"); fd.append("token", state.token); return api.post("/clone/transcribe", fd).then((r) => r.data); }} />
    );

    return (
      <div className="min-h-screen">
        <div className={`mx-auto px-4 sm:px-6 py-12 lg:py-14 ${executing ? "max-w-6xl" : "max-w-2xl"}`}>
          <button
            onClick={reset}
            className="text-sm text-mist hover:text-ink flex items-center gap-1.5 mb-6"
          >
            <ArrowLeft size={14} /> Lock and exit
          </button>

          <div className="flex items-center gap-3 mb-5">
            <Candle size={30} still={executing} />
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-mist">Guardian access</p>
              <h1 className="font-display text-title">{ownerName}</h1>
            </div>
          </div>

          <StatusBar confirmed={confirmed} total={total} threshold={threshold} />

          {executing ? (
            <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-7 lg:items-start">
              <div className="min-w-0">
                <GuardianGrantView
                  name={state.guardianName}
                  messages={state.messages}
                  items={state.items}
                  files={state.files}
                  guardianWallet={state.guardianWallet}
                />
              </div>
              {/* Desktop: the clone chat, docked like an IDE side panel - always present. */}
              <aside className="hidden lg:block lg:sticky lg:top-6">
                <div className="h-[calc(100vh-7.5rem)]">{cloneChat()}</div>
              </aside>
            </div>
          ) : youConfirmed ? (
            // This guardian has already confirmed (via prior cert or upload this visit).
            <div className="card rise">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={18} className="text-sage-600" />
                <h2 className="font-display text-h">Your confirmation is in</h2>
              </div>
              <p className="text-sm text-graphite leading-relaxed mb-5">
                Verified. We're waiting for one more guardian to agree - they've been notified
                by email. Nothing is released until {threshold} guardians confirm. You can
                check back here at any time.
              </p>
              <button className="btn-secondary btn-sm" onClick={checkAgain} disabled={busy}>
                {busy ? <Loader2 size={14} className="animate-spin" /> : "Check again"}
              </button>
              {err && <p className="text-sm text-ember mt-3">{err}</p>}
            </div>
          ) : (
            // Report a passing - upload a death certificate to cast this guardian's confirmation.
            <div className="card rise">
              <h2 className="font-display text-h mb-2">Report a passing</h2>
              <p className="text-sm text-graphite leading-relaxed mb-2">
                Nothing in {ownerName}'s estate is released until {threshold} guardians confirm.
                Uploading a death certificate counts as your confirmation - it's reviewed
                privately, and never shown to anyone.
              </p>
              <p className="text-xs text-mist mb-5">Accepted: a photo or PDF of the certificate.</p>

              {certReason && (
                <p className="text-sm text-ember mb-3">{certReason}</p>
              )}

              {verifying ? (
                <div className="flex items-center gap-2 text-sm text-graphite py-2">
                  <Loader2 size={16} className="animate-spin text-ember" />
                  Verifying with Gemini Vision…
                </div>
              ) : (
                // Resetting value on click lets a guardian re-pick the SAME file after a rejection
                // (browsers skip onChange for an identical re-selection otherwise).
                <label className={`btn-sm cursor-pointer inline-flex ${certReason ? "btn-secondary" : "btn-primary"}`}>
                  <Upload size={16} /> {certReason ? "Try another file" : "Upload certificate"}
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onClick={(e) => { e.target.value = ""; }}
                    onChange={(e) => uploadCert(e.target.files?.[0])}
                  />
                </label>
              )}
              {err && <p className="text-sm text-ember mt-3">{err}</p>}
            </div>
          )}
        </div>

        {/* Mobile: a floating button opens the clone chat as a full-height sheet. */}
        {executing && (
          <>
            <button
              onClick={() => setTalkOpen(true)}
              className="lg:hidden fixed bottom-5 right-5 z-40 btn-primary rounded-full h-14 pl-5 pr-6 text-[15px] shadow-glow"
            >
              <Sparkles size={18} /> Talk with {firstName}
            </button>
            {talkOpen && (
              <div className="lg:hidden fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm" onClick={() => setTalkOpen(false)}>
                <div className="absolute inset-x-0 bottom-0 top-10 sm:top-16 p-3 sheet-up" onClick={(e) => e.stopPropagation()}>
                  <div className="h-full max-w-md mx-auto">{cloneChat({ onClose: () => setTalkOpen(false) })}</div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // ---- IDENTIFY / YOUR EMAIL / CODE (centered card) ----
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm rise">
        {/* Status bar appears as soon as we've found an estate. */}
        {estate && step !== "identify" && (
          <div className="mb-4">
            <div className="flex items-center gap-2.5 mb-3">
              <Candle size={26} />
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-mist">Estate of</p>
                <p className="font-display text-h leading-tight">{ownerName}</p>
              </div>
            </div>
            <StatusBar confirmed={confirmed} total={total} threshold={threshold} />
          </div>
        )}

        <div className="card">
          {step === "identify" && (
            <>
              <Candle size={48} />
              <h1 className="font-display text-h mt-4 mb-1">Guardian access</h1>
              <p className="text-sm text-mist mb-6">
                Enter the email or phone of the person whose estate you help protect. You'll
                verify it's you before anything is shown.
              </p>
              <form onSubmit={lookupEstate}>
                <label className="label">Their email or phone</label>
                <input
                  className="field mb-4"
                  value={identifier}
                  autoFocus
                  placeholder="name@example.com"
                  onChange={(e) => setIdentifier(e.target.value)}
                />
                <button className="btn-primary w-full" disabled={busy || !identifier.trim()}>
                  {busy ? <Loader2 size={16} className="animate-spin" /> : <>Find the estate <ArrowRight size={16} /></>}
                </button>
              </form>
            </>
          )}

          {step === "yourEmail" && (
            <>
              <h1 className="font-display text-h mb-1">Verify it's you</h1>
              <p className="text-sm text-mist mb-6">
                Enter the email you were entrusted with as a guardian for {ownerName}.
              </p>
              <form onSubmit={sendOtp}>
                <label className="label">Your email</label>
                <input
                  className="field mb-4"
                  type="email"
                  value={guardianEmail}
                  autoFocus
                  placeholder="you@example.com"
                  onChange={(e) => setGuardianEmail(e.target.value)}
                />
                <button className="btn-primary w-full" disabled={busy || !guardianEmail.trim()}>
                  {busy ? <Loader2 size={16} className="animate-spin" /> : <>Send me a code <ArrowRight size={16} /></>}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep("identify"); setErr(""); }}
                  className="w-full mt-2 text-xs text-mist hover:text-ink flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft size={13} /> Different person
                </button>
              </form>
            </>
          )}

          {step === "code" && (
            <>
              <h1 className="font-display text-h mb-1">Enter your code</h1>
              <p className="text-xs text-mist flex items-center gap-1.5 mb-2">
                <Mail size={13} /> Sent to {guardianEmail}
              </p>
              {otpInfo?.demoCode && (
                <p className="text-xs text-mist mb-3">
                  Demo code: <span className="mono text-ink">{otpInfo.demoCode}</span>
                </p>
              )}
              <form onSubmit={verifyCode}>
                <input
                  className="field mb-4 mono tracking-[0.3em]"
                  placeholder="000000"
                  maxLength={6}
                  inputMode="numeric"
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                />
                <button className="btn-primary w-full" disabled={busy || code.length < 6}>
                  {busy ? <Loader2 size={16} className="animate-spin" /> : "Enter"}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep("yourEmail"); setCode(""); setErr(""); }}
                  className="w-full mt-2 text-xs text-mist hover:text-ink flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft size={13} /> Use a different email
                </button>
              </form>
            </>
          )}

          {err && <p className="text-sm text-ember mt-3">{err}</p>}

          <p className="mt-5 flex items-center gap-2 text-xs text-mist">
            <ShieldCheck size={14} className="text-sage-600" /> You only ever see what was left in your care.
          </p>
        </div>
      </div>
    </div>
  );
}
