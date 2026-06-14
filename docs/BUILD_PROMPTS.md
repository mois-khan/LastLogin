# LastLogin — Build Prompts (sequenced, per-teammate, issue-linked)

Copy-paste prompts for **Claude Code**, one session per teammate, each `cd`'d into
its folder. Every prompt is tied to a **GitHub issue**, tells you **exactly when to
run it**, and tells you **who you unblock when it's done**. Follow the order top-to-
bottom inside your lane; only cross lanes where a green handoff says so.

> **You are not starting from zero.** The repo already ships a verified, runnable
> build (contract tested, frontend builds, backend installs) and `CLAUDE.md` is
> auto-read by Claude Code with the full context + the live TODO. So most prompts
> below are **verify / wire / extend**, not "build from scratch". The original
> from-scratch prompts are preserved in **Appendix A** for reference.

---

## Who is who

| Dev | Name | GitHub | Email | Lane | Folder to `cd` into |
|----|------|--------|-------|------|----------------------|
| **A** | Mois Khan | `mois-khan` | moiskhanmd9090@gmail.com | Chain & Crypto | `contracts/` |
| **B** | Mushtaq | `Mushtaq6220` | 23uj1a6219@gmail.com | AI & Voice | `backend/src/services/ai/` |
| **C** | Avinash | `akavinashsingh` | akavinashsingh@gmail.com | Product & Platform (backend + frontend) | `backend/` then `frontend/` |

All issues are already created and assigned on GitHub. Find yours with:
`gh issue list --assignee "@me"` (or filter by label, e.g. `--label area:chain`).

---

## How to use this file

1. Open one Claude Code session per dev, `cd` into your folder (table above).
2. Work your lane **in order**. Each prompt has four tags:
   - 🎯 **Issue** — the GitHub issue it closes. Click it; tick its checkboxes as you go.
   - ▶ **Start when** — the preconditions. Do **not** start until these are green.
   - 🔓 **Unblocks** — who is waiting on you. Ping them in the PR/chat the moment it's done.
   - ✅ **Done when** — acceptance. Matches the issue's checklist.
3. **The golden prompt** (use it for any issue, then paste the issue-specific block):
   ```
   Read CLAUDE.md fully. We're working GitHub issue #<N>: "<title>".
   Implement/verify it WITHOUT breaking the Demo Spine or the design system.
   Touch only files in my lane unless the issue says otherwise. Run the relevant
   checks (e.g. npx hardhat test / npm run dev / a curl). Then write ONE
   conventional commit, open a PR, and in the PR body tick the issue's checklist
   and @-mention whoever this unblocks.
   ```
4. One PR per issue (or per tight cluster). Keep `main` green — we're chasing the
   GitHub prize too (see `docs/GITHUB_STRATEGY.md`).

---

## The critical path (read this once, out loud, as a team)

This is the chain that **must** complete in order — everything else hangs off it.
If a link here is late, the demo is at risk. Numbers are GitHub issues.

```
        ┌── A: #3 wallet + #4 RPC ──► A: #5 deploy to Sepolia ──► A: #12 ethers.js (getState/confirmDeath/onExecuted)
        │                                   │ (shares CONTRACT_ADDRESS + ABI)        │
SETUP   │                                   ▼                                        ▼
  +     │                            C: #26 trigger status  ◄──────────────  C: I1 trigger orchestration
KEYS ───┤                                                                            ▲
        │   B: #16 clone voice + #17 Sarvam translate ──► B: #18 legacy msg ⭐ ──┐    │ (also needs B: #19 cert-vision)
        │                                                                       │    │
        │   B: #15 will-assistant ──► C: #33 chat page                          │    │
        │   B: #19 cert vision ──────────────────────────────────────────────► gate │
        │                                                                       │    │
        └── C: #2 Mongo ──► C: #24 auth/JWT ──► C: #25 vault ───────────────────┤    │
                                                                                ▼    ▼
                                          C: #34 messages page  +  C: #31 guardian-confirm UI  +  C: #32 cert-upload UI
                                                                                ▼
                                                      C: #35 family dashboard  (plays #18 audio, shows #5 tx)  = SPINE DONE
```

**Three handoffs you must not fumble (the whole demo turns on these):**

