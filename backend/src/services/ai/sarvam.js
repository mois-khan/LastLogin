import axios from "axios";
import FormData from "form-data";

const BASE = "https://api.sarvam.ai";

// ₹100 free credits on signup: https://dashboard.sarvam.ai
function headers() {
  const k = process.env.SARVAM_API_KEY;
  if (!k) throw new Error("SARVAM_API_KEY missing — get it at https://dashboard.sarvam.ai");
  return { "api-subscription-key": k, "Content-Type": "application/json" };
}

/**
 * Translate text into an Indian language using Mayura.
 * targetLang e.g. "hi-IN", "ta-IN", "te-IN", "mr-IN". This is the India-first
 * intelligence: it handles transliteration and code-mixing better than generic MT.
 */
export async function translate(text, targetLang = "hi-IN", sourceLang = "en-IN", gender) {
  // "modern-colloquial" = natural spoken Hindi/Telugu with English mixed in where it
  // sounds real (Hinglish when needed) — warmer than stiff formal translation.
  const body = { input: text, source_language_code: sourceLang, target_language_code: targetLang, mode: "modern-colloquial" };
  // speaker_gender fixes gendered verbs in the OUTPUT — "karta hu" (Male) vs "karti hu" (Female).
  if (gender === "male") body.speaker_gender = "Male";
  else if (gender === "female") body.speaker_gender = "Female";
  const { data } = await axios.post(`${BASE}/translate`, body, { headers: headers() });
  return data.translated_text;
}

/** Speech-to-text via Saarika — India-first STT (handles Indian languages + code-mixing). */
export async function stt(buffer, language = "unknown", filename = "audio.wav") {
  const k = process.env.SARVAM_API_KEY;
  if (!k) throw new Error("SARVAM_API_KEY missing — get it at https://dashboard.sarvam.ai");
  const form = new FormData();
  form.append("file", buffer, { filename, contentType: "audio/wav" });
  form.append("model", "saarika:v2.5"); // v2 is deprecated
  form.append("language_code", language || "unknown"); // "unknown" lets Saarika auto-detect
  const { data } = await axios.post(`${BASE}/speech-to-text`, form, {
    headers: { ...form.getHeaders(), "api-subscription-key": k },
  });
  return data.transcript || "";
}

/** Native Indian-language speech via Bulbul (returns base64 wav). Optional alternative voice. */
export async function tts(text, targetLang = "hi-IN", speaker = "anushka") {
  const { data } = await axios.post(
    `${BASE}/text-to-speech`,
    { inputs: [text], target_language_code: targetLang, speaker, model: "bulbul:v2" },
    { headers: headers() }
  );
  return data.audios?.[0]; // base64 wav
}
