# LastLogin — Development Roadmap (36h, 3 devs)

Hours are **relative to your build start**, not clock time. Adjust to your
actual start. Sleep is in the plan on purpose — sleep-deprived demos lose.

**Legend:** A = Dev A (Chain), B = Dev B (AI/Voice), C = Dev C (Product/Platform)

> **You're not starting from zero.** `lastlogin-project.tar.gz` already contains a
> verified, runnable build (contract tested, frontend builds, backend installs).
> So Phase 1 is mostly *getting it running with your keys + wiring the TODO list in
> CLAUDE.md*, not building from scratch. With Claude Code Max, run 3 parallel
> sessions (one per dev/folder) against the TODO + BUILD_PROMPTS. That buys you
> hours — spend them on Phase 3 (the wow) and Phase 5 (rehearsal), where prizes are won.

---

## PHASE 0 — Setup & Accounts (Hours 0–2) · ALL THREE TOGETHER
Goal: every key works, repo is live, ownership is clear. Do not skip; broken
keys at hour 20 kill teams.

- [ ] **All:** read `START_HERE.md`. Agree on the Demo Spine out loud.
- [ ] **All:** create accounts & keys per `API_KEYS_GUIDE.md` (Gemini, MongoDB
      Atlas, Sarvam, ElevenLabs Starter $5, Alchemy/Sepolia, Vultr, GitHub repo).
- [ ] **C:** run `./setup_lastlogin.sh`, push to GitHub, add A & B as collaborators,
      enable branch protection on `main` (see GITHUB_STRATEGY.md).
