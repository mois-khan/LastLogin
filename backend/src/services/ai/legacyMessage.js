import * as sarvam from "./sarvam.js";
import * as eleven from "./elevenlabs.js";

/**
 * The product's emotional core. Takes an English message and produces it in the
 * user's OWN cloned voice, speaking their family's language.
 *
 * Flow:  English text
 *          --> Sarvam (Mayura) translate to target Indian language   [India-first intelligence]
 *          --> ElevenLabs (multilingual, cloned voice) speak it       [the person's actual voice]
 *
 * Returns { translatedText, audio (Buffer mp3), targetLang }.
 */
export async function generateLegacyMessage({ text, targetLang = "hi-IN", voiceId }) {
  if (!voiceId) throw new Error("voiceId required — clone the user's voice first");

  // English stays as-is; otherwise translate via Sarvam.
  const translatedText = targetLang === "en-IN" ? text : await sarvam.translate(text, targetLang);

  // Speak in the cloned voice. multilingual_v2 renders Hindi/Tamil/etc in the same voice identity.
  const audio = await eleven.speak(voiceId, translatedText, "eleven_multilingual_v2");

  return { translatedText, audio, targetLang };
}
