import { useState, useRef } from "react";
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
  const [status, setStatus] = useState("");
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
  };
  const stopRec = () => { mediaRef.current?.stop(); setRecording(false); };

  const uploadClone = async () => {
    setStatus("Cloning your voice…");
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    const fd = new FormData();
    fd.append("sample", blob, "sample.webm");
    try {
      const { data } = await api.post("/ai/voice/clone", fd);
      setVoiceId(data.voiceId); setStatus("Voice ready.");
    } catch { setStatus("Voice cloning failed — check your ElevenLabs plan."); }
  };

  const generate = async () => {
    setStatus("Composing in your voice…"); setResult(null);
    try {
      const { data } = await api.post("/ai/messages", form);
      setResult(data); setStatus("");
    } catch (e) { setStatus(e.response?.data?.error || "Generation failed"); }
  };

  return (
    <div>
      <h1 className="text-3xl mb-1">Final messages</h1>
      <p className="text-mist mb-6">Leave words for the people who matter — in your own voice, in their language.</p>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg mb-3">1 · Your voice</h3>
          {voiceId ? (
            <p className="pill bg-sage/15 text-sage">Voice cloned ✓</p>
          ) : (
            <button className={recording ? "btn-ghost" : "btn-ember"} onClick={recording ? stopRec : startRec}>
              {recording ? "Stop recording" : "Record 60s sample"}
            </button>
          )}
          <p className="text-xs text-mist mt-3">A calm 60-second reading is enough. Quiet room, clear voice.</p>
        </div>

        <div className="card">
          <h3 className="text-lg mb-3">2 · Write the message</h3>
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
          <button className="btn-ember w-full" disabled={!voiceId} onClick={generate}>Create in my voice</button>
        </div>
      </div>

      {status && <p className="text-sm text-ember mt-4">{status}</p>}

      {result && (
        <div className="card mt-6 max-w-2xl">
          <h3 className="text-lg mb-2">Preview</h3>
          <p className="text-mist text-sm mb-3">{result.translatedText}</p>
          <audio controls src={result.audioUrl} className="w-full" />
        </div>
      )}
    </div>
  );
}
