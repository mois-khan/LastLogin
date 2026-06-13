import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ExternalLink, ShieldCheck, Heart } from "lucide-react";
import { api } from "../../lib/api.js";
import Candle from "../../components/ui/Candle.jsx";

// The public memorial the family sees once the estate is verified and executing.
// Calm, reverent — no chrome, no nav. The screen judges remember.
export default function FamilyDashboard() {
  const { userId } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.get(`/trigger/family/${userId}`)
      .then((r) => setData(r.data))
      .catch((e) => setErr(e.response?.data?.error || "This space isn't ready yet."));
  }, [userId]);

  if (err) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
      <Candle size={72} />
      <p className="mt-7 text-mist max-w-sm leading-relaxed">{err}</p>
    </div>
  );
  if (!data) return <div className="min-h-screen flex items-center justify-center text-mist">Loading…</div>;

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-2xl px-6 py-20">
        {/* Header — the flame is still now */}
        <div className="flex flex-col items-center text-center rise">
          <Candle size={84} still />
          <p className="mt-7 text-xs uppercase tracking-[0.2em] text-mist">In loving memory</p>
          <h1 className="mt-3 font-display text-hero leading-tight">{data.name}</h1>
          <p className="mt-5 text-graphite max-w-md leading-relaxed">
            They prepared this for you, while they still could. Take your time — everything here was left with love.
          </p>
        </div>

        {/* The voice — the centerpiece */}
        <section className="mt-16">
          <h2 className="font-display text-h mb-5 flex items-center gap-2">
            <Heart size={18} className="text-ember" /> Their words for you
          </h2>
          {data.messages?.length ? (
            <div className="space-y-5">
              {data.messages.map((m) => (
                <div key={m._id} className="card rise">
                  {m.recipientName && <p className="text-xs uppercase tracking-wide text-mist mb-2">For {m.recipientName}</p>}
                  <p className="text-lg leading-relaxed mb-4">{m.text}</p>
                  {m.audioUrl && (
                    <audio controls src={m.audioUrl} className="w-full">
                      Your browser can't play this audio.
                    </audio>
                  )}
                  <p className="mt-3 text-xs text-mist">Spoken in their own voice.</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-mist">No messages were left.</p>
          )}
        </section>

        {/* The inheritance — settled on-chain */}
        {data.executedTx && (
          <section className="mt-14 rise">
            <h2 className="font-display text-h mb-5">Their estate, settled</h2>
            <div className="card">
              <div className="flex items-center gap-2 text-sage-600 mb-3">
                <ShieldCheck size={18} />
                <span className="text-sm font-medium">Transferred automatically — verifiable by anyone, contestable by no one.</span>
              </div>
              <a className="inline-flex items-center gap-1.5 mono text-xs text-ember hover:underline break-all"
                href={`https://sepolia.etherscan.io/tx/${data.executedTx}`} target="_blank" rel="noreferrer">
                {data.executedTx} <ExternalLink size={13} className="shrink-0" />
              </a>
            </div>
          </section>
        )}

        <p className="mt-16 text-center text-xs text-mist">Held in trust by LastLogin.</p>
      </div>
    </div>
  );
}
