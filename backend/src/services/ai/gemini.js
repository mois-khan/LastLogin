import axios from "axios";

const BASE = "https://generativelanguage.googleapis.com/v1beta/models";
// Try models in order; on quota (429) or a transient 5xx, fall back to the next.
// Lite first = more free quota. Override the list with GEMINI_MODELS in .env.
const MODELS = (process.env.GEMINI_MODELS || "gemini-3.1-flash-lite,gemini-3.5-flash,gemini-2.5-flash")
  .split(",").map((m) => m.trim()).filter(Boolean);

function key() {
  const k = process.env.GEMINI_API_KEY;
  if (!k) throw new Error("GEMINI_API_KEY missing - get one free at https://aistudio.google.com/apikey");
  return k;
}

async function generate(parts, { json = false, system } = {}) {
  const body = {
    contents: [{ role: "user", parts }],
    ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
    generationConfig: json ? { responseMimeType: "application/json" } : {},
  };
  let lastErr;
  for (const model of MODELS) {
    try {
      const { data } = await axios.post(`${BASE}/${model}:generateContent?key=${key()}`, body, {
        headers: { "Content-Type": "application/json" },
      });
      return data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";
    } catch (e) {
      const status = e.response?.status;
      lastErr = e;
      if (status === 429 || (status >= 500 && status < 600)) continue; // quota/transient → next model
      throw e;
    }
  }
  throw lastErr;
}

/** Generic single-turn completion with an optional system instruction (json: force JSON output). */
export async function complete(prompt, { system, json } = {}) {
  return (await generate([{ text: prompt }], { system, json })).trim();
}

const WILL_SYSTEM = `You are the LastLogin guide: a warm, calm companion helping someone
prepare their digital estate. Ask ONE gentle question at a time. Cover: important
online accounts, any crypto and who should inherit it, 2-3 trusted guardians, and
whether there is anything unsaid they'd want a loved one to hear. Never rush.
When you have enough, end your reply with a single line of valid JSON prefixed by
[[VAULT]] containing { accounts:[], crypto:{beneficiary,split}, guardians:[], wishes:[] }.`;

/** Conversational will setup. messages = [{role:'user'|'model', text}] */
export async function chatWillAssistant(messages) {
  try {
    const history = messages.map((m) => `${m.role === "user" ? "User" : "Guide"}: ${m.text}`).join("\n");
    const reply = await generate([{ text: history + "\nGuide:" }], { system: WILL_SYSTEM });
    let extracted = null;
    const marker = reply.indexOf("[[VAULT]]");
    if (marker !== -1) {
      try { extracted = JSON.parse(reply.slice(marker + 9).trim()); } catch { /* ignore */ }
    }
    return { reply: marker !== -1 ? reply.slice(0, marker).trim() : reply.trim(), extracted };
  } catch {
    // Never leave the user staring at a dead chat - keep the conversation moving.
    return {
      reply: "I'm having a brief moment connecting - but I'm still here. While I reconnect: who would you most want to handle your accounts, and is there anything you'd want them to know?",
      extracted: null,
    };
  }
}

/** Vision check of an uploaded death certificate. Hackathon-grade heuristic, not legal advice. */
export async function verifyDeathCertificate(imageBase64, mimeType = "image/jpeg") {
  const prompt =
    "You are verifying whether the attached image is plausibly an official death certificate. " +
    "Return JSON: {looksValid:boolean, confidence:0-1, deceasedName:string|null, date:string|null, reason:string}.";
  try {
    const text = await generate(
      [{ text: prompt }, { inlineData: { mimeType, data: imageBase64 } }],
      { json: true }
    );
    return JSON.parse(text);
  } catch {
    return { looksValid: false, confidence: 0, deceasedName: null, date: null, reason: "Couldn't verify the document right now - please try again." };
  }
}

/** Pre-fill a platform-specific account closure / memorialization request. */
export async function draftClosureEmail(platform, action = "delete", deceasedName) {
  const ask =
    action === "memorialize" ? "memorialize (convert into a memorial)"
    : action === "transfer" ? "transfer ownership of"
    : "permanently close and delete";
  const prompt = `Write a concise, respectful email to ${platform}'s account/support team on behalf of the family,
requesting they ${ask} the account of ${deceasedName}, who has passed away. State that a death certificate is
attached. Warm but clear, plain text, ready to send - no unfilled placeholders except [DATE].`;
  return (await generate([{ text: prompt }])).trim();
}

/** A gentle AI life summary for the family dashboard. */
export async function generateObituary(profile) {
  const prompt = `Write a warm, dignified 120-word remembrance based on these notes,
in second person to the family ("they"). Notes: ${JSON.stringify(profile)}. No clichés.`;
  return (await generate([{ text: prompt }])).trim();
}
