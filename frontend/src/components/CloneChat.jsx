import { useEffect, useRef, useState } from "react";
import { Send, Loader2, Mic, Square, Trash2, Upload, ShieldCheck, Sparkles, Check } from "lucide-react";
import AudioPlayer from "./ui/AudioPlayer.jsx";
import { startRecording } from "../lib/audio.js";

// Chat + talk with a persona. The clone replies in the SAME language the person uses; spoken
// input is transcribed (shown in Roman letters). Pure UI; the parent wires the endpoints.
// sendMessage(text, language, withAudio) -> { text, audioUrl }. transcribe(wavBlob) -> { text, language }.
export default function CloneChat({ name = "them", sendMessage, loadHistory, clearHistory, uploadContext, transcribe }) {
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
        A gentle AI recreation of {name}, not really them — here only for memories and comfort. It won't share private details or take on everyday tasks.
      </p>

      {uploadContext && (
        <div className="mb-4">
          <input ref={fileRef} type="file" accept=".txt,.zip" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          {ctx?.done ? (
            <div className="rounded-xl bg-sage/8 border border-sage/30 px-3.5 py-3">
              <p className="text-sm text-sage-600 font-medium flex items-center gap-1.5"><Check size={14} /> Personalized — {name} will sound more like how they were with you.</p>
              {ctx.summary && <p className="text-xs text-graphite mt-2 leading-relaxed">{ctx.summary}</p>}
              <button onClick={() => { setCtx(null); setTimeout(() => fileRef.current?.click(), 0); }} className="text-xs text-ember hover:underline mt-2">Replace</button>
            </div>
          ) : (
            <>
              <button onClick={() => fileRef.current?.click()} disabled={ctx?.busy} className="btn-secondary btn-sm">
                {ctx?.busy ? <><Loader2 size={14} className="animate-spin" /> Reading your chat…</> : <><Upload size={14} /> Personalize with your chat</>}
              </button>
              <p className="text-xs text-mist mt-1.5">Optional: in WhatsApp open your chat with {name} → Export chat → Without media, then upload the .txt or .zip. We keep only a private summary — never the chat.</p>
              {ctx?.error && <p className="text-xs text-ember mt-1.5">{ctx.error}</p>}
            </>
          )}
        </div>
      )}

      <div ref={scrollRef} className="space-y-3 max-h-[26rem] overflow-y-auto pr-1">
        {messages.length === 0 && !busy && (
          <p className="text-sm text-mist text-center py-8">Say hello, ask about a memory, or just tell them how you're doing.</p>
        )}
        {messages.map((m, i) => (m.role === "guardian" ? (
          <div key={i} className="flex justify-end">
            <div className="max-w-[80%] rounded-2xl rounded-br-md bg-ink text-paper px-4 py-2.5 text-sm leading-relaxed">{m.text}</div>
          </div>
        ) : (
          <div key={i} className="max-w-[85%]">
            <div className={`rounded-2xl rounded-bl-md px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${m.error ? "bg-paper text-mist" : "bg-paper text-ink"}`}>{m.text}</div>
            {m.audioUrl && <div className="mt-2"><AudioPlayer src={m.audioUrl} /></div>}
          </div>
        )))}
        {busy && <div className="flex items-center gap-2 text-sm text-mist"><Loader2 size={14} className="animate-spin" /> {name} is thinking…</div>}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <input className="field" placeholder={phase === "rec" ? "Listening…" : `Talk to ${name} — type or speak, any language…`} value={input}
          onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send(); }} />
        <button onClick={talk} disabled={busy || phase === "stt"} title="Speak"
          className={`grid place-items-center h-10 w-10 rounded-full shrink-0 transition ${phase === "rec" ? "bg-ember text-white animate-pulse" : "btn-secondary"}`}>
          {phase === "stt" ? <Loader2 size={15} className="animate-spin" /> : phase === "rec" ? <Square size={15} /> : <Mic size={16} />}
        </button>
        <button onClick={() => send()} disabled={busy || !input.trim()} className="btn-primary shrink-0 !px-3" aria-label="Send"><Send size={16} /></button>
      </div>
    </div>
  );
}
