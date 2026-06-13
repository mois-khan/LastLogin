import axios from "axios";

const BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const MODEL = "gemini-2.0-flash"; // fast + free-tier friendly; swap to latest flash if needed

function key() {
  const k = process.env.GEMINI_API_KEY;
  if (!k) throw new Error("GEMINI_API_KEY missing — get one free at https://aistudio.google.com/apikey");
  return k;
}

async function generate(parts, { json = false, system } = {}) {
  const body = {
    contents: [{ role: "user", parts }],
    ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
    generationConfig: json ? { responseMimeType: "application/json" } : {},
  };
  const { data } = await axios.post(`${BASE}/${MODEL}:generateContent?key=${key()}`, body, {
    headers: { "Content-Type": "application/json" },
  });
  return data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";
}

const WILL_SYSTEM = `You are the LastLogin guide: a warm, calm companion helping someone
prepare their digital estate. Ask ONE gentle question at a time. Cover: important
online accounts, any crypto and who should inherit it, 2-3 trusted guardians, and
whether there is anything unsaid they'd want a loved one to hear. Never rush.
When you have enough, end your reply with a single line of valid JSON prefixed by
[[VAULT]] containing { accounts:[], crypto:{beneficiary,split}, guardians:[], wishes:[] }.`;

/** Conversational will setup. messages = [{role:'user'|'model', text}] */
export async function chatWillAssistant(messages) {
  const history = messages.map((m) => `${m.role === "user" ? "User" : "Guide"}: ${m.text}`).join("\n");
  const reply = await generate([{ text: history + "\nGuide:" }], { system: WILL_SYSTEM });
  let extracted = null;
  const marker = reply.indexOf("[[VAULT]]");
  if (marker !== -1) {
    try { extracted = JSON.parse(reply.slice(marker + 9).trim()); } catch { /* ignore */ }
  }
  return { reply: marker !== -1 ? reply.slice(0, marker).trim() : reply.trim(), extracted };
}

/** Vision check of an uploaded death certificate. Hackathon-grade heuristic, not legal advice. */
export async function verifyDeathCertificate(imageBase64, mimeType = "image/jpeg") {
  const prompt =
    "You are verifying whether the attached image is plausibly an official death certificate. " +
    "Return JSON: {looksValid:boolean, confidence:0-1, deceasedName:string|null, date:string|null, reason:string}.";
  const text = await generate(
    [{ text: prompt }, { inlineData: { mimeType, data: imageBase64 } }],
    { json: true }
  );
  try { return JSON.parse(text); }
  catch { return { looksValid: false, confidence: 0, reason: "could not parse response" }; }
}

/** Pre-fill a platform-specific account closure / memorialization request. */
export async function draftClosureEmail(platform, accountType, deceasedName) {
  const prompt = `Write a concise, respectful ${platform} account ${
    accountType === "social" ? "memorialization" : "closure"
  } request on behalf of the family of the deceased (${deceasedName}). Mention that a
death certificate is attached. Plain text, no placeholders left unfilled except [DATE].`;
  return (await generate([{ text: prompt }])).trim();
}

/** A gentle AI life summary for the family dashboard. */
export async function generateObituary(profile) {
  const prompt = `Write a warm, dignified 120-word remembrance based on these notes,
in second person to the family ("they"). Notes: ${JSON.stringify(profile)}. No clichés.`;
  return (await generate([{ text: prompt }])).trim();
}
