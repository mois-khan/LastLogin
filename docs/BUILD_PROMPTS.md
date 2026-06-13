# LastLogin — Build Prompts

Copy-paste prompts for an AI coding assistant (Claude Code, Cursor, etc.). Each
is scoped to one module so you can run them in parallel.

> **The codebase already exists.** `lastlogin-project.tar.gz` ships a verified,
> runnable build, and `CLAUDE.md` (inside it) is auto-read by Claude Code with the
> full context + the live TODO list. So most of the "build it" prompts below
> (A1, B-*, C-*) are **already done** — use them only as reference for *how a part
> was built*, or if you want to regenerate a file. For new work, prefer this:
>
> *"Read CLAUDE.md. Pick TODO item «X». Implement it without breaking the demo
> spine or the design system, run the relevant checks (e.g. `npx hardhat test`),
> then write one conventional commit and open a PR."*
>
> Run one Claude Code session per dev, each cd'd into its folder (A→`contracts/`,
> B→`backend/src/services/ai/`, C→`frontend/`). The prompts below remain valid if
> you ever start a module from scratch.

---

## DEV A — CHAIN & CRYPTO

### A1 — Finish the contract
```
In contracts/contracts/LastLogin.sol, complete the digital-estate executor.
Requirements: an owner; an array of exactly 3 guardian addresses; a 2-of-3
confirmDeath() flow where each guardian can confirm once; on reaching the
threshold, automatically split the contract's ETH balance to beneficiaries by
basis points (sum = 10000) and emit an Executed event with a timestamp; a public
getState() view; reject double-confirmations and non-guardians. Keep it under
~80 lines, well-commented. Then write contracts/test/LastLogin.test.js with two
Hardhat+chai tests: (1) deploy with 3 guardians + 2 beneficiaries, (2) two
confirmations trigger payout in the correct split. Use ethers v6 syntax.
```

### A2 — Deploy + service wrapper
```
Write contracts/scripts/deploy.js to deploy LastLogin to Sepolia using the
SEPOLIA_RPC_URL and DEPLOYER_PRIVATE_KEY from backend/.env, taking guardians and
beneficiaries from a small config object at the top, and printing the deployed
address. Then write backend/src/services/blockchain/ethers.js exporting:
getProvider(), getContract(), getState(), confirmDeath(guardianPrivateKey), and
onExecuted(callback) that subscribes to the Executed event. Use ethers v6.
```

---

## DEV B — AI & VOICE

### B1 — Gemini service (3 roles)
```
Create backend/src/services/ai/gemini.js (ESM, uses GEMINI_API_KEY, calls the
Google Generative Language REST API with fetch, model gemini-2.0-flash or current
flash model). Export three functions:
1) chatWillAssistant(messages) — system prompt makes Gemini a warm digital-estate
   guide that asks one question at a time and, when it has enough, returns a JSON
   object of extracted vault fields (accounts[], crypto{}, guardians[], wishes[]).
2) verifyDeathCertificate(imageBase64) — Vision call that returns {looksValid:bool,
   reason, extractedName, extractedDate}. Hackathon-grade heuristic, not legal.
3) draftClosureEmail(platform, accountType, deceasedName) — returns a polite,
   platform-specific account memorialization/closure email body.
Add robust error handling and a clear comment on where to get the key.
```

### B2 — ElevenLabs + Sarvam voice pipeline
```
Create backend/src/services/ai/elevenlabs.js with cloneVoice(audioFilePath,name)
→ returns voiceId (Instant Voice Cloning API), and speak(voiceId, text) → returns
audio Buffer (text-to-speech). Uses ELEVENLABS_API_KEY. Note in comments that the
free tier may not allow API access (Starter plan needed).

Then create backend/src/services/ai/sarvam.js using the sarvamai pattern: tts(text,
languageCode, speaker) via the Bulbul model returning audio, and translate(text,
targetLang). Uses SARVAM_API_KEY from dashboard.sarvam.ai.

Finally create backend/src/services/ai/legacyMessage.js exporting
generateLegacyMessage({text, targetLang, voiceId}) which: translates text to the
target Indian language via Sarvam, then speaks it in the user's cloned voice via
ElevenLabs, and returns the audio. This is the product's emotional centerpiece —
make the interface clean.
```

---

## DEV C — PRODUCT & PLATFORM

### C1 — Backend foundation
```
In backend/src, implement: config/db.js (mongoose connect to MONGODB_URI with
clear logs); models/User.js (email, passwordHash, lastSeen, guardians ref),
VaultItem.js (userId, type enum [account,crypto,document,subscription], encrypted
blob {iv,tag,data}, label), Guardian.js, Message.js (recipient, text, lang,
audioUrl, voiceId), TriggerEvent.js (step, status, txHash, ts). Then routes +
controllers for auth (register/login issuing JWT, bcryptjs) and vault (CRUD,
encrypting payloads with services/crypto/vault.js before save, JWT-protected via
middleware/auth.js). Wire them into server.js. ESM throughout.
```

### C2 — Frontend spine
```
In frontend/src build, with React Router + Tailwind, a calm grief-appropriate
theme (warm neutrals, generous spacing, NO red/alert colors): auth pages; a
will-assistant chat page that streams messages to/from /api/ai/will-assistant; a
vault page listing items by type with an add modal; a guardians page showing
2-of-3 confirmation status; a messages page to record a voice sample (MediaRecorder),
write a message, pick a language, and play back the generated clip; and a
family-dashboard page that plays the deceased's message, shows the Sepolia tx hash
as an Etherscan link, and lists Gemini-drafted closure emails. Use a shared axios
client in lib/ and an auth context. Keep components small.
```

### C3 — Vultr deploy
```
Give me the exact steps to deploy this Node+Express backend to a Vultr compute
instance (Ubuntu): provision, install Node 20, clone the repo, set env vars,
run with pm2, open the firewall port, and (optionally) put nginx in front. Output
as a copy-paste runbook I can follow in 15 minutes.
```

---

## INTEGRATION PROMPTS (Phase 2 — run with whoever pairs)

### I1 — Trigger orchestration
```
Create backend/src/routes/trigger.js + controller that orchestrates the death
trigger: accept a death-certificate image, call gemini.verifyDeathCertificate,
require it valid, then expose a guardian-confirm endpoint that calls
blockchain.confirmDeath; subscribe to the on-chain Executed event and, when it
fires, mark the user EXECUTING in Mongo, log a TriggerEvent with the txHash, and
unlock the family dashboard data. Return clear status objects the frontend can poll.
```

### I2 — Demo seed
```
Write backend/scripts/seed-demo.js that creates a demo user with a filled vault,
3 guardians, one funded beneficiary, and one pre-generated Hindi legacy message,
so we can demo the family dashboard without onboarding live. Idempotent.
```

---

## SUBMISSION PROMPTS (Phase 4)

### S1 — README
```
Write a polished README.md for LastLogin: one-line pitch, the problem, the
solution, an architecture diagram (ASCII), the stack, a "Sponsor tech & why"
section (Gemini, ElevenLabs, Sarvam, MongoDB, Vultr, Ethereum, GitHub — one
paragraph each), setup steps, the live URL and contract address, and screenshots
placeholders. Tone: confident, human, not buzzwordy.
```

### S2 — Devfolio writeup + video script
```
Draft (a) a Devfolio project description covering inspiration, what it does, how
we built it, challenges, accomplishments, what we learned, and what's next; and
(b) a 90-second demo video script that opens on the cloned-voice Hindi message to
a daughter, then shows the live on-chain trigger, then the family dashboard payoff.
Make the opening land emotionally in the first 10 seconds.
```
