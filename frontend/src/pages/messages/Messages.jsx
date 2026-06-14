import { useState, useRef, useEffect } from "react";
import { Mic, Square, Sparkles, Loader2, Check, AudioLines, Download, Plus, X, Globe, Users } from "lucide-react";
import { api } from "../../lib/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import AudioPlayer from "../../components/ui/AudioPlayer.jsx";

const LANGS = [
  { code: "hi-IN", label: "Hindi" },
  { code: "ta-IN", label: "Tamil" },
  { code: "te-IN", label: "Telugu" },
  { code: "mr-IN", label: "Marathi" },
  { code: "en-IN", label: "English" },
];

export default function Messages() {
  const { user, updateUser } = useAuth();
  const [voiceId, setVoiceId] = useState(user?.voiceId || "");
  const [gender, setGender] = useState(user?.gender || "neutral");
  const saveGender = async (g) => { setGender(g); try { await api.post("/auth/profile", { gender: g }); updateUser({ gender: g }); } catch {} };
  const [recording, setRecording] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState(null); // { tone: 'ok'|'err'|'busy', text }
  const [form, setForm] = useState({ recipientName: "", text: "", language: "hi-IN" });
  const [scope, setScope] = useState("global"); // "global" | "assigned"
  const [recipients, setRecipients] = useState([]);
  const [emailDraft, setEmailDraft] = useState("");
  const [result, setResult] = useState(null);
  const [saved, setSaved] = useState([]);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);

  const loadSaved = async () => setSaved((await api.get("/ai/messages")).data);
  useEffect(() => { loadSaved().catch(() => {}); }, []);

  const addRecipient = () => {
    const email = emailDraft.trim().toLowerCase();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setStatus({ tone: "err", text: "That doesn't look like an email address." }); return; }
    if (recipients.includes(email)) { setEmailDraft(""); return; }
    setRecipients((arr) => [...arr, email]); setEmailDraft(""); setStatus(null);
  };
  const removeRecipient = (email) => setRecipients((arr) => arr.filter((e) => e !== email));
  const onEmailKey = (e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addRecipient(); } };

  const startRec = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    chunksRef.current = [];
    mr.ondataavailable = (e) => chunksRef.current.push(e.data);
    mr.onstop = uploadClone;
    mediaRef.current = mr; mr.start(); setRecording(true);
    setStatus({ tone: "busy", text: "Recording… read naturally for about a minute." });
  };
  const stopRec = () => { mediaRef.current?.stop(); setRecording(false); };

  const uploadClone = async () => {
    setCloning(true); setStatus({ tone: "busy", text: "Cloning your voice…" });
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    const fd = new FormData();
    fd.append("sample", blob, "sample.webm");
    try {
      const { data } = await api.post("/ai/voice/clone", fd);
      setVoiceId(data.voiceId); updateUser({ voiceId: data.voiceId }); setStatus({ tone: "ok", text: "Voice ready." });
    } catch { setStatus({ tone: "err", text: "Voice cloning failed - check your ElevenLabs plan." }); }
    finally { setCloning(false); }
  };

  const generate = async () => {
    if (!form.text.trim()) return;
    if (scope === "assigned" && recipients.length === 0) { setStatus({ tone: "err", text: "Add at least one recipient, or choose Everyone." }); return; }
    setGenerating(true); setStatus({ tone: "busy", text: "Composing in your voice…" }); setResult(null);
    try {
      const payload = {
        recipientName: form.recipientName,
        scope,
        recipients: scope === "assigned" ? recipients : [],
        text: form.text,
        language: form.language,
      };
      const { data } = await api.post("/ai/messages", payload);
      setResult(data); setStatus(null); loadSaved();
    } catch (e) { setStatus({ tone: "err", text: e.response?.data?.error || "Generation failed." }); }
    finally { setGenerating(false); }
  };

  const tone = { ok: "text-sage-600", err: "text-ember", busy: "text-graphite" };

  return (
    <div className="rise max-w-2xl mx-auto">
      <h1 className="font-display text-title mb-1">Final messages</h1>
      <p className="text-mist mb-8 max-w-xl">Leave words for the people who matter - in your own voice, in their language.</p>

      <div className="space-y-5">
        {/* 1 - voice (slim banner) */}
        <div className="card !p-4 flex items-center gap-4">
          <span className="grid place-items-center h-8 w-8 rounded-full bg-line/60 text-graphite text-xs shrink-0">1</span>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-ink">Your voice</p>
            <p className="text-xs text-mist">A calm 60-second reading - quiet room, clear voice.</p>
          </div>
          {cloning ? (
            <span className="flex items-center gap-2 text-sm text-graphite shrink-0"><Loader2 size={16} className="animate-spin text-ember" /> Cloning…</span>
          ) : recording ? (
            <button className="btn-secondary shrink-0 animate-pulse" onClick={stopRec}><Square size={15} /> Stop recording</button>
          ) : voiceId ? (
            <div className="flex items-center gap-2 shrink-0">
              <span className="pill bg-sage/15 text-sage-600"><Check size={13} /> Cloned</span>
              <button className="btn-secondary btn-sm" onClick={startRec}><Mic size={14} /> Re-record</button>
            </div>
          ) : (
            <button className="btn-primary shrink-0" onClick={startRec}><Mic size={15} /> Record 60s</button>
          )}
        </div>

        {/* 2 - compose */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <span className="grid place-items-center h-8 w-8 rounded-full bg-line/60 text-graphite text-xs">2</span>
            <h3 className="text-h">Write the message</h3>
          </div>

          <label className="label">Who is this for?</label>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button type="button" onClick={() => setScope("global")}
              className={`card card-hover !py-3 text-left ${scope === "global" ? "border-ember ring-1 ring-ember/30" : ""}`}>
              <span className="flex items-center gap-2 text-sm font-medium"><Globe size={15} className={scope === "global" ? "text-ember" : "text-mist"} /> Everyone</span>
              <span className="block text-xs text-mist mt-1 leading-snug">Shown on the memorial and to every guardian.</span>
            </button>
            <button type="button" onClick={() => setScope("assigned")}
              className={`card card-hover !py-3 text-left ${scope === "assigned" ? "border-ember ring-1 ring-ember/30" : ""}`}>
              <span className="flex items-center gap-2 text-sm font-medium"><Users size={15} className={scope === "assigned" ? "text-ember" : "text-mist"} /> Specific people</span>
              <span className="block text-xs text-mist mt-1 leading-snug">Sent only to the people you name below.</span>
            </button>
          </div>

          <label className="label">{scope === "assigned" ? "A name for this message (optional)" : "Title (optional)"}</label>
          <input className="field mb-3" value={form.recipientName}
            onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
            placeholder={scope === "assigned" ? "e.g. For my children" : "e.g. To everyone I love"} />

          {scope === "assigned" && (
            <div className="mb-3">
              <label className="label">Recipients - only they can open it</label>
              <div className="flex gap-2">
                <input className="field" type="email" value={emailDraft}
                  onChange={(e) => setEmailDraft(e.target.value)} onKeyDown={onEmailKey}
                  placeholder="name@example.com" />
                <button type="button" className="btn-secondary btn-sm shrink-0" onClick={addRecipient}><Plus size={14} /> Add</button>
              </div>
              {recipients.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {recipients.map((email) => (
                    <span key={email} className="chip">
                      {email}
                      <button type="button" className="ml-1 text-mist hover:text-ember" title="Remove" onClick={() => removeRecipient(email)}><X size={13} /></button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-mist mt-2">Press Enter to add each address. You can name several people.</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="label">Language</label>
              <select className="field" value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value })}>
                {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Voice grammar</label>
              <select className="field" value={gender} onChange={(e) => saveGender(e.target.value)}>
                <option value="male">He · karta hoon</option>
                <option value="female">She · karti hoon</option>
                <option value="neutral">Prefer not to say</option>
              </select>
            </div>
          </div>
          <p className="text-xs text-mist -mt-1 mb-3">In Hindi, Tamil and others, verbs change by gender. This keeps your voice saying it the way you would.</p>
          <label className="label">Message (write in English - we'll translate)</label>
          <textarea className="field mb-4" rows={3} value={form.text}
            onChange={(e) => setForm({ ...form, text: e.target.value })} />
          <button className="btn-primary w-full" disabled={!voiceId || generating || !form.text.trim()} onClick={generate}>
            {generating ? <><Loader2 size={16} className="animate-spin" /> Composing…</> : <><Sparkles size={16} /> Create in my voice</>}
          </button>
          {!voiceId && <p className="text-xs text-mist mt-2">Record your voice first.</p>}
        </div>
      </div>

      {status && <p className={`text-sm mt-4 flex items-center gap-2 ${tone[status.tone]}`}>{status.tone === "busy" && <Loader2 size={14} className="animate-spin" />}{status.text}</p>}

      {result && (
        <div className="card mt-6 max-w-2xl rise">
          <div className="flex items-center gap-2 mb-3 text-sage-600"><AudioLines size={18} /><h3 className="text-h text-ink">Preview</h3></div>
          <p className="text-graphite leading-relaxed mb-4">{result.translatedText}</p>
          <AudioPlayer src={result.audioUrl} />
          <a href={result.audioUrl} download="lastlogin-message.mp3" className="btn-secondary btn-sm mt-3"><Download size={14} /> Download</a>
        </div>
      )}

      {saved.length > 0 && (
        <div className="mt-10 max-w-2xl">
          <h3 className="text-h mb-3">Your saved messages</h3>
          <div className="space-y-3">
            {saved.map((m) => (
              <div key={m._id} className="card">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="text-sm font-medium min-w-0">{m.recipientName || "Message"}</span>
                  <span className="pill bg-paper text-mist border border-line shrink-0">{m.language}</span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  {m.scope === "global" ? (
                    <span className="pill bg-sage/12 text-sage-600"><Globe size={12} /> Everyone</span>
                  ) : (
                    <span className="pill bg-paper text-graphite border border-line"><Users size={12} /> {(m.recipients || []).length ? (m.recipients || []).join(", ") : "No recipients"}</span>
                  )}
                </div>
                <p className="text-sm text-graphite leading-relaxed mb-3">{m.text}</p>
                {m.audioUrl && (
                  <>
                    <AudioPlayer src={m.audioUrl} />
                    <a href={m.audioUrl} download="message.mp3" className="inline-flex items-center gap-1.5 mt-2 text-xs text-ember hover:underline"><Download size={13} /> Download</a>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