- [ ] **A:** make a throwaway MetaMask wallet, get Sepolia ETH from a faucet.
- [ ] **B:** record the 60-sec voice sample NOW (you'll need it all day), test
      Gemini + ElevenLabs + Sarvam with a one-line curl each.
- [ ] **C:** verify Mongo connection string with a one-doc insert.

**Checkpoint 0 (hr 2):** everyone has pushed at least one commit. All keys return 200.

---

## PHASE 1 — Parallel Core Build (Hours 2–12) · ISOLATED, MOCKED
Each dev builds their piece behind a clean interface, using fake data for the
others. No integration yet.

**A — Chain:**
- [ ] Finish `LastLogin.sol` (it's stubbed): guardians, 2-of-3, beneficiary payout.
- [ ] Write 2 Hardhat tests (deploy, confirm→execute pays beneficiary). *(judges love tests)*
- [ ] Deploy to Sepolia. Record `CONTRACT_ADDRESS`. Verify on Etherscan.
- [ ] `services/blockchain/ethers.js`: `getState()`, `confirmDeath(signer)`, event listener.

**B — AI/Voice:**
- [ ] `gemini.js`: `chatWillAssistant(history)` returns next question + extracted vault fields.
- [ ] `elevenlabs.js`: `cloneVoice(sampleFile)` → voiceId; `speak(voiceId, text)` → audio.
- [ ] `sarvam.js`: `tts(text, lang)` via Bulbul; `translate(text, target)`.
- [ ] The money shot: pipeline `English text → Sarvam translate to Hindi → speak in cloned voice`.

**C — Product/Platform:**
- [ ] Mongoose models + `auth` (register/login/JWT) + `vault` CRUD (encrypted).
- [ ] Frontend shell + routing + auth pages + Tailwind theme (warm, calm).
- [ ] Deploy the bare backend to **Vultr** now (don't wait — eligibility + smoke test).

**Checkpoint 1 (hr 12):** each module demoable in isolation via curl/console.
Contract is live on Sepolia. Voice clone produces a Hindi clip. Sleep rotation
can start — never all three asleep, never all three awake past hr 20.

---

## PHASE 2 — Integration (Hours 12–22) · WIRE THE SPINE
Goal: the 5-step Demo Spine runs end-to-end, ugly but working.

- [ ] **C+B:** Will-assistant page → calls `gemini.js` → writes to vault. *(spine 1)*
- [ ] **C+B:** Messages page → record → clone → write → Hindi playback stored in Mongo. *(spine 2)*
- [ ] **C+A:** Vault crypto step → fund contract from browser wallet. *(spine 3)*
- [ ] **A+C:** Guardian confirm UI → calls `confirmDeath` → backend listens for
      `Executed` event → flips app state. *(spine 4)*
- [ ] **B+A:** death-cert upload → `gemini.js` Vision verify → gate the trigger. *(spine 4)*
- [ ] **C:** Family dashboard reads everything: plays message, shows Etherscan tx,
      shows Gemini-drafted closure emails. *(spine 5)*

**Checkpoint 2 (hr 22):** you can run all 5 steps without touching code. Record a
backup screen capture of it working RIGHT NOW. This is your safety net.

---

## PHASE 3 — The Wow & Hardening (Hours 22–29)
- [ ] **B:** Make the voice message genuinely move people — good script, clean audio.
- [ ] **A:** Add a second beneficiary + percentage split (shows real smart-contract logic).
- [ ] **C:** Polish the family dashboard (this is the screen judges stare at). Grief-
      appropriate: warm tones, no red alerts, gentle copy.
- [ ] **All:** add fallbacks — pre-generated Hindi clip + a known-good Sepolia tx
      link, in case live APIs fail on stage.
- [ ] **C:** seed a pre-filled demo account so you don't onboard from zero live.

**Checkpoint 3 (hr 29):** feature-frozen. No new features after this. Bugs only.

---

## PHASE 4 — Submission & Deploy (Hours 29–34)
The part teams forget and lose prizes over.

- [ ] **C:** final Vultr deploy; confirm public URL works on someone else's phone.
- [ ] **A:** Verify contract source on Etherscan (judges can click and read it).
- [ ] **B:** record the **90-sec demo video** — lead with the Hindi voice moment.
- [ ] **All:** write the Devfolio submission: problem, what you built, each sponsor
      tech used + *why* (one paragraph per sponsor — this is how MLH prizes are judged).
- [ ] **C:** README with architecture diagram, setup steps, screenshots, live link.
- [ ] **Submit on Devfolio at hr 34, NOT hr 36.** Portals crash at the buzzer.

---

## PHASE 5 — Rehearsal & Buffer (Hours 34–36)
- [ ] Run the live demo 3 times start to finish. Time it. Cut anything that drags.
- [ ] Decide who speaks: 1 narrator, 2 drivers. Don't all talk.
- [ ] Pre-open every tab you'll need (dashboard, Etherscan, video) before you walk up.
- [ ] Prepare answers: "How is death verified?" "Isn't voice cloning dangerous?"
      "Why blockchain?" "What's the business model?"

---

## Per-sponsor "why we used it" — write these into the submission
(MLH/sponsor prizes are won by *articulating* the use, not just using it.)

- **Sarvam:** delivering a dying person's final words in their family's mother
  tongue (Hindi/Tamil/Telugu/Marathi) — India-first by definition.
- **ElevenLabs:** the message is in the deceased's *own* cloned voice — the
  emotional core no other tech delivers.
- **Gemini:** three roles — conversational will-setup, Vision-based death-cert
  verification, and auto-drafting platform closure requests.
- **MongoDB:** encrypted vault blobs + account catalog + message store.
- **Vultr:** the entire backend + contract-listener runs here.
- **Ethereum:** trustless, borderless, uncontestable crypto inheritance with an
  immutable guardian-confirmation ledger — a use case blockchain is *actually* better at.
- **GitHub:** see GITHUB_STRATEGY.md.

---

## Risk register (pre-mortem)
| Risk | Mitigation |
|---|---|
| ElevenLabs free tier blocks API | Buy Starter ($5) in Phase 0 |
| Sepolia faucet dry / slow | Get ETH in Phase 0 from 2 faucets; keep tx small |
| Live API fails on stage | Pre-recorded fallbacks made in Phase 3 |
| Merge hell | Folder ownership + PRs + checkpoints (GITHUB_STRATEGY.md) |
| Over-scoping | Feature freeze at hr 29 is non-negotiable |
| Onboarding live takes too long | Seeded demo account + 20-sec live snippet only |
