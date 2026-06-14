import { useEffect, useRef, useState } from "react";
import { Send, Loader2, Mic, Square, Trash2, Upload, ShieldCheck, Sparkles, Check, X } from "lucide-react";
import AudioPlayer from "./ui/AudioPlayer.jsx";
import Candle from "./ui/Candle.jsx";
import { startRecording } from "../lib/audio.js";

// Chat + talk with a persona. The clone replies in the SAME language the person uses; spoken
// input is transcribed (shown in Roman letters). Pure UI; the parent wires the endpoints.
// sendMessage(text, language, withAudio) -> { text, audioUrl }. transcribe(wavBlob) -> { text, language }.
// `dock`: render as a full-height, IDE-style side panel (Guardian access). `onClose`: show a close button.
export default function CloneChat({ name = "them", sendMessage, loadHistory, clearHistory, uploadContext, transcribe, dock = false, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState("idle"); // idle | rec | stt
  const [ctx, setCtx] = useState(null); // { busy, done, summary, error }
  const scrollRef = useRef(null);
  const recRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => { loadHistory?.().then((h) => setMessages(h?.messages || h || [])).catch(() => {}); }, []);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, busy]);

  const send = async (text, withAudio, lang) => {
    const msg = (text ?? input).trim();
    if (!msg || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "guardian", text: msg }]);
    setBusy(true);
    try {
      const reply = await sendMessage(msg, lang || "auto", !!withAudio);
      setMessages((m) => [...m, { role: "clone", text: reply.text, audioUrl: reply.audioUrl }]);
    } catch {
      setMessages((m) => [...m, { role: "clone", text: "I'm having a quiet moment — try me again in a second.", error: true }]);
    } finally { setBusy(false); }
  };

  // Talk: record -> Sarvam STT -> send (with a spoken reply). Click once to start, again to stop.
  const talk = async () => {
    if (phase === "rec") {
      setPhase("stt");
      try {
        const wav = await recRef.current.stop();
        const r = transcribe ? await transcribe(wav) : null;
        const said = (r && (r.text ?? r)) || "";
        if (said && said.trim()) await send(said, true, r?.language || "auto");
      } catch { /* ignore */ } finally { setPhase("idle"); recRef.current = null; }
      return;
    }
    try { recRef.current = await startRecording(); setPhase("rec"); } catch { setPhase("idle"); }
  };

  const onFile = async (file) => {
    if (!file || !uploadContext) return;
    setCtx({ busy: true });
    try { const res = await uploadContext(file); setCtx({ done: true, summary: res?.summary }); }
    catch (e) { setCtx({ error: e.response?.data?.error || "Couldn't read that chat — export it without media and try again." }); }
    finally { if (fileRef.current) fileRef.current.value = ""; }
  };
  const reset = async () => { try { await clearHistory?.(); } catch {} setMessages([]); };

  // Gentle openers — phrased as the visitor speaking TO the departed.
  const SUGGESTIONS = ["I miss you.", "Tell me about a memory you loved.", "What would you want me to remember?"];

  // ── shared pieces, rendered into either layout ──
  const safetyNote = (
    <p className="text-xs text-mist bg-paper/70 rounded-xl px-3 py-2.5 flex items-start gap-2">
      <ShieldCheck size={14} className="text-sage-600 mt-0.5 shrink-0" />
      A gentle AI recreation of {name}, not really them — here only for memories and comfort. It won't share private details or take on everyday tasks.
    </p>
  );

  const fileInput = uploadContext && (
    <input ref={fileRef} type="file" accept=".txt,.zip" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
  );

  const contextBlock = uploadContext && (
    ctx?.done ? (
      <div className="rounded-xl bg-sage/[0.08] border border-sage/30 px-3.5 py-3">
        <p className="text-sm text-sage-600 font-medium flex items-center gap-1.5"><Check size={14} /> Personalized — {name} will sound more like how they were with you.</p>
        {ctx.summary && <p className="text-xs text-graphite mt-2 leading-relaxed">{ctx.summary}</p>}
        <button onClick={() => { setCtx(null); setTimeout(() => fileRef.current?.click(), 0); }} className="text-xs text-ember hover:underline mt-2">Replace</button>
      </div>
    ) : (
      <div>
        <button onClick={() => fileRef.current?.click()} disabled={ctx?.busy} className="btn-secondary btn-sm">
          {ctx?.busy ? <><Loader2 size={14} className="animate-spin" /> Reading your chat…</> : <><Upload size={14} /> Personalize with your chat</>}
        </button>
        <p className="text-xs text-mist mt-1.5">Optional: in WhatsApp open your chat with {name} → Export chat → Without media, then upload the .txt or .zip. We keep only a private summary — never the chat.</p>
        {ctx?.error && <p className="text-xs text-ember mt-1.5">{ctx.error}</p>}
      </div>
    )
  );

  const messageList = (
    <>
      {messages.length === 0 && !busy && (dock ? (
        <div className="text-center py-6 px-2">
          <div className="flex justify-center"><Candle size={42} still /></div>
          <p className="text-sm text-mist mt-4 mb-4 max-w-[17rem] mx-auto leading-relaxed">Say hello, ask about a memory, or just tell {name} how you're doing.</p>
          <div className="flex flex-col gap-2 max-w-[17rem] mx-auto">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)} className="text-left text-sm text-graphite rounded-xl border border-line bg-paper/60 hover:bg-paper hover:border-mist/40 px-3.5 py-2 transition">{s}</button>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-mist text-center py-8">Say hello, ask about a memory, or just tell them how you're doing.</p>
      ))}

      {messages.map((m, i) => (m.role === "guardian" ? (
        <div key={i} className="flex justify-end rise">
          <div className="max-w-[82%] rounded-2xl rounded-br-md bg-ink text-paper px-4 py-2.5 text-sm leading-relaxed">{m.text}</div>
        </div>
      ) : (
        <div key={i} className="flex items-start gap-2 rise">
          {dock && <span className="grid place-items-center h-7 w-7 rounded-full bg-ember/12 text-ember shrink-0 mt-0.5"><Sparkles size={13} /></span>}
          <div className="max-w-[85%]">
            <div className={`rounded-2xl rounded-bl-md px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${m.error ? "bg-paper text-mist" : "bg-paper text-ink"}`}>{m.text}</div>
            {m.audioUrl && <div className="mt-2"><AudioPlayer src={m.audioUrl} /></div>}
          </div>
        </div>
      )))}

      {busy && (
        <div className="flex items-center gap-2 text-sm text-mist pl-1">
          <span className="flex items-end gap-1"><span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" /></span>
          {name} is thinking…
        </div>
      )}
    </>
  );

  const inputBar = (
    <div className="flex items-center gap-2">
      <input className="field" placeholder={phase === "rec" ? "Listening…" : `Talk to ${name} — type or speak, any language…`} value={input}
        onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send(); }} />
      <button onClick={talk} disabled={busy || phase === "stt"} title="Speak"
        className={`grid place-items-center h-10 w-10 rounded-full shrink-0 transition ${phase === "rec" ? "bg-ember text-white animate-pulse" : "btn-secondary"}`}>
        {phase === "stt" ? <Loader2 size={15} className="animate-spin" /> : phase === "rec" ? <Square size={15} /> : <Mic size={16} />}
      </button>
      <button onClick={() => send()} disabled={busy || !input.trim()} className="btn-primary shrink-0 !px-3" aria-label="Send"><Send size={16} /></button>
    </div>
  );

  // ── DOCK — IDE-style side panel (Guardian access) ──
  if (dock) {
    return (
      <div className="flex flex-col h-full bg-card border border-line rounded-[1.25rem] shadow-lift overflow-hidden dock-in">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-line bg-gradient-to-b from-cloud/50 to-card shrink-0">
          <span className="relative grid place-items-center h-9 w-9 rounded-full bg-ember/12 text-ember shrink-0">
            <Sparkles size={17} />
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-sage-600 ring-2 ring-card" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-ink leading-tight truncate">Talk with {name}</p>
            <p className="text-[11px] text-mist">A remembrance, in their words and voice</p>
          </div>
          {messages.length > 0 && <button onClick={reset} className="text-mist hover:text-ember p-1.5 rounded-lg" title="Clear conversation"><Trash2 size={15} /></button>}
          {onClose && <button onClick={onClose} className="text-mist hover:text-ink p-1.5 rounded-lg lg:hidden" title="Close"><X size={18} /></button>}
        </div>

        {fileInput}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 chat-scroll">
          {safetyNote}
          {contextBlock}
          {messageList}
        </div>

        <div className="border-t border-line p-3 shrink-0 bg-card">{inputBar}</div>
      </div>
    );
  }

  // ── INLINE — card layout (Companion preview) ──
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

      <div className="mb-4">{safetyNote}</div>
      {uploadContext && <div className="mb-4">{fileInput}{contextBlock}</div>}

      <div ref={scrollRef} className="space-y-3 max-h-[26rem] overflow-y-auto pr-1">{messageList}</div>

      <div className="mt-4">{inputBar}</div>
    </div>
  );
}
