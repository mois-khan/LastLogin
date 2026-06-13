import { useState, useRef, useEffect } from "react";
import { api } from "../../lib/api.js";

export default function WillAssistant() {
  const [messages, setMessages] = useState([
    { role: "model", text: "I'm here to help you set your digital affairs in order — calmly, at your pace. To begin, which online accounts matter most to you?" },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [extracted, setExtracted] = useState(null);
  const endRef = useRef(null);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

  const send = async () => {
    if (!input.trim() || busy) return;
    const next = [...messages, { role: "user", text: input }];
    setMessages(next); setInput(""); setBusy(true);
    try {
      const { data } = await api.post("/ai/will-assistant", { messages: next });
      setMessages([...next, { role: "model", text: data.reply }]);
      if (data.extracted) setExtracted(data.extracted);
    } catch {
      setMessages([...next, { role: "model", text: "I had trouble responding. Let's try again." }]);
    } finally { setBusy(false); }
  };

  return (
    <div>
      <h1 className="text-3xl mb-1">Your guide</h1>
      <p className="text-mist mb-6">A gentle conversation to prepare everything. One question at a time.</p>
      <div className="card max-w-2xl">
        <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "text-right" : ""}>
              <span className={`inline-block rounded-2xl px-4 py-2.5 text-sm max-w-[80%] ${
                m.role === "user" ? "bg-ink text-paper" : "bg-paper border border-line"}`}>
                {m.text}
              </span>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <div className="mt-5 flex gap-2">
          <input className="field" placeholder="Type your answer…" value={input}
            onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
          <button className="btn-ember" onClick={send} disabled={busy}>{busy ? "…" : "Send"}</button>
        </div>
      </div>

      {extracted && (
        <div className="card max-w-2xl mt-6">
          <h3 className="text-lg mb-2">Captured so far</h3>
          <pre className="mono text-xs whitespace-pre-wrap text-mist">{JSON.stringify(extracted, null, 2)}</pre>
          <p className="text-xs text-mist mt-3">These details flow into your Vault, Guardians and Messages.</p>
        </div>
      )}
    </div>
  );
}