| # | Producer → Consumer | The thing handed over | Until it lands, the consumer is blocked on |
|---|---------------------|------------------------|---------------------------------------------|
| H1 | **A → C** after #5/#12 | `CONTRACT_ADDRESS`, ABI, and a working `confirmDeath(signer)` / `onExecuted` | #26 status, I1 trigger, #31 guardian UI, #35 dashboard tx link |
| H2 | **B → C** after #18 | `POST /api/ai/messages` returns a playable cloned-voice Hindi `audioUrl` + the user's `voiceId` | #34 messages page, #41 fallback clip, #35 dashboard playback |
| H3 | **B → C** after #19 | `gemini.verifyDeathCertificate` + `POST /api/ai/verify-certificate` | #32 cert-upload UI, I1 trigger gate |

---

## Issue ownership (already assigned on GitHub)

| Owner | Issues |
|-------|--------|
| **A — Mois** (`mois-khan`) | #3, #4, #5, #6, #10, #11, #12, #13, #14 |
| **B — Mushtaq** (`Mushtaq6220`) | #15, #16, #17, #18, #19, #20, #21, #22, #23, #41, #45 |
| **C — Avinash** (`akavinashsingh`) | #2, #8, #9, #24, #25, #26, #27, #28, #29, #30, #31, #32, #33, #34, #35, #36, #37, #38, #39, #40, #42, #44, #47, #48 |
| **All three** | #1 (keys), #7 (install), #43 (rehearse), #46 (submit) |

---
---

# PHASE 0 — Setup & accounts (hr 0–2) · ALL THREE, IN PARALLEL

> Nobody moves to Phase 1 until **Checkpoint 0**: everyone has pushed one commit and
> every key returns 200. Broken keys at hour 20 kill teams.

