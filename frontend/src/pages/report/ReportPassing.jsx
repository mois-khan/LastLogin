import { useRef, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Upload, ShieldCheck, ShieldAlert, Loader2, Users, FileText, Check, ArrowRight } from "lucide-react";
import { api } from "../../lib/api.js";

// Guardian-facing. Two steps: (1) Gemini Vision verifies a death certificate,
// (2) 2 of 3 guardians independently confirm → the estate executes.
export default function ReportPassing() {
  const { userId } = useParams();
  const nav = useNavigate();
  const fileRef = useRef(null);
  const [fileName, setFileName] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [cert, setCert] = useState(null);
  const [err, setErr] = useState("");

  const [status, setStatus] = useState(null); // { guardians, confirmedGuardians, estateState }
  const [confirming, setConfirming] = useState(null); // index being confirmed

  const loadStatus = async () => setStatus((await api.get(`/trigger/status/${userId}`)).data);
  useEffect(() => { loadStatus().catch(() => {}); }, [userId]);

  const onFile = async (file) => {
    if (!file) return;
    setFileName(file.name); setErr(""); setCert(null); setVerifying(true);
    try {
      const fd = new FormData();
      fd.append("cert", file); fd.append("userId", userId);
      setCert((await api.post("/trigger/verify", fd)).data);
    } catch (e) {
      setErr(e.response?.data?.error || "Couldn't verify that file. Try a clear photo or scan.");
    } finally { setVerifying(false); }
  };

  const confirm = async (i) => {
    setConfirming(i);
    try {
      await api.post("/trigger/confirm", { userId, guardianIndex: i });
      await loadStatus();
    } finally { setConfirming(null); }
  };

  const executing = status?.estateState === "EXECUTING" || (status?.confirmedGuardians ?? 0) >= 2;
  const verified = cert?.looksValid;

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-xl px-6 py-16">
        <p className="text-xs uppercase tracking-[0.2em] text-mist">Guardian verification</p>
        <h1 className="mt-3 font-display text-title">Report a passing</h1>
        <p className="mt-4 text-graphite leading-relaxed">
          A careful, verified handover. Nothing is released by one person —
          a certificate is verified, then <span className="text-ink font-medium">2 of 3 guardians</span> must confirm.
        </p>

        {/* Steps */}
        <div className="mt-8 flex items-center gap-3 text-sm">
          <Step n={1} label="Verify certificate" active={!verified} done={verified} />
          <span className="h-px flex-1 bg-line" />
          <Step n={2} label="Guardians confirm" active={verified && !executing} done={executing} />
        </div>

        {/* STEP 1 — certificate */}
        {!verified && (
          <div className="mt-8">
            <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])} />
            <button onClick={() => fileRef.current?.click()} disabled={verifying}
              className="w-full card card-hover border-dashed flex flex-col items-center justify-center py-12 text-center">
              {verifying ? (
                <><Loader2 size={26} className="text-ember animate-spin" /><span className="mt-3 text-sm text-graphite">Verifying with Gemini Vision…</span></>
              ) : (
                <>
                  <span className="grid place-items-center h-12 w-12 rounded-xl bg-ember/12 text-ember"><Upload size={22} /></span>
                  <span className="mt-3 font-medium">Upload the death certificate</span>
                  <span className="mt-1 text-sm text-mist">{fileName || "A clear photo or scan — JPG, PNG, or PDF"}</span>
                </>
              )}
            </button>
            {err && <p className="mt-4 text-sm text-ember">{err}</p>}
            {cert && !cert.looksValid && (
              <div className="mt-6 card border-ember/40 rise">
                <div className="flex items-center gap-2 text-ember"><ShieldAlert size={20} /><span className="font-medium">This doesn't look like a valid certificate</span></div>
                <p className="mt-2 text-sm text-graphite flex items-start gap-2"><FileText size={15} className="mt-0.5 shrink-0 text-mist" />{cert.reason}</p>
              </div>
            )}
          </div>
        )}

        {/* Verified certificate summary */}
        {verified && (
          <div className="mt-6 card border-sage/40 rise">
            <div className="flex items-center gap-2 text-sage-600"><ShieldCheck size={20} /><span className="font-medium">Certificate verified</span></div>
            <dl className="mt-4 grid sm:grid-cols-3 gap-4 text-sm">
              <Field label="Name" value={cert.deceasedName} />
              <Field label="Date" value={cert.date} />
              <Field label="Confidence" value={`${Math.round((cert.confidence ?? 0) * 100)}%`} />
            </dl>
          </div>
        )}

        {/* STEP 2 — guardian confirmation */}
        {verified && !executing && (
          <div className="mt-6 card rise">
            <h2 className="font-display text-h flex items-center gap-2"><Users size={18} /> Guardian confirmation</h2>
            <p className="mt-1 text-sm text-mist">Each guardian confirms independently. This is irreversible.</p>

            <div className="mt-5 flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full bg-line overflow-hidden">
                <div className="h-full bg-sage transition-all duration-500"
                  style={{ width: `${Math.min(100, ((status?.confirmedGuardians ?? 0) / 2) * 100)}%` }} />
              </div>
              <span className="text-sm text-mist">{status?.confirmedGuardians ?? 0} of 2</span>
            </div>

            <ul className="mt-5 space-y-2">
              {(status?.guardians ?? []).map((g, i) => (
                <li key={i} className="flex items-center gap-3 py-2">
                  <span className="grid place-items-center h-8 w-8 rounded-full bg-paper border border-line text-xs text-mist">{g.name?.[0] || "?"}</span>
                  <span className="flex-1 text-sm">{g.name}</span>
                  {g.confirmed ? (
                    <span className="pill bg-sage/15 text-sage-600"><Check size={13} /> Confirmed</span>
                  ) : (
                    <button className="btn-secondary btn-sm" disabled={confirming === i} onClick={() => confirm(i)}>
                      {confirming === i ? <Loader2 size={14} className="animate-spin" /> : "Confirm"}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Executed */}
        {executing && (
          <div className="mt-6 card border-sage/40 rise text-center py-10">
            <span className="grid place-items-center h-14 w-14 mx-auto rounded-2xl bg-sage/15 text-sage-600"><Check size={28} /></span>
            <h2 className="mt-4 font-display text-h">The estate is now executing</h2>
            <p className="mt-2 text-sm text-mist max-w-sm mx-auto">The quorum is met. The family can now open the memorial and receive everything that was left for them.</p>
            <button className="btn-primary mt-6" onClick={() => nav(`/family/${userId}`)}>Open the memorial <ArrowRight size={16} /></button>
          </div>
        )}

        <p className="mt-10 text-center text-xs text-mist">A hackathon-grade check, not a legal determination.</p>
      </div>
    </div>
  );
}

function Step({ n, label, active, done }) {
  return (
    <span className={`inline-flex items-center gap-2 ${active || done ? "text-ink font-medium" : "text-mist"}`}>
      <span className={`grid place-items-center h-6 w-6 rounded-full text-xs ${done ? "bg-sage text-white" : active ? "bg-ember text-white" : "border border-line"}`}>
        {done ? <Check size={13} /> : n}
      </span>
      {label}
    </span>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-mist">{label}</dt>
      <dd className="text-ink mt-0.5">{value || "—"}</dd>
    </div>
  );
}
