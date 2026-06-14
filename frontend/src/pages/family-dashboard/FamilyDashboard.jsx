import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ExternalLink, ShieldCheck, Download } from "lucide-react";
import { api } from "../../lib/api.js";
import Candle from "../../components/ui/Candle.jsx";
import AudioPlayer from "../../components/ui/AudioPlayer.jsx";

// The public memorial the family sees once the estate is verified and executing.
// Calm, reverent - no chrome, no nav. The screen judges remember.
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
  if (!data) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <Candle size={84} still />
      <div className="mt-8 w-full max-w-md space-y-3">
        <div className="skeleton h-4 w-2/3 mx-auto" />
        <div className="skeleton h-4 w-1/2 mx-auto" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-2xl px-6 py-20">
        {/* Header - the flame is still now */}
        <div className="flex flex-col items-center text-center rise">
          <Candle size={84} still />
          <p className="mt-7 eyebrow">In loving memory</p>
          <h1 className="mt-4 font-display text-[2.75rem] sm:text-[3.5rem] font-normal leading-[1.05] tracking-[-0.02em]">{data.name}</h1>
          <p className="mt-5 text-graphite max-w-md leading-relaxed">
            They prepared this for you, while they still could. Take your time - everything here was left with love.
          </p>
        </div>

        {/* The voice - the centerpiece */}
        <section className="mt-16">
          <h2 className="font-display text-[1.625rem] leading-[1.18] tracking-[-0.015em] mb-6">Their words for you</h2>
          {data.messages?.length ? (
            <div className="space-y-5">
              {data.messages.map((m) => (
                <article key={m._id} className="surface p-8 rise">
                  {m.recipientName && <p className="eyebrow mb-4">For {m.recipientName}</p>}
                  <p className="font-display text-[1.2rem] sm:text-[1.35rem] leading-[1.7] text-ink max-w-[34rem]">{m.text}</p>
                  {m.audioUrl && (
                    <div className="mt-6">
                      <AudioPlayer src={m.audioUrl} />
                      <div className="mt-2.5 flex items-center justify-between">
                        <span className="text-xs text-mist">Spoken in their own voice</span>
                        <a href={m.audioUrl} download="message.mp3" className="inline-flex items-center gap-1.5 text-xs text-ember hover:underline"><Download size={12} /> Save audio</a>
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <p className="text-mist">No messages were left.</p>
          )}
        </section>

        {/* The inheritance - settled on-chain */}
        {data.executedTx && (
          <section className="mt-14 rise">
            <h2 className="font-display text-[1.625rem] leading-[1.18] tracking-[-0.015em] mb-6">What they left to you</h2>
            <div className="card">
              <div className="flex items-center gap-2 text-sage-600 mb-3">
                <ShieldCheck size={18} />
                <span className="text-sm font-medium">They arranged this for you - carried out exactly as they wished.</span>
              </div>
              <a className="inline-flex items-center gap-1.5 mono text-xs text-ember hover:underline break-all"
                href={`https://sepolia.etherscan.io/tx/${data.executedTx}`} target="_blank" rel="noreferrer">
                {data.executedTx} <ExternalLink size={13} className="shrink-0" />
              </a>
            </div>
          </section>
        )}

        <div className="mt-16 text-center">
          <a href="/access" className="text-sm text-ember hover:underline">Are you a guardian? Open what was left in your care →</a>
          <a href="/" className="mt-4 block text-xs text-mist hover:text-ink transition-colors">Held in trust by LastLogin.</a>
        </div>
      </div>
    </div>
  );
}