### ☐ ALL — #1 Fill `backend/.env`, #7 run the repo locally
🎯 **Issues:** #1, #7   ▶ **Start when:** immediately   🔓 **Unblocks:** literally everything
- Each dev contributes their own keys to the **one** shared `backend/.env` (C owns the file):
  - **B** adds `GEMINI_API_KEY`, `ELEVENLABS_API_KEY` (Starter $5 — free tier blocks API cloning), `SARVAM_API_KEY`.
  - **A** adds `SEPOLIA_RPC_URL`, `DEPLOYER_PRIVATE_KEY` (see A's Phase-0 prompts).
  - **C** adds `MONGODB_URI`, `JWT_SECRET`, `VAULT_MASTER_KEY`.
- Prompt (each dev, in their folder):
  ```
  Read CLAUDE.md. Help me get LastLogin running locally for GitHub issue #7.
  Copy .env.example to backend/.env, then walk me through filling ONLY the keys I
  own (see docs/API_KEYS_GUIDE.md). Then run my folder's dev command and confirm
  it starts: backend -> `npm run dev` and GET /health returns { ok: true };
  frontend -> `npm run dev` opens :5173; contracts -> `npx hardhat test` passes.
  Report exactly which check passed.
  ```
✅ **Done when:** `npm run dev` boots, `GET /health` → `{ ok: true }`, all three machines can run their folder.

---

## A — Mois · Phase 0 (chain setup)

### ☐ A · #3 — Throwaway Sepolia wallet + faucet ETH
🎯 **Issue:** #3   ▶ **Start when:** now   🔓 **Unblocks:** your own #5 deploy (and therefore H1)
```
I need a brand-new wallet used ONLY for Sepolia testnet — never a real one. Walk me
through creating a fresh MetaMask account, exporting its private key into
backend/.env as DEPLOYER_PRIVATE_KEY, and getting ~0.1 Sepolia test ETH from a
faucet. Then show me a one-liner to confirm the balance with ethers v6.
```
✅ **Done when:** new wallet exists, ~0.1 Sepolia ETH received, key in `DEPLOYER_PRIVATE_KEY`.

### ☐ A · #4 — Sepolia RPC URL
🎯 **Issue:** #4   ▶ **Start when:** now (parallel with #3)   🔓 **Unblocks:** #5 deploy
```
Help me get an Alchemy (or Infura) HTTPS Sepolia RPC endpoint into backend/.env as
SEPOLIA_RPC_URL, then prove it works by calling getBlockNumber() with ethers v6.
```
✅ **Done when:** `SEPOLIA_RPC_URL` set, `getBlockNumber()` returns a number.

## B — Mushtaq · Phase 0 (AI setup)

### ☐ B · Record the 60-second voice sample NOW + smoke-test all 3 AI keys
▶ **Start when:** now   🔓 **Unblocks:** your #16 clone and #18 centerpiece — you cannot do them without the sample
```
Read CLAUDE.md. I'm setting up the AI lane (issue #1 keys). (1) Give me a 60-second
script to read aloud that will make a good ElevenLabs voice-clone sample, and tell
me the format to save it in. (2) Give me three one-line curl commands — one each for
Gemini, ElevenLabs, and Sarvam — that prove my keys return 200. Don't write app code
yet; just verify the keys.
```
✅ **Done when:** a clean ~60s WAV/MP3 of your voice is saved, and all three curls return 200.

## C — Avinash · Phase 0 (platform setup)

### ☐ C · #2 — MongoDB Atlas free cluster
🎯 **Issue:** #2   ▶ **Start when:** now   🔓 **Unblocks:** #24 auth, #25 vault, all backend storage
```
Read CLAUDE.md. Walk me through standing up a free M0 MongoDB Atlas cluster for
issue #2: create the cluster, allow 0.0.0.0/0 (demo only), put the connection string
in backend/.env as MONGODB_URI, then start the backend and confirm it logs
"Mongo connected".
```
✅ **Done when:** M0 cluster live, `MONGODB_URI` set, backend logs "Mongo connected".

### ☐ C · #8 — GitHub Actions CI green on `main`
🎯 **Issue:** #8   ▶ **Start when:** after first push   🔓 **Unblocks:** confidence for every later PR
```
Read CLAUDE.md and .github/workflows. The CI builds the frontend and compiles the
contract. Push to a branch, open a PR, and if CI is red, fix the path/node-version
issues until it's green on main. Don't change app behavior — only CI config.
```
✅ **Done when:** CI is green on `main`.

> **Checkpoint 0 (hr 2):** everyone pushed ≥1 commit; all keys return 200; #2 done; A has wallet+RPC; B has the voice sample. ✋ Don't start Phase 1 until this is true.

---
---

# PHASE 1 — Parallel core build (hr 2–12) · ISOLATED, MOCKED

Each dev builds behind a clean interface using fake data for the others. **No
integration yet** — that's Phase 2. Two things must get out the door early because
others depend on them: **A's deploy (#5/#12 = H1)** and **B's legacy message (#18 = H2)**.

## A — Mois · Phase 1 (chain core)

### ☐ A · #10 — Confirm all contract tests pass  *(do this first; no keys needed)*
🎯 **Issue:** #10   ▶ **Start when:** now   🔓 **Unblocks:** safe to deploy
```
In contracts/, run `npx hardhat test` and confirm 4/4 pass. Then walk me through
what each test proves (proof-of-life, vault hash, 2-of-3 payout, guard rejections)
so I can explain it to judges. Don't change the contract unless a test is red.
```
✅ **Done when:** `npx hardhat test` shows 4/4 passing and you can explain each.

### ☐ A · #5 — Deploy `LastLogin.sol` to Sepolia  ⭐ (H1 part 1)
🎯 **Issue:** #5   ▶ **Start when:** #3 + #4 + #10 are green   🔓 **Unblocks:** **C's #26, I1, #31, #35** — this is handoff H1
```
Edit the guardian/beneficiary addresses in contracts/scripts/deploy.js (use my
throwaway addresses), then deploy to Sepolia:
`npx hardhat run scripts/deploy.js --network sepolia`. Put the deployed address in
backend/.env as CONTRACT_ADDRESS and print the Etherscan link. Confirm it shows up
on sepolia.etherscan.io.
```
✅ **Done when:** deploy succeeds, `CONTRACT_ADDRESS` set, contract visible on Etherscan.
🔔 **Handoff:** post `CONTRACT_ADDRESS` + the ABI path to **C** the second this lands.

### ☐ A · #12 — `ethers.js` service: getState / confirmDeath / onExecuted  ⭐ (H1 part 2)
🎯 **Issue:** #12   ▶ **Start when:** #5 done   🔓 **Unblocks:** **C's #26 status & I1 trigger orchestration**
```
Verify/finish backend/src/services/blockchain/ethers.js for issue #12: export
getProvider(), getContract(), getState(), confirmDeath(guardianPrivateKey), and
onExecuted(callback) subscribing to the Executed event (ethers v6). Prove it end to
end: a confirmDeath from guardian #2 flips the contract ACTIVE -> EXECUTING and the
onExecuted listener fires. Return a real txHash. Add a tiny scripts/ smoke test.
```
✅ **Done when:** `/api/trigger/confirm` path returns a real txHash; 2nd guardian flips state; `Executed` observed.
🔔 **Handoff:** tell **C** the confirm + status plumbing is ready (H1 complete).

### ☐ A · #6 — Verify contract source on Etherscan
🎯 **Issue:** #6   ▶ **Start when:** #5 done (can wait until Phase 4)   🔓 **Unblocks:** judge "click & read the code" moment
```
Set ETHERSCAN_API_KEY in backend/.env, then run
`npx hardhat verify --network sepolia <CONTRACT_ADDRESS> <constructor args>` and
confirm the source is readable on Etherscan.
```
✅ **Done when:** verified source is readable on Etherscan.

### ☐ A · #11 — Fund the deployed contract with test ETH
🎯 **Issue:** #11   ▶ **Start when:** #5 done   🔓 **Unblocks:** a real on-chain payout in the demo
```
Send ~0.02 Sepolia test ETH into the deployed contract (via fund() or a plain
receive transfer) so beneficiaries can actually be paid on execution. Confirm the
balance on Etherscan.
```
✅ **Done when:** contract holds ~0.02 ETH, visible on Etherscan.

## B — Mushtaq · Phase 1 (AI core)

### ☐ B · #15 — Gemini will-assistant + JSON extraction  *(Spine 1)*
🎯 **Issue:** #15   ▶ **Start when:** Gemini key works   🔓 **Unblocks:** **C's #33 chat page**
```
Verify backend/src/services/ai/gemini.js chatWillAssistant(messages) for issue #15:
it must reply warmly, ONE question at a time, and when it has enough, emit the
[[VAULT]] JSON block (accounts[], crypto{}, guardians[], wishes[]). Test it with a
short scripted conversation and show me the parsed "Captured so far" object.
```
✅ **Done when:** sensible one-at-a-time replies; `[[VAULT]]` JSON parses into captured fields.
🔔 **Handoff:** tell **C** the `/api/ai/will-assistant` contract is stable.

### ☐ B · #16 — ElevenLabs voice clone  (H2 part 1)
🎯 **Issue:** #16   ▶ **Start when:** ElevenLabs Starter key + your 60s sample exist   🔓 **Unblocks:** your own #18
```
Verify backend/src/services/ai/elevenlabs.js cloneVoice(audioFilePath,name) for
issue #16: POST /api/ai/voice/clone with my ~60s clip returns a voiceId and saves it
on the user. Then speak(voiceId, "test") returns playable audio. Note in comments
that the free tier blocks API cloning (Starter needed).
```
✅ **Done when:** clone returns a `voiceId`, saved on the user; `speak()` plays.

### ☐ B · #17 — Sarvam translate to Hindi  (H2 part 2)
🎯 **Issue:** #17   ▶ **Start when:** Sarvam key works   🔓 **Unblocks:** your own #18
```
Verify backend/src/services/ai/sarvam.js translate(text, targetLang) for issue #17:
English -> natural Hindi (Devanagari). Then try one more language (Tamil/Telugu/
Marathi). Show both outputs.
```
✅ **Done when:** English→Hindi reads naturally; one other language also works.

### ☐ B · #18 — End-to-end legacy message: English → Hindi → cloned voice  ⭐⭐ (H2)
🎯 **Issue:** #18   ▶ **Start when:** #16 + #17 both green   🔓 **Unblocks:** **C's #34 messages page, C's #35 dashboard, your #41 fallback**
```
This is THE emotional centerpiece — it must be flawless. Verify
backend/src/services/ai/legacyMessage.js + POST /api/ai/messages for issue #18:
given {text, targetLang:'hi-IN', voiceId}, translate via Sarvam then speak in MY
cloned voice via ElevenLabs, and return a playable audioUrl. Confirm the audio is my
voice speaking Hindi. If latency is high, add an option to pre-generate.
```
✅ **Done when:** `/api/ai/messages` returns a playable `audioUrl` in the cloned voice speaking Hindi.
🔔 **Handoff (H2):** give **C** the endpoint shape + a sample `voiceId`. This is the demo's heart — tell the team it's live.

### ☐ B · #19 — Gemini Vision death-certificate verification  (H3)
🎯 **Issue:** #19   ▶ **Start when:** Gemini key works   🔓 **Unblocks:** **C's #32 cert-upload UI + I1 trigger gate**
```
Verify gemini.verifyDeathCertificate + POST /api/ai/verify-certificate for issue
#19: a sample cert image returns {looksValid, confidence, deceasedName, date}; a
clearly-not-a-cert image returns looksValid:false. Hackathon heuristic, not legal —
say so in comments.
```
✅ **Done when:** valid cert → structured true result; junk image → false.
🔔 **Handoff (H3):** tell **C** the verify endpoint is ready for the cert-upload UI and the trigger gate.

## C — Avinash · Phase 1 (platform core)

### ☐ C · #24 — Auth register/login + JWT
🎯 **Issue:** #24   ▶ **Start when:** #2 Mongo done   🔓 **Unblocks:** #25 vault and every protected route
```
Verify backend auth for issue #24: register and login return a JWT (bcryptjs hashes),
and protected routes reject missing/invalid tokens. Show me a curl that registers,
logs in, and then hits a protected route with and without the token.
```
✅ **Done when:** register/login return a token; protected routes reject bad/missing tokens.

### ☐ C · #25 — Vault encrypt / store / reveal against Atlas
🎯 **Issue:** #25   ▶ **Start when:** #24 done   🔓 **Unblocks:** Spine 3 (vault), #35 dashboard data
```
Verify vault CRUD for issue #25: adding an item stores ONLY the encrypted blob
(check the DB document directly), /:id/reveal decrypts correctly, and /fingerprint
returns a stable 0x hash. Uses services/crypto/vault.js (AES-256-GCM).
```
✅ **Done when:** DB shows only ciphertext; reveal decrypts; fingerprint is a stable 0x hash.

### ☐ C · #30 — Run the app and walk every page
🎯 **Issue:** #30   ▶ **Start when:** frontend boots   🔓 **Unblocks:** your Phase-2 wiring (you'll know what's stubbed)
```
Run the frontend and walk every page for issue #30: landing, will-assistant, vault,
guardians, messages, family dashboard. Confirm each loads. For anything visibly
broken, open a new GitHub issue (area:frontend) and link it here.
```
✅ **Done when:** all six pages load; anything broken is filed as a new issue.

### ☐ C · Early Vultr smoke deploy (eligibility) — counts toward #47
▶ **Start when:** backend boots locally   🔓 **Unblocks:** Vultr prize eligibility + a public smoke URL
```
Read docs (and Appendix C3). Deploy the BARE backend to a Vultr Ubuntu instance now
(Node 20, pm2, firewall, optional nginx) so we have a public /health URL early.
Don't wait for features. Give me a copy-paste runbook and the live URL.
```
✅ **Done when:** a public Vultr URL serves `GET /health`. (Final deploy is #47 in Phase 4.)

> **Checkpoint 1 (hr 12):** each module demoable in isolation (curl/console). Contract live on Sepolia (#5). Voice clone produces a Hindi clip (#18). ✋ Don't start Phase 2 until H1 + H2 + H3 producers are green.

---
---

# PHASE 2 — Integration (hr 12–22) · WIRE THE SPINE

Goal: the 5-step Demo Spine runs end-to-end, ugly but working. These are **paired**
prompts — the **▶ Start when** tells C precisely which teammate must finish first.
**C drives the UI/orchestration; A and B hand over the endpoints.**

### ☐ C (with B) · #33 — Will-assistant chat wired to Gemini  *(Spine 1)*
🎯 **Issue:** #33   ▶ **Start when:** **B's #15 done**   🔓 **Unblocks:** vault gets filled on stage
```
Read CLAUDE.md. Wire the will-assistant page to /api/ai/will-assistant for issue
#33: messages send and replies render; when Gemini emits the [[VAULT]] JSON, show a
"Captured so far" panel that writes those fields into the vault. Pair with B if the
response shape changes.
```
✅ **Done when:** chat round-trips to Gemini; "Captured so far" appears on JSON extraction.

### ☐ C (with B) · #34 — Messages flow: record → clone → generate → play  *(Spine 2)*
🎯 **Issue:** #34   ▶ **Start when:** **B's #18 done (H2)**   🔓 **Unblocks:** #35 dashboard playback, #41 fallback
```
Wire the Messages page for issue #34: MediaRecorder captures a voice sample and
uploads it (-> B's clone), then writing a message + picking a language calls
/api/ai/messages and plays the returned cloned-voice audio in-page. Show a spinner
during generation (ties into #40).
```
✅ **Done when:** recording uploads; generating returns audio that plays in-page in the cloned voice.

### ☐ C (with A) · #26 — Trigger status endpoint (on-chain + DB)
🎯 **Issue:** #26   ▶ **Start when:** **A's #12 done (H1)**   🔓 **Unblocks:** #31 guardian UI, #35 dashboard polling
```
Verify /api/trigger/status/:userId for issue #26: it returns estateState, the
on-chain state (via A's ethers.getState), the confirmed-guardian count, and the
event log — in one object the frontend can poll. Pair with A on the ethers calls.
```
✅ **Done when:** status returns combined estate + on-chain state + count + event log; frontend can poll it.

### ☐ C (with A,B) · I1 — Trigger orchestration glue
🎯 **Issues:** drives #31/#32 gating   ▶ **Start when:** **A's #12 (H1) AND B's #19 (H3) done**   🔓 **Unblocks:** #31, #32, #35
```
Verify backend/src/routes/trigger.js orchestration: accept a death-cert image ->
gemini.verifyDeathCertificate (require valid) -> expose guardian-confirm ->
blockchain.confirmDeath -> on the Executed event, mark the user EXECUTING in Mongo,
log a TriggerEvent with txHash, and unlock the family-dashboard data. Return clear
status objects the frontend polls.
```
✅ **Done when:** cert-verify gates confirm; 2nd confirm → `Executed` → user flips EXECUTING with a logged txHash.

### ☐ C (with A) · #31 — Guardians "Confirm passing" flow → `/api/trigger/confirm`  *(Spine 4)*
🎯 **Issue:** #31   ▶ **Start when:** **I1 + #26 done**   🔓 **Unblocks:** #35 dashboard unlock
```
Wire the Guardians page for issue #31: a confirm action calls /api/trigger/confirm
with the guardian's key/wallet; the 2-of-3 progress bar advances per confirmation;
the second confirmation triggers execution. Pair with A on signer handling.
```
✅ **Done when:** confirm hits the endpoint; bar advances; 2nd confirm triggers execution.

### ☐ C (with B) · #32 — Death-certificate upload UI → `/api/trigger/verify`  *(Spine 4)*
🎯 **Issue:** #32   ▶ **Start when:** **B's #19 done (H3) + I1**   🔓 **Unblocks:** the confirm step gate
```
Build the cert-upload UI for issue #32 on a guardian-facing screen: upload an image,
show Gemini's verification result, and gate the confirm step on looksValid. Pair
with B on the verify response shape.
```
✅ **Done when:** upload shows Gemini's result; verification gates confirm.

### ☐ C · #35 — Family dashboard: poll status + play message + Etherscan tx  *(Spine 5)*
🎯 **Issue:** #35   ▶ **Start when:** **#18 (H2) + #5 (H1) + #26 all done**   🔓 **Unblocks:** the demo payoff screen
```
Finish the family dashboard for issue #35: when status is EXECUTING the dashboard
unlocks; it plays the deceased's cloned-voice Hindi message (#18) and links the
transfer tx to sepolia.etherscan.io (#5/#11). This is the screen judges stare at —
keep it calm and warm.
```
✅ **Done when:** EXECUTING unlocks the dashboard; message plays; tx links to Etherscan.

### ☐ C · #9 + #42 — Seed a polished demo account
🎯 **Issues:** #9, #42   ▶ **Start when:** #18 produces an audioUrl   🔓 **Unblocks:** never onboarding live on stage
```
Verify/extend backend/scripts/seed-demo.js for issues #9 and #42: idempotently
create demo@lastlogin.app / demo1234 with a filled vault, 3 guardians, one funded
beneficiary, and one pre-generated Hindi legacy message, so the family dashboard
demos without live onboarding. Make the data look real and complete.
```
✅ **Done when:** `npm run seed` builds a believable demo account; login shows vault/guardians/message.

> **Checkpoint 2 (hr 22):** all 5 spine steps run without touching code. ✋ **Record a backup screen capture of it working RIGHT NOW** — that's your safety net (feeds #45).

---
---

# PHASE 3 — The wow & hardening (hr 22–29)

Make the spine *move people*, then make it *unbreakable*. **Feature-freeze at hr 29.**

## A — Mois
### ☐ A · #14 — Anchor the vault integrity hash on-chain (tamper-proof badge)
🎯 **Issue:** #14   ▶ **Start when:** #5 + #25 done   🔓 **Unblocks:** a "nothing was tampered with" judge moment (C shows the badge)
```
Implement issue #14 end to end: an "Anchor integrity hash" action calls
setVaultHash on the contract, the hash reads back from the contract, and it's shown
on the family dashboard as a tamper-proof badge. Coordinate the badge with C.
```
✅ **Done when:** button anchors the hash; it reads back; C renders the badge.

### ☐ A · #13 — Surface lastSeen / daysInactive to the API
🎯 **Issue:** #13   ▶ **Start when:** #12 done   🔓 **Unblocks:** C's #37 inactivity banner
```
Implement issue #13: read lastSeen and daysInactive() from the contract and include
them in /api/trigger/status/:userId.
```
✅ **Done when:** status includes `lastSeen` + `daysInactive`.

## B — Mushtaq
### ☐ B · #41 — Pre-generate a guaranteed Hindi voice clip (fallback)  ⭐
🎯 **Issue:** #41   ▶ **Start when:** #18 works   🔓 **Unblocks:** stage insurance for the centerpiece
```
Implement issue #41: generate ONE perfect Hindi cloned-voice clip ahead of time and
set DEMO_AUDIO_URL so the seeded message uses it if ElevenLabs is slow/down on stage.
```
✅ **Done when:** a guaranteed clip exists and the seeded message falls back to `DEMO_AUDIO_URL`.

### ☐ B · #23 — Graceful AI fallbacks (never hard-crash)
🎯 **Issue:** #23   ▶ **Start when:** services exist   🔓 **Unblocks:** a demo that survives a dead API
```
Implement issue #23: when any AI key is missing or over quota, return clear friendly
errors and fall back to a pre-seeded clip / cached response where possible. The demo
must never hard-crash on an API error.
```
✅ **Done when:** missing/over-quota keys degrade gracefully with friendly messaging.

### ☐ B · #20 — Closure-email drafting · #21 — Obituary · #22 — More languages
🎯 **Issues:** #20, #21, #22   ▶ **Start when:** Gemini/Sarvam green   🔓 **Unblocks:** #20 → C's #38 account-executor view
```
Implement, one PR each:
- #20: POST /api/ai/draft-closure returns platform-specific text for Google, Meta,
  and a bank, mentioning the attached certificate.
- #21: POST /api/ai/obituary returns a warm ~120-word remembrance from profile
  notes — no clichés, reads with dignity.
- #22: the language dropdown options (Tamil/Telugu/Marathi) all produce translated,
  cloned-voice audio end to end.
```
✅ **Done when:** each endpoint returns quality output; #20 ready for C's #38.

## C — Avinash
### ☐ C · #36 — Candle goes "still" at the death trigger
🎯 **Issue:** #36   ▶ **Start when:** dashboard reads EXECUTING (#35)   🔓 **Unblocks:** the signature emotional beat
```
Implement/verify issue #36: on the family dashboard the candle flame animation stops
and dims at the death trigger (already coded — confirm it reads as intentional and
is reduced-motion safe).
```
✅ **Done when:** the flame visibly goes still at the trigger and reads as deliberate.

### ☐ C · #29 (backend) + #37 (frontend) — Proof-of-life
🎯 **Issues:** #29, #37   ▶ **Start when:** #37 needs #29 first; banner days from #13   🔓 **Unblocks:** the "I'm still here" story
```
Implement issue #29: POST /api/proof-of-life updates lastSeen; GET
/api/proof-of-life/status returns daysInactive; login also refreshes lastSeen.
Then issue #37: an "I'm still here" button calls proof-of-life and resets the timer,
and a banner shows days since last seen (use A's #13 daysInactive).
```
✅ **Done when:** button resets the timer; banner shows inactivity days.

### ☐ C · #38 — Account-executor view (accounts + drafted closure emails)
🎯 **Issue:** #38   ▶ **Start when:** **B's #20 done**   🔓 **Unblocks:** a second sponsor-tech showcase on the dashboard
```
Implement issue #38: the family dashboard lists accounts with status
(transfer/memorialize/delete) and shows the Gemini-drafted closure email per account
(B's #20 endpoint).
```
✅ **Done when:** accounts list with status + a drafted email each.

### ☐ C · #40 — Loading + error states on slow AI calls · #39 — Mobile responsiveness
🎯 **Issues:** #40, #39   ▶ **Start when:** spine pages exist   🔓 **Unblocks:** a demo that never "looks frozen"
```
Implement issue #40: spinners/skeletons while AI calls run, friendly error messages
on failure (the UI must never look frozen). Then issue #39: make the 3 spine screens
(will-assistant, messages, family dashboard) look right on a phone.
```
✅ **Done when:** no frozen-looking waits; the three spine screens are phone-clean.

### ☐ C · #27 — Time-capsule worker · #28 — GridFS audio  *(p2 — only if ahead)*
🎯 **Issues:** #27, #28   ▶ **Start when:** spine is solid and you have spare time   🔓 **Unblocks:** nicer perf / a bonus feature
```
If time allows: #28 store generated audio in GridFS and point audioUrl at a
streaming endpoint (shrinks payloads); #27 a scheduled job that marks date-based
messages (deliverOn:"date") delivered when their date arrives, alongside
death-triggered delivery.
```
✅ **Done when:** (optional) audio streams from GridFS; date-based messages deliver on schedule.

> **Checkpoint 3 (hr 29):** FEATURE FREEZE. No new features after this — bugs only.

---
---

# PHASE 4 — Submission & deploy (hr 29–34) · the part teams lose prizes over

### ☐ C · #47 — Final Vultr deploy · #48 — README · #44 — ethics one-liner
🎯 **Issues:** #47, #48, #44   ▶ **Start when:** feature freeze   🔓 **Unblocks:** the public demo URL + the judged writeup
```
#47: final Vultr deploy — confirm the public URL works on someone else's phone, and
point the frontend at it.
#48: update README with the live URL, the Sepolia contract address + Etherscan link,
an ASCII architecture diagram, setup steps, and a "Sponsor tech & why" paragraph each
(see Appendix S1).
#44: add a consent/ethics one-liner to the pitch — nothing activates while alive, you
opt in, a quorum is required.
```
✅ **Done when:** public URL works on a phone; README is complete; ethics line is in the pitch.

### ☐ A · #6 — Verify contract on Etherscan (if not already)
🎯 **Issue:** #6   ▶ **Start when:** now   🔓 **Unblocks:** judges can click and read the contract source.

### ☐ B · #45 — Record the 90-sec demo video
🎯 **Issue:** #45   ▶ **Start when:** spine is frozen & green   🔓 **Unblocks:** the submission + your safety net
```
Record the 90-second demo video for issue #45 — LEAD with the cloned-voice Hindi
message moment (first 10 seconds must land emotionally), then the live on-chain
trigger, then the family-dashboard payoff. Upload it and link it in the submission.
See Appendix S2 for the script.
```
✅ **Done when:** a clean full-flow video is recorded, uploaded, and linked.

### ☐ ALL · #46 — Submit on Devfolio
🎯 **Issue:** #46   ▶ **Start when:** README + video ready   🔓 **Unblocks:** actually winning
```
Together: write the Devfolio submission — problem, what you built, and one paragraph
per sponsor on WHY you used it (this is how MLH/sponsor prizes are judged). Add the
repo link and the video. Tick every track: Sarvam, Gemini, ElevenLabs, MongoDB,
Vultr, Ethereum, Blockchain&Web3, Open Innovation, GenAI&ML. SUBMIT AT HR 34, NOT 36
— portals crash at the buzzer.
```
✅ **Done when:** description + repo + video added; all tracks ticked; submitted early.

---
---

# PHASE 5 — Rehearsal & buffer (hr 34–36) · #43 (ALL)

🎯 **Issue:** #43   ▶ **Start when:** submitted   🔓 **Unblocks:** a calm, winning live run
- Run the live demo **3 times** start to finish; time it; cut anything that drags.
- Roles: 1 narrator, 2 drivers — don't all talk. (Suggested: **B narrates** the voice
  moment, **A drives** Etherscan, **C drives** the dashboard.)
- Pre-open every tab (dashboard, Etherscan, the backup video) before you walk up.
- Rehearse answers: "How is death verified?", "Isn't voice cloning dangerous?",
  "Why blockchain?", "What's the business model?"

✅ **Done when:** three clean timed runs; roles assigned; tabs pre-opened; Q&A rehearsed.

---
---

# Appendix A — original module reference prompts (regenerate-from-scratch)

Use these only to regenerate a whole file, or to understand *how a module was built*.
For normal work, prefer the sequenced prompts above + the golden prompt.

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

---

# Appendix B — "Am I blocked?" quick reference

| If you're about to start… | You're blocked until… |
|---|---|
| C #26 status / I1 trigger / #31 guardian UI | **A** finishes #5 + #12 (H1) |
| C #34 messages page / #35 dashboard playback | **B** finishes #18 (H2) |
| C #32 cert-upload UI / I1 gate | **B** finishes #19 (H3) |
| C #33 will-assistant page | **B** finishes #15 |
| C #38 account-executor view | **B** finishes #20 |
| C #37 inactivity banner | **C** finishes #29; **A** finishes #13 |
| A #5 deploy | **A** finishes #3 + #4 |
| B #18 centerpiece | **B** finishes #16 + #17 |
| C #24 auth / #25 vault | **C** finishes #2 (Mongo) |
| Anyone, anything | **All** finish #1 keys + #7 run-locally |

**One-line rule:** A unblocks the chain (#5→#12), B unblocks the heart (#18) and the
gate (#19), C wires them into the five spine screens. Ship H1 and H2 *early*.
