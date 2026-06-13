import { useState, useRef } from "react";
import { Mic, Square, Sparkles, Loader2, Check, AudioLines, Download } from "lucide-react";
import { api } from "../../lib/api.js";
import { useAuth } from "../../context/AuthContext.jsx";

const LANGS = [
  { code: "hi-IN", label: "Hindi" },
  { code: "ta-IN", label: "Tamil" },
  { code: "te-IN", label: "Telugu" },
  { code: "mr-IN", label: "Marathi" },
  { code: "en-IN", label: "English" },
];

export default function Messages() {
  const { user } = useAuth();
  const [voiceId, setVoiceId] = useState(user?.voiceId || "");
  const [recording, setRecording] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState(null); // { tone: 'ok'|'err'|'busy', text }
  const [form, setForm] = useState({ recipientName: "", text: "", language: "hi-IN" });
  const [result, setResult] = useState(null);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);

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
      setVoiceId(data.voiceId); setStatus({ tone: "ok", text: "Voice ready." });
    } catch { setStatus({ tone: "err", text: "Voice cloning failed — check your ElevenLabs plan." }); }
    finally { setCloning(false); }
  };

  const generate = async () => {
    if (!form.text.trim()) return;
    setGenerating(true); setStatus({ tone: "busy", text: "Composing in your voice…" }); setResult(null);
    try {
      const { data } = await api.post("/ai/messages", form);
      setResult(data); setStatus(null);
    } catch (e) { setStatus({ tone: "err", text: e.response?.data?.error || "Generation failed." }); }
    finally { setGenerating(false); }
  };

  const tone = { ok: "text-sage-600", err: "text-ember", busy: "text-graphite" };

  return (
    <div className="rise">
      <h1 className="font-display text-title mb-1">Final messages</h1>
      <p className="text-mist mb-8 max-w-xl">Leave words for the people who matter — in your own voice, in their language.</p>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* 1 — voice */}
        <div className="card self-start">
          <div className="flex items-center gap-2 mb-4">
            <span className="grid place-items-center h-6 w-6 rounded-full bg-ember text-white text-xs">1</span>
            <h3 className="text-h">Your voice</h3>
          </div>
          {cloning ? (
            <div className="flex items-center gap-2 text-sm text-graphite"><Loader2 size={16} className="animate-spin text-ember" /> Cloning your voice…</div>
          ) : voiceId ? (
            <div className="flex items-center justify-between">
              <span className="pill bg-sage/15 text-sage-600"><Check size={13} /> Voice cloned</span>
              <button className="btn-ghost btn-sm" onClick={startRec}><Mic size={14} /> Re-record</button>
            </div>
          ) : (
            <button className={recording ? "btn-secondary" : "btn-primary"} onClick={recording ? stopRec : startRec}>
              {recording ? <><Square size={15} /> Stop recording</> : <><Mic size={15} /> Record 60s sample</>}
            </button>
          )}
          <p className="text-xs text-mist mt-3 leading-relaxed">A calm 60-second reading is enough. Quiet room, clear voice.</p>
        </div>

        {/* 2 — compose */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <span className="grid place-items-center h-6 w-6 rounded-full bg-ember text-white text-xs">2</span>
            <h3 className="text-h">Write the message</h3>
          </div>
          <label className="label">To</label>
          <input className="field mb-3" value={form.recipientName}
            onChange={(e) => setForm({ ...form, recipientName: e.target.value })} placeholder="e.g. My daughter Ananya" />
          <label className="label">Language</label>
          <select className="field mb-3" value={form.language}
            onChange={(e) => setForm({ ...form, language: e.target.value })}>
            {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
          <label className="label">Message (write in English — we'll translate)</label>
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
          <audio controls src={result.audioUrl} className="w-full" />
          <a href={result.audioUrl} download="lastlogin-message.mp3" className="btn-secondary btn-sm mt-3"><Download size={14} /> Download</a>
        </div>
      )}
    </div>
  );
}
