import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as sarvam from "./sarvam.js";
import * as eleven from "./elevenlabs.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FALLBACK_CLIP = path.resolve(__dirname, "../../fixtures/demo-voice.mp3");

/**
 * The product's emotional core. English message -> the user's OWN cloned voice,
 * speaking their family's language.  English --Sarvam--> target language
 * --ElevenLabs(cloned voice)--> audio.
 *
 * Demo insurance (#23/#41): if a live AI call stalls or is over quota, we never
 * hard-fail the centerpiece — we fall back to a guaranteed pre-generated clip.
 * Returns { translatedText, audio (Buffer mp3), targetLang, fallback? }.
 */
export async function generateLegacyMessage({ text, targetLang = "hi-IN", voiceId }) {
  if (!voiceId) throw new Error("voiceId required — clone the user's voice first");
  try {
    const translatedText = targetLang === "en-IN" ? text : await sarvam.translate(text, targetLang);
    const audio = await eleven.speak(voiceId, translatedText, "eleven_multilingual_v2");
    return { translatedText, audio, targetLang };
  } catch (e) {
    if (fs.existsSync(FALLBACK_CLIP)) {
      return { translatedText: text, audio: fs.readFileSync(FALLBACK_CLIP), targetLang, fallback: true };
    }
    throw e;
  }
}
