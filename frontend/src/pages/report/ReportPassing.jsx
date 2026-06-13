import { useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Upload, ShieldCheck, ShieldAlert, Loader2, Users, FileText } from "lucide-react";
import { api } from "../../lib/api.js";

// Guardian-facing. Step 1 of the trigger: a death certificate is verified by Gemini
// Vision before any guardian can confirm. Calm and serious — never alarmist.
export default function ReportPassing() {
  const { userId } = useParams();
  const fileRef = useRef(null);
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null); // { looksValid, confidence, deceasedName, date, reason }
  const [err, setErr] = useState("");

  const onFile = async (file) => {
    if (!file) return;
    setFileName(file.name); setErr(""); setResult(null); setBusy(true);
    try {
      const fd = new FormData();
      fd.append("cert", file);
      fd.append("userId", userId);
      const { data } = await api.post("/trigger/verify", fd);
      setResult(data);
    } catch (e) {
      setErr(e.response?.data?.error || "Couldn't verify that file. Try a clear photo or scan.");
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-xl px-6 py-16">
        <p className="text-xs uppercase tracking-[0.2em] text-mist">Guardian verification</p>
        <h1 className="mt-3 font-display text-title">Report a passing</h1>
        <p className="mt-4 text-graphite leading-relaxed">
          This begins a careful, verified handover. Nothing is released by this step alone —
          a certificate must be verified, and then <span className="text-ink font-medium">2 of the 3 guardians</span> must
          independently confirm.
        </p>

        {/* Steps */}
        <div className="mt-8 flex items-center gap-3 text-sm">
          <span className="inline-flex items-center gap-2 text-ink font-medium">
            <span className="grid place-items-center h-6 w-6 rounded-full bg-ember text-white text-xs">1</span> Verify certificate
          </span>
          <span className="h-px flex-1 bg-line" />
          <span className="inline-flex items-center gap-2 text-mist">
            <span className="grid place-items-center h-6 w-6 rounded-full border border-line text-xs">2</span> Guardians confirm
          </span>
        </div>

        {/* Upload */}
        <div className="mt-8">
          <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])} />
          <button onClick={() => fileRef.current?.click()} disabled={busy}
            className="w-full card card-hover border-dashed flex flex-col items-center justify-center py-12 text-center">
            {busy ? (
              <><Loader2 size={26} className="text-ember animate-spin" /><span className="mt-3 text-sm text-graphite">Verifying with Gemini Vision…</span></>
            ) : (
              <>
                <span className="grid place-items-center h-12 w-12 rounded-xl bg-ember/12 text-ember"><Upload size={22} /></span>
                <span className="mt-3 font-medium">Upload the death certificate</span>
                <span className="mt-1 text-sm text-mist">{fileName ? fileName : "A clear photo or scan — JPG, PNG, or PDF"}</span>
              </>
            )}
          </button>
        </div>

        {err && <p className="mt-4 text-sm text-ember">{err}</p>}

        {/* Verdict */}
        {result && (
          <div className={`mt-6 card rise ${result.looksValid ? "border-sage/40" : "border-ember/40"}`}>
            <div className={`flex items-center gap-2 ${result.looksValid ? "text-sage-600" : "text-ember"}`}>
              {result.looksValid ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
              <span className="font-medium">
                {result.looksValid ? "Certificate verified" : "This doesn't look like a valid certificate"}
              </span>
            </div>

            {result.looksValid ? (
              <>
                <dl className="mt-4 grid sm:grid-cols-3 gap-4 text-sm">
                  <div><dt className="text-xs uppercase tracking-wide text-mist">Name</dt><dd className="text-ink mt-0.5">{result.deceasedName || "—"}</dd></div>
                  <div><dt className="text-xs uppercase tracking-wide text-mist">Date</dt><dd className="text-ink mt-0.5">{result.date || "—"}</dd></div>
                  <div><dt className="text-xs uppercase tracking-wide text-mist">Confidence</dt><dd className="text-ink mt-0.5">{Math.round((result.confidence ?? 0) * 100)}%</dd></div>
                </dl>
                <div className="mt-5 pt-5 border-t border-line flex items-center justify-between gap-3">
                  <p className="text-sm text-mist flex items-center gap-2"><Users size={15} /> Next, 2 guardians must confirm.</p>
                  <button className="btn-primary" disabled title="Guardian confirmation — coming next">Continue</button>
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm text-graphite flex items-start gap-2">
                <FileText size={15} className="mt-0.5 shrink-0 text-mist" /> {result.reason || "Please upload the official certificate."}
              </p>
            )}
          </div>
        )}

        <p className="mt-10 text-center text-xs text-mist">A hackathon-grade check, not a legal determination.</p>
      </div>
    </div>
  );
}
