import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { api } from "../../lib/api.js";

export default function WillAssistant() {
  const [messages, setMessages] = useState([
    { role: "model", text: "I'm here to help you set your digital affairs in order — calmly, at your pace. To begin, which online accounts matter most to you?" },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [extracted, setExtracted] = useState(null);
  const endRef = useRef(null);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, busy]);

  const send = async () => {
    if (!input.trim() || busy) return;
    const next = [...messages, { role: "user", text: input }];
    setMessages(next); setInput(""); setBusy(true);
    try {
      const { data } = await api.post("/ai/will-assistant", { messages: next });
      setMessages([...next, { role: "model", text: data.reply }]);
      if (data.extracted) setExtracted(data.extracted);
    } catch {
      setMessages([...next, { role: "model", text: "I had trouble responding just now. Let's try that again." }]);
    } finally { setBusy(false); }
  };

  return (
    <div className="rise">
      <h1 className="font-display text-title mb-1">Your guide</h1>
      <p className="text-mist mb-8 max-w-xl">A gentle conversation to prepare everything — one question at a time. What you share is captured into your vault.</p>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card flex flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto max-h-[55vh] pr-1">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                {m.role === "model" && (
                  <span className="grid place-items-center h-8 w-8 shrink-0 rounded-lg bg-ember/12 text-ember"><Sparkles size={15} /></span>
                )}
                <span className={`inline-block rounded-2xl px-4 py-2.5 text-sm leading-relaxed max-w-[80%] ${
                  m.role === "user" ? "bg-ink text-paper" : "bg-paper border border-line"}`}>
                  {m.text}
                </span>
              </div>
            ))}
            {busy && (
              <div className="flex gap-3">
                <span className="grid place-items-center h-8 w-8 shrink-0 rounded-lg bg-ember/12 text-ember"><Sparkles size={15} /></span>
                <span className="inline-flex items-center gap-1 rounded-2xl px-4 py-3 bg-paper border border-line">
                  {[0, 1, 2].map((d) => <span key={d} className="h-1.5 w-1.5 rounded-full bg-mist animate-bounce" style={{ animationDelay: `${d * 0.15}s` }} />)}
                </span>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="mt-5 pt-4 border-t border-line flex gap-2">
            <input className="field" placeholder="Type your answer…" value={input}
              onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
            <button className="btn-primary !px-4" onClick={send} disabled={busy || !input.trim()} aria-label="Send">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>

        <div className="lg:col-span-1">
          {extracted ? (
            <div className="card rise sticky top-24">
              <h3 className="text-h mb-3">Captured so far</h3>
              <pre className="mono text-xs whitespace-pre-wrap text-graphite leading-relaxed">{JSON.stringify(extracted, null, 2)}</pre>
              <p className="mt-4 pt-4 border-t border-line text-xs text-mist">These details flow into your Vault, Guardians and Messages.</p>
            </div>
          ) : (
            <div className="card text-sm text-mist sticky top-24">
              <Sparkles size={18} className="text-ember mb-2" />
              As you talk, the guide quietly organises what you share — accounts, crypto, guardians, final wishes — and it appears here, ready for your vault.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
