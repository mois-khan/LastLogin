// Record from the mic and return a mono 16-bit WAV Blob — the format Sarvam Saarika STT wants.
// Usage: const rec = await startRecording(); … const wav = await rec.stop();
export async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mr = new MediaRecorder(stream);
  const chunks = [];
  mr.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  mr.start();
  return {
    cancel: () => { try { mr.stop(); } catch {} stream.getTracks().forEach((t) => t.stop()); },
    stop: () =>
      new Promise((resolve, reject) => {
        mr.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop());
          try {
            const blob = new Blob(chunks, { type: mr.mimeType || "audio/webm" });
            resolve(await toWav(blob));
          } catch (e) { reject(e); }
        };
        try { mr.stop(); } catch (e) { reject(e); }
      }),
  };
}

async function toWav(blob) {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  const ctx = new Ctx();
  try {
    const audioBuffer = await ctx.decodeAudioData(await blob.arrayBuffer());
    return encodeWav(audioBuffer);
  } finally { ctx.close?.(); }
}

function encodeWav(audioBuffer) {
  const sampleRate = audioBuffer.sampleRate;
  const ch = audioBuffer.getChannelData(0); // mono
  const len = ch.length;
  const buffer = new ArrayBuffer(44 + len * 2);
  const view = new DataView(buffer);
  const str = (off, s) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); };
  str(0, "RIFF"); view.setUint32(4, 36 + len * 2, true); str(8, "WAVE"); str(12, "fmt ");
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true); str(36, "data"); view.setUint32(40, len * 2, true);
  let off = 44;
  for (let i = 0; i < len; i++) {
    const s = Math.max(-1, Math.min(1, ch[i]));
    view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    off += 2;
  }
  return new Blob([view], { type: "audio/wav" });
}
