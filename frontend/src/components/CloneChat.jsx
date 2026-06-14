import { useEffect, useRef, useState } from "react";
import { Send, Loader2, Mic, Square, Trash2, Upload, ShieldCheck, Sparkles } from "lucide-react";
import AudioPlayer from "./ui/AudioPlayer.jsx";

const LANGS = [
  { code: "en-IN", label: "English" },
  { code: "hi-IN", label: "Hindi" },
  { code: "ta-IN", label: "Tamil" },
  { code: "te-IN", label: "Telugu" },
  { code: "mr-IN", label: "Marathi" },
];

// Chat + talk with a persona. Pure UI; the parent wires the endpoints (owner preview vs
// guardian session). sendMessage(text, language, withAudio) -> { text, audioUrl }.
export default function CloneChat({ name = "them", sendMessage, loadHistory, clearHistory, uploadContext }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("en-IN");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [ctxBusy, setCtxBusy] = useState(false);
  const scrollRef = useRef(null);
  const recRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => { loadHistory?.().then((h) => setMessages(h?.messages || h || [])).catch(() => {}); }, []);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, busy]);

  const send = async (text, withAudio) => {
    const msg = (text ?? input).trim();
    if (!msg || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "guardian", text: msg }]);
    setBusy(true);
    try {
      const reply = await sendMessage(msg, language, !!withAudio);
      setMessages((m) => [...m, { role: "clone", text: reply.text, audioUrl: reply.audioUrl }]);
    } catch {
      setMessages((m) => [...m, { role: "clone", text: "I'm having a quiet moment — try me again in a second.", error: true }]);
    } finally { setBusy(false); }
  };

  // Talk: in-browser speech recognition -> send with audio reply. Falls back to "send typed with voice".
  const talk = () => {
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Rec) { send(undefined, true); return; }
    if (listening) { recRef.current?.stop(); return; }
    const rec = new Rec();
    rec.lang = language; rec.interimResults = false; rec.maxAlternatives = 1;
    rec.onresult = (e) => { setListening(false); send(e.results[0][0].transcript, true); };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec; setListening(true); rec.start();
  };

  const onFile = async (file) => {
    if (!file || !uploadContext) return;
    setCtxBusy(true);
    try { await uploadContext(file); } finally { setCtxBusy(false); if (fileRef.current) fileRef.current.value = ""; }
  };
  const reset = async () => { try { await clearHistory?.(); } catch {} setMessages([]); };

  return (
    <div className="surface p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="grid place-items-center h-10 w-10 rounded-full bg-ember/12 text-ember shrink-0"><Sparkles size={18} /></span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-ink">Talk with {name}</p>
          <p className="text-xs text-mist">A remembrance — in their words and voice.</p>
        </div>
        {messages.length > 0 && <button onClick={reset} className="text-mist hover:text-ember p-1.5 rounded-lg" title="Clear conversation"><Trash2 size={15} /></button>}
      </div>

      <p className="text-xs text-mist bg-paper/70 rounded-xl px-3 py-2.5 mb-4 flex items-start gap-2">
        <ShieldCheck size={14} className="text-sage-600 mt-0.5 shrink-0" />
        A gentle AI recreation of {name}, not really them — and it will never share passwords or private details.
      </p>

      {uploadContext && (
        <div className="mb-4">
          <input ref={fileRef} type="file" accept=".txt" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          <button onClick={() => fileRef.current?.click()} disabled={ctxBusy} className="btn-secondary btn-sm">
            {ctxBusy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Personalize with your chat
          </button>
          <p className="text-xs text-mist mt-1.5">Optional: export your WhatsApp chat with {name} (without media, .txt) so they sound the way they did with you. We keep only a private summary — never the chat.</p>
        </div>
      )}

      <div ref={scrollRef} className="space-y-3 max-h-[26rem] overflow-y-auto pr-1">
        {messages.length === 0 && !busy && (
          <p className="text-sm text-mist text-center py-8">Say hello, ask a question, or just tell them how you're doing.</p>
        )}
        {messages.map((m, i) => (m.role === "guardian" ? (
          <div key={i} className="flex justify-end">
            <div className="max-w-[80%] rounded-2xl rounded-br-md bg-ink text-paper px-4 py-2.5 text-sm leading-relaxed">{m.text}</div>
          </div>
        ) : (
          <div key={i} className="max-w-[85%]">
            <div className={`rounded-2xl rounded-bl-md px-4 py-3 text-sm leading-relaxed ${m.error ? "bg-paper text-mist" : "bg-paper text-ink"}`}>{m.text}</div>
            {m.audioUrl && <div className="mt-2"><AudioPlayer src={m.audioUrl} /></div>}
          </div>
        )))}
        {busy && <div className="flex items-center gap-2 text-sm text-mist"><Loader2 size={14} className="animate-spin" /> {name} is thinking…</div>}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <select className="field !w-auto !py-2 text-xs shrink-0" value={language} onChange={(e) => setLanguage(e.target.value)}>
          {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
        <input className="field" placeholder={`Talk to ${name}…`} value={input}
          onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send(); }} />
        <button onClick={talk} disabled={busy} title="Speak"
          className={`grid place-items-center h-10 w-10 rounded-full shrink-0 transition ${listening ? "bg-ember text-white animate-pulse" : "btn-secondary"}`}>
          {listening ? <Square size={15} /> : <Mic size={16} />}
        </button>
        <button onClick={() => send()} disabled={busy || !input.trim()} className="btn-primary shrink-0 !px-3" aria-label="Send"><Send size={16} /></button>
      </div>
    </div>
  );
}
