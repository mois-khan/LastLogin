import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../lib/api.js";
import Candle from "../../components/ui/Candle.jsx";

// Public, gentle view the family sees after the estate is verified and executing.
export default function FamilyDashboard() {
  const { userId } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.get(`/trigger/family/${userId}`)
      .then((r) => setData(r.data))
      .catch((e) => setErr(e.response?.data?.error || "This space isn't available yet."));
  }, [userId]);

  if (err) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
      <Candle size={72} />
      <p className="mt-6 text-mist max-w-sm">{err}</p>
    </div>
  );
  if (!data) return <div className="min-h-screen flex items-center justify-center text-mist">Loading…</div>;

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="flex flex-col items-center text-center">
          {/* the flame is still now — they have passed */}
          <Candle size={80} still />
          <h1 className="mt-6 text-4xl">In memory of {data.name}</h1>
          <p className="mt-3 text-mist max-w-md">
            They prepared this for you. Take your time. Everything here was left with love.
          </p>
        </div>

        <section className="mt-12 space-y-6">
          <h2 className="text-2xl">Their words for you</h2>
          {data.messages?.length ? data.messages.map((m) => (
            <div key={m._id} className="card">
              <p className="text-sm text-mist mb-1">To {m.recipientName}</p>
              <p className="mb-3">{m.text}</p>
              {m.audioUrl && <audio controls src={m.audioUrl} className="w-full" />}
            </div>
          )) : <p className="text-mist">No messages.</p>}
        </section>

        {data.executedTx && (
          <section className="mt-12">
            <h2 className="text-2xl mb-3">Inheritance, settled on-chain</h2>
            <div className="card">
              <p className="text-mist text-sm mb-2">Transferred automatically, verifiable by anyone, contestable by no one.</p>
              <a className="mono text-xs text-ember break-all"
                href={`https://sepolia.etherscan.io/tx/${data.executedTx}`} target="_blank" rel="noreferrer">
                {data.executedTx} ↗
              </a>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
