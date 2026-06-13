import axios from "axios";
import fs from "fs";
import FormData from "form-data";

const BASE = "https://api.elevenlabs.io/v1";

// NOTE: the FREE tier may not include API access. Budget the $5 Starter plan.
function key() {
  const k = process.env.ELEVENLABS_API_KEY;
  if (!k) throw new Error("ELEVENLABS_API_KEY missing — Starter plan needed for API access");
  return k;
}

/** Instant Voice Cloning from a ~60s sample. Returns voiceId. */
export async function cloneVoice(audioFilePath, name = "LastLogin voice") {
  const form = new FormData();
  form.append("name", name);
  form.append("files", fs.createReadStream(audioFilePath));
  const { data } = await axios.post(`${BASE}/voices/add`, form, {
    headers: { ...form.getHeaders(), "xi-api-key": key() },
  });
  return data.voice_id;
}

/** Generate speech as a Buffer (mp3) in the given cloned voice. */
export async function speak(voiceId, text, modelId = "eleven_multilingual_v2") {
  const { data } = await axios.post(
    `${BASE}/text-to-speech/${voiceId}`,
    // Lower stability + some style = more emotional range and expression in the
    // cloned voice (warmer, less monotone) while staying recognisably them.
    { text, model_id: modelId, voice_settings: { stability: 0.4, similarity_boost: 0.85, style: 0.35, use_speaker_boost: true } },
    { headers: { "xi-api-key": key(), "Content-Type": "application/json", Accept: "audio/mpeg" },
      responseType: "arraybuffer" }
  );
  return Buffer.from(data);
}

export async function listVoices() {
  const { data } = await axios.get(`${BASE}/voices`, { headers: { "xi-api-key": key() } });
  return data.voices;
}
