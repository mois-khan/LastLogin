// A gentle five-bar voice cue. Shown while the cloned voice is speaking and while the
// owner is recording - a calm, reverent "the voice is here" signal, not a meter.
// Inherits color via currentColor, so set text-* on the parent.
export default function SoundBars({ className = "" }) {
  return (
    <span className={`sound-bars ${className}`} aria-hidden="true">
      <i /><i /><i /><i /><i />
    </span>
  );
}
