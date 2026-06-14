import { useRef, useState } from "react";
import { Play, Pause, Download, AlertCircle } from "lucide-react";
import SoundBars from "./SoundBars.jsx";

// A calm, keyboard-accessible audio player - no raw browser chrome. One ember play
// button, a seekable bar (click + arrow keys), elapsed / total time. Used wherever a
// cloned-voice message is heard: the guardian portal, the memorial, and Messages.
export default function AudioPlayer({ src }) {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const [d, setD] = useState(0);
  const [failed, setFailed] = useState(false);
  const fmt = (s) => (isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "0:00");
  const toggle = () => { const a = ref.current; if (!a) return; a.paused ? a.play() : a.pause(); };
  const onBar = (e) => { const a = ref.current; if (!a || !d) return; const r = e.currentTarget.getBoundingClientRect(); a.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * d; };
  const onKey = (e) => {
    const a = ref.current; if (!a) return;
    if (e.key === "ArrowRight") { a.currentTime = Math.min(d || 0, a.currentTime + 5); e.preventDefault(); }
    else if (e.key === "ArrowLeft") { a.currentTime = Math.max(0, a.currentTime - 5); e.preventDefault(); }
    else if (e.key === "Home") { a.currentTime = 0; e.preventDefault(); }
    else if (e.key === "End") { a.currentTime = d || 0; e.preventDefault(); }
    else if (e.key === " " || e.key === "Enter") { toggle(); e.preventDefault(); }
  };
  // If the audio can't load (slow/expired URL), never leave a dead player - offer the file.
  if (failed) {
    return (
      <div className="flex items-center gap-2.5 rounded-2xl bg-paper border border-line/70 px-4 py-3 text-sm text-mist">
        <AlertCircle size={16} className="text-ember shrink-0" />
        <span className="flex-1">This recording didn't load.</span>
        <a href={src} download="message.mp3" className="inline-flex items-center gap-1.5 text-ember hover:underline shrink-0">
          <Download size={13} /> Download instead
        </a>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3.5 rounded-2xl bg-paper border border-line/70 pl-2 pr-4 py-2">
      <audio ref={ref} src={src} preload="metadata"
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)}
        onError={() => setFailed(true)}
        onTimeUpdate={(e) => setT(e.target.currentTime)} onLoadedMetadata={(e) => setD(e.target.duration)} />
      <button onClick={toggle} aria-label={playing ? "Pause" : "Play"}
        className="grid place-items-center h-10 w-10 rounded-full bg-ember text-white shrink-0 shadow-[0_2px_10px_-2px_rgba(200,116,58,0.6)] active:scale-95 transition focus-visible:outline-none focus-visible:shadow-focus">
        {playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
      </button>
      <div role="slider" tabIndex={0} aria-label="Seek" aria-valuemin={0} aria-valuemax={Math.round(d) || 0}
        aria-valuenow={Math.round(t)} aria-valuetext={`${fmt(t)} of ${fmt(d)}`} onClick={onBar} onKeyDown={onKey}
        className="flex-1 h-1.5 rounded-full bg-line overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:shadow-focus">
        <div className="h-full bg-ember rounded-full transition-[width] duration-150" style={{ width: d ? `${(t / d) * 100}%` : "0%" }} />
      </div>
      {playing
        ? <SoundBars className="text-ember shrink-0" />
        : <span className="mono text-xs text-mist tabular-nums shrink-0">{fmt(t)} / {fmt(d)}</span>}
    </div>
  );
}
