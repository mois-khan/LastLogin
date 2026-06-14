import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Check, Sparkles, Mic, Square, ShieldCheck, ArrowRight, Upload, MessageSquare } from "lucide-react";
import { api } from "../../lib/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import CloneChat from "../../components/CloneChat.jsx";
import { startRecording } from "../../lib/audio.js";

// Speak an answer instead of typing it - record -> Sarvam STT -> text appended, with clear feedback.
function QuestionMic({ onText }) {
  const [phase, setPhase] = useState("idle"); // idle | rec | stt | done | err
  const recRef = useRef(null);
  const flash = (p) => { setPhase(p); setTimeout(() => setPhase("idle"), p === "done" ? 1400 : 2400); };
  const toggle = async () => {
    if (phase === "rec") {
      setPhase("stt");
      try {
        const wav = await recRef.current.stop();
        const fd = new FormData(); fd.append("audio", wav, "answer.wav"); fd.append("language", "unknown");
        const { data } = await api.post("/clone/transcribe", fd);
        if (data.text && data.text.trim()) { onText(data.text.trim()); flash("done"); }
        else flash("err");
      } catch { flash("err"); } finally { recRef.current = null; }
      return;
    }
    try { recRef.current = await startRecording(); setPhase("rec"); } catch { flash("err"); }
  };
  const label = { idle: "Speak", rec: "Stop", stt: "Transcribing…", done: "Added", err: "Try again" }[phase];
  const tone = phase === "rec" ? "bg-ember text-white animate-pulse"
    : phase === "done" ? "bg-sage/15 text-sage-600"
    : phase === "err" ? "bg-ember/10 text-ember"
    : "border border-line text-mist hover:text-ink";
  return (
    <button type="button" onClick={toggle} disabled={phase === "stt"} title="Speak your answer"
      className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition ${tone}`}>
      {phase === "stt" ? <Loader2 size={13} className="animate-spin" /> : phase === "rec" ? <Square size={12} /> : phase === "done" ? <Check size={13} /> : <Mic size={13} />}
      {label}
    </button>
  );
}

// Upload the owner's own exported chats -> a private summary of how they write (feeds the persona).
function OwnerChats({ hasChats, onLearned }) {
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState(null);
  const [err, setErr] = useState("");
  const ref = useRef(null);
  const upload = async (files) => {
    const picked = Array.from(files || []);
    if (!picked.length) return;
    setBusy(true); setErr("");
    try {
      const fd = new FormData();
      picked.forEach((f) => fd.append("chats", f));
      const { data } = await api.post("/clone/owner-chats", fd);
      setSummary(data.summary); onLearned?.();
    } catch (e) { setErr(e.response?.data?.error || "Couldn't read that - export it without media (.txt or .zip)."); }
    finally { setBusy(false); if (ref.current) ref.current.value = ""; }
  };
  return (
    <div className="card mb-6">
      <h3 className="text-h mb-1 flex items-center gap-2"><MessageSquare size={18} className="text-ember" /> Teach it how you really talk <span className="text-xs text-mist font-body">· optional</span></h3>
      <p className="text-sm text-mist mb-4">Upload your exported WhatsApp chats and we learn your real voice - your phrases, your humor, how you check in on people. We keep only a private summary, never the chat.</p>
      <input ref={ref} type="file" accept=".txt,.zip" multiple className="hidden" onChange={(e) => upload(e.target.files)} />
      {summary ? (
        <div className="rounded-xl bg-sage/[0.08] border border-sage/30 px-4 py-3">
          <p className="text-sm text-sage-600 font-medium flex items-center gap-1.5"><Check size={14} /> Learned your voice.</p>
          <p className="text-sm text-graphite mt-2 leading-relaxed">{summary}</p>
          <button onClick={() => { setSummary(null); setTimeout(() => ref.current?.click(), 0); }} className="text-xs text-ember hover:underline mt-2">Add more chats</button>
        </div>
      ) : (
        <>
          <button onClick={() => ref.current?.click()} disabled={busy} className="btn-secondary btn-sm">
            {busy ? <><Loader2 size={14} className="animate-spin" /> Reading your chats…</> : <><Upload size={14} /> Upload my chats</>}
          </button>
          {hasChats && <p className="text-xs text-sage-600 mt-2 flex items-center gap-1.5"><Check size={12} /> Your chats are learned - add more anytime.</p>}
          {err && <p className="text-xs text-ember mt-2">{err}</p>}
          <p className="text-xs text-mist mt-2">In WhatsApp: open a chat → ⋮ menu → Export chat → Without media → upload the .txt or .zip here.</p>
        </>
      )}
    </div>
  );
}

export default function Companion() {
  const { user, updateUser } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [persona, setPersona] = useState(null); // { ready, keyPhrases, behaviour, hasChats, gender, hasVoice, name }
  const [gender, setGender] = useState(user?.gender || "neutral");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [q, p] = await Promise.all([api.get("/clone/questions"), api.get("/clone/persona")]);
    setQuestions(q.data.questions);
    setPersona(p.data); setAnswers(p.data.answers || {}); setGender(p.data.gender || "neutral");
  };
  const reloadPersona = async () => { try { setPersona((await api.get("/clone/persona")).data); } catch {} };
  useEffect(() => { load().catch(() => {}); }, []);

  const saveGender = async (g) => { setGender(g); try { await api.post("/auth/profile", { gender: g }); updateUser({ gender: g }); } catch {} };
  const build = async () => {
    setSaving(true);
    try { const { data } = await api.post("/clone/persona", { answers }); setPersona((p) => ({ ...p, ...data, ready: true })); }
    finally { setSaving(false); }
  };

  const answered = Object.values(answers).filter((v) => String(v || "").trim()).length;
  const canBuild = answered >= 3 || persona?.hasChats;
  const b = persona?.behaviour;

  return (
    <div className="rise max-w-2xl mx-auto">
      <h1 className="font-display text-title mb-2">Your companion</h1>
      <p className="text-mist mb-8 max-w-xl text-[15px] leading-relaxed">Answer a few questions in your own words - or just upload your chats. We learn how you speak and think, so the people you love can talk with you, in your voice, even after you're gone.</p>

      {/* voice + grammar */}
      <div className="card mb-6 flex flex-wrap items-center gap-4">
        <span className="grid place-items-center h-10 w-10 rounded-full bg-ember/12 text-ember shrink-0"><Mic size={18} /></span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-ink">Your voice</p>
          <p className="text-xs text-mist">{persona?.hasVoice ? "Cloned - your companion speaks in your voice." : "Not cloned yet - record it on the Messages page."}</p>
        </div>
        {persona?.hasVoice
          ? <span className="pill bg-sage/15 text-sage-600"><Check size={13} /> Ready</span>
          : <Link to="/app/messages" className="btn-secondary btn-sm">Clone my voice <ArrowRight size={14} /></Link>}
        <select className="field !w-auto !py-2 text-xs" value={gender} onChange={(e) => saveGender(e.target.value)} title="Voice grammar">
          <option value="male">He</option>
          <option value="female">She</option>
          <option value="neutral">-</option>
        </select>
      </div>

      {/* whatsapp chats */}
      <OwnerChats hasChats={persona?.hasChats} onLearned={reloadPersona} />

      {/* questionnaire */}
      <div className="card mb-6">
        <h3 className="text-h mb-1">A few questions, in your words</h3>
        <p className="text-sm text-mist mb-4">Type, or tap <span className="text-ink">Speak</span> to say it out loud.</p>
        <div className="space-y-4">
          {questions.map((q) => (
            <div key={q.k}>
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <label className="block text-sm text-graphite">{q.q}</label>
                <QuestionMic onText={(t) => setAnswers((a) => ({ ...a, [q.k]: (a[q.k] ? a[q.k].trim() + " " : "") + t }))} />
              </div>
              <textarea className="field" rows={2} placeholder={q.ph} value={answers[q.k] || ""}
                onChange={(e) => setAnswers((a) => ({ ...a, [q.k]: e.target.value }))} />
            </div>
          ))}
        </div>
        <button className="btn-primary w-full mt-5" onClick={build} disabled={saving || !canBuild}>
          {saving ? <><Loader2 size={16} className="animate-spin" /> Learning who you are…</>
            : persona?.ready ? <><Sparkles size={16} /> Rebuild my companion</>
            : <><Sparkles size={16} /> Build my companion</>}
        </button>
        {!canBuild && <p className="text-xs text-mist mt-2">Answer at least three questions, or upload your chats above.</p>}
      </div>

      {/* behaviour card */}
      {b && (b.summary || b.tone || b.traits?.length || b.phrases?.length) && (
        <div className="card mb-6 rise">
          <p className="eyebrow mb-3 flex items-center gap-1.5"><Sparkles size={12} className="text-ember" /> Who we learned you are</p>
          {b.summary && <p className="font-display text-[1.2rem] leading-[1.6] text-ink mb-5 max-w-xl">{b.summary}</p>}
          {b.tone && (
            <div className="mb-4"><p className="eyebrow mb-1">Voice</p><p className="text-sm text-graphite">{b.tone}</p></div>
          )}
          {b.traits?.length > 0 && (
            <div className="mb-4"><p className="eyebrow mb-2">Traits</p>
              <div className="flex flex-wrap gap-2">{b.traits.map((t) => <span key={t} className="pill bg-ember/10 text-ember">{t}</span>)}</div></div>
          )}
          {b.phrases?.length > 0 && (
            <div><p className="eyebrow mb-2">Phrases we'll keep</p>
              <div className="flex flex-wrap gap-2">{b.phrases.map((p) => <span key={p} className="pill bg-cloud text-graphite border border-line">{p}</span>)}</div></div>
          )}
        </div>
      )}

      {/* preview */}
      {persona?.ready && (
        <>
          <h3 className="text-h mb-3">Try talking to yourself</h3>
          <CloneChat name={persona?.name || "you"}
            sendMessage={(message, language, withAudio) => api.post("/clone/preview", { message, language, withAudio }).then((r) => r.data)}
            loadHistory={() => api.get("/clone/preview/history").then((r) => ({ messages: r.data }))}
            clearHistory={() => api.delete("/clone/preview/history")}
            transcribe={(blob) => { const fd = new FormData(); fd.append("audio", blob, "a.wav"); return api.post("/clone/transcribe", fd).then((r) => r.data); }} />
        </>
      )}

      <p className="mt-8 flex items-center gap-2 text-xs text-mist">
        <ShieldCheck size={14} className="text-sage-600" /> Your companion never shares vault secrets or passwords - those are released only through your guardians.
      </p>
    </div>
  );
}
