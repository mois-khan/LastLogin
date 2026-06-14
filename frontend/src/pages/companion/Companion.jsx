import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Check, Sparkles, Mic, Square, ShieldCheck, ArrowRight } from "lucide-react";
import { api } from "../../lib/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import CloneChat from "../../components/CloneChat.jsx";
import { startRecording } from "../../lib/audio.js";

// Speak an answer instead of typing it — record -> Sarvam STT -> text appended to the field.
function QuestionMic({ onText }) {
  const [phase, setPhase] = useState("idle"); // idle | rec | stt
  const recRef = useRef(null);
  const toggle = async () => {
    if (phase === "rec") {
      setPhase("stt");
      try {
        const wav = await recRef.current.stop();
        const fd = new FormData(); fd.append("audio", wav, "answer.wav"); fd.append("language", "unknown");
        const { data } = await api.post("/clone/transcribe", fd);
        if (data.text) onText(data.text);
      } catch { /* ignore */ } finally { setPhase("idle"); recRef.current = null; }
      return;
    }
    try { recRef.current = await startRecording(); setPhase("rec"); } catch { setPhase("idle"); }
  };
  return (
    <button type="button" onClick={toggle} disabled={phase === "stt"} title="Speak your answer"
      className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs transition ${phase === "rec" ? "bg-ember text-white animate-pulse" : "border border-line text-mist hover:text-ink"}`}>
      {phase === "stt" ? <Loader2 size={13} className="animate-spin" /> : phase === "rec" ? <Square size={12} /> : <Mic size={13} />}
      {phase === "rec" ? "Stop" : phase === "stt" ? "…" : "Speak"}
    </button>
  );
}

// Owner setup: answer a few questions in your own words -> a companion the people you love
// can talk with later, in your voice. Includes a live preview (talk to yourself).
export default function Companion() {
  const { user, updateUser } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [persona, setPersona] = useState(null); // { ready, keyPhrases, gender, hasVoice, name }
  const [gender, setGender] = useState(user?.gender || "neutral");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [q, p] = await Promise.all([api.get("/clone/questions"), api.get("/clone/persona")]);
    setQuestions(q.data.questions);
    setPersona(p.data); setAnswers(p.data.answers || {}); setGender(p.data.gender || "neutral");
  };
  useEffect(() => { load().catch(() => {}); }, []);

  const saveGender = async (g) => { setGender(g); try { await api.post("/auth/profile", { gender: g }); updateUser({ gender: g }); } catch {} };
  const build = async () => {
    setSaving(true);
    try { const { data } = await api.post("/clone/persona", { answers }); setPersona((p) => ({ ...p, ...data, ready: true })); }
    finally { setSaving(false); }
  };

  const answered = Object.values(answers).filter((v) => String(v || "").trim()).length;

  return (
    <div className="rise max-w-2xl mx-auto">
      <h1 className="font-display text-title mb-1">Your companion</h1>
      <p className="text-mist mb-8 max-w-xl">Answer a few questions in your own words. We learn how you speak and think — so the people you love can talk with you, in your voice, even after you're gone.</p>

      {/* voice + grammar */}
      <div className="card mb-6 flex flex-wrap items-center gap-4">
        <span className="grid place-items-center h-10 w-10 rounded-full bg-ember/12 text-ember shrink-0"><Mic size={18} /></span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-ink">Your voice</p>
          <p className="text-xs text-mist">{persona?.hasVoice ? "Cloned — your companion speaks in your voice." : "Not cloned yet — record it on the Messages page."}</p>
        </div>
        {persona?.hasVoice
          ? <span className="pill bg-sage/15 text-sage-600"><Check size={13} /> Ready</span>
          : <Link to="/app/messages" className="btn-secondary btn-sm">Clone my voice <ArrowRight size={14} /></Link>}
        <select className="field !w-auto !py-2 text-xs" value={gender} onChange={(e) => saveGender(e.target.value)} title="Voice grammar">
          <option value="male">He</option>
          <option value="female">She</option>
          <option value="neutral">—</option>
        </select>
      </div>

      {/* questionnaire */}
      <div className="card mb-6">
        <h3 className="text-h mb-4">A few questions, in your words</h3>
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
        <button className="btn-primary w-full mt-5" onClick={build} disabled={saving || answered < 3}>
          {saving ? <><Loader2 size={16} className="animate-spin" /> Learning your voice…</>
            : persona?.ready ? <><Check size={16} /> Update my companion</>
            : <><Sparkles size={16} /> Build my companion</>}
        </button>
        {answered < 3 && <p className="text-xs text-mist mt-2">Answer at least three to begin.</p>}
        {persona?.keyPhrases?.length > 0 && (
          <div className="mt-4">
            <p className="eyebrow mb-2">Phrases we'll remember</p>
            <div className="flex flex-wrap gap-2">
              {persona.keyPhrases.map((p) => <span key={p} className="pill bg-paper text-graphite border border-line">{p}</span>)}
            </div>
          </div>
        )}
      </div>

      {/* preview */}
      {persona?.ready && (
        <>
          <h3 className="text-h mb-3">Try talking to yourself</h3>
          <CloneChat name={persona?.name || "you"}
            sendMessage={(message, language, withAudio) => api.post("/clone/preview", { message, language, withAudio }).then((r) => r.data)}
            loadHistory={() => api.get("/clone/preview/history").then((r) => ({ messages: r.data }))}
            clearHistory={() => api.delete("/clone/preview/history")}
            transcribe={(blob, language) => { const fd = new FormData(); fd.append("audio", blob, "a.wav"); fd.append("language", language); return api.post("/clone/transcribe", fd).then((r) => r.data.text); }} />
        </>
      )}

      <p className="mt-8 flex items-center gap-2 text-xs text-mist">
        <ShieldCheck size={14} className="text-sage-600" /> Your companion never shares vault secrets or passwords — those are released only through your guardians.
      </p>
    </div>
  );
}
