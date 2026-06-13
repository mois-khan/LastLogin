import axios from "axios";

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
export async function translate(text, targetLang = "hi-IN", sourceLang = "en-IN") {
  const { data } = await axios.post(
    `${BASE}/translate`,
    { input: text, source_language_code: sourceLang, target_language_code: targetLang, mode: "formal" },
    { headers: headers() }
  );
  return data.translated_text;
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
