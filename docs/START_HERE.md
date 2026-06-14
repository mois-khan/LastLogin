# 🕯️ LastLogin - START HERE (read this first, all 3 of you)

> HackPrix Season 3 runs **Jun 13–14, 2026** (in-person, Kismatpur). You have a
> ~36-hour window, and part of day 1 is already gone. This document is the
> brutally honest game plan. Read the whole thing before writing code.

---

## 1. The single most important reality check

You asked to "win the maximum of the prizes." Here is the honest version of that
goal: **you do not win by building all 8 features. You win by building ONE
flawless golden-path demo that legitimately touches as many sponsor APIs as
possible, and by telling a story that makes a judge feel something.**

A 3-person team cannot ship Vault + Guardians + Trigger + Voice + Crypto +
Account-Executor + Will-Assistant + Family-Dashboard, fully, in 36 hours. Anyone
who tells you otherwise has not done a hackathon. If you try, you will demo a
broken half of everything. Instead you build a **thin vertical slice** that runs
end-to-end and looks complete.

---

## 2. Which prizes are actually winnable (and which to ignore)

| Prize | Reward | Verdict | Why |
|---|---|---|---|
| **Sarvam AI** | ₹15,000 | **PRIMARY TARGET** | Multilingual final message in a cloned voice is a genuinely strong, India-first use of Sarvam TTS. Biggest single sponsor cheque. |
| **Best Use of ElevenLabs** | Earbuds | **PRIMARY TARGET** | Voice cloning is your emotional centerpiece. Pairs perfectly with Sarvam. |
| **Best Use of Gemini API** | Google swag | **PRIMARY TARGET** | Will-assistant + death-certificate verification + account-executor drafting = 3 distinct, defensible Gemini uses. |
| **Best Use of MongoDB Atlas** | M5Stack kit | **WIN BY DEFAULT** | You're storing encrypted vault blobs there anyway. Just use it well and document it. |
| **Best Use of Vultr** | Screens | **WIN BY DEFAULT** | Deploy the backend on Vultr. One deploy = eligible. Do it early, not at hour 34. |
| **Best Use of GitHub** | (MLH) | **HIGH VALUE / LOW COST** | Pure process discipline. See GITHUB_STRATEGY.md. You can win this with good hygiene alone. |
| **Blockchain & Web3** | ₹5,000 | **STRONG** | On-chain guardian confirmations + auto crypto inheritance is one of the most *legitimate* uses of a smart contract in any hackathon. |
| **Open Innovation** | ₹5,000 | **STRONG** | Genuinely novel problem space. Easy narrative win. |
| **GenAI & ML** | ₹5,000 | **STRONG** | Same Gemini work qualifies you. |
| **Sustainable Development** | ₹5,000 | **PLAUSIBLE** | "Reduces family trauma / preserves legacy" is a softer fit. Frame it, don't bet on it. |
| **1st / 2nd / 3rd** | ₹50/30/20K | **REALISTIC TOP-3** | If the demo lands emotionally + technically, this is a top-3-overall project. Aim here. |
| **Cybersecurity** | ₹5,000 | **SKIP / OPPORTUNISTIC** | AES-256 + Shamir's-style key sharing is a *mention*, not a security product. Don't spend hours chasing it; reference it verbally. |
| **IoT & Embedded** | ₹5,000 | **SKIP** | You have no hardware. Don't force it. Forcing IoT will wreck your timeline. |
| **Best Lords Team / Best Girls Team** | ₹5,000 ea | **CHECK ELIGIBILITY** | These are team-composition awards, not effort-based. If your team qualifies, you're auto-considered; if not, ignore. |

**Realistic best case:** Top-3 overall + Sarvam + 2–3 MLH sponsor prizes + GitHub
+ 1–2 tracks. That is a *huge* haul and it's achievable. Chasing all 14 is how you win zero.

---

## 3. The Demo Spine (memorize this - everything serves it)

This is the only flow that has to work perfectly on stage. Build this first,
polish it last, and never break it.

1. **Onboard** - User chats with the Gemini will-assistant, which fills the vault
   (accounts, a crypto beneficiary, 2–3 guardians). *(Gemini)*
2. **Record legacy** - User records a 60-sec voice sample → ElevenLabs clones it.
   User writes a message "To my daughter" → it's spoken back in the **cloned
   voice, in Hindi** via Sarvam TTS. *(ElevenLabs + Sarvam - the tear-jerker)*
3. **Fund inheritance** - User locks 0.05 test-ETH in the LastLogin contract on
   Sepolia, names a beneficiary wallet. *(Ethereum/Web3)*
4. **The trigger (the live drama)** - Two guardians click "Confirm" + a death
   certificate is uploaded → Gemini Vision verifies it → the contract flips
   `ACTIVE → EXECUTING` **on Sepolia, live, on the projector**. *(Web3 + Gemini)*
5. **Family receives** - Family dashboard unlocks: plays the Hindi voice message,
   shows the crypto transfer confirmed (open Etherscan tx live), shows
   Gemini-drafted account-closure emails. *(MongoDB + dashboard + payoff)*

If you only finish steps 1, 2, 4, 5 and fake step 3 with a pre-recorded tx -
still demo it. A working narrative beats a complete-but-broken build.

---

## 4. Team split (3 people, clear ownership, minimal merge conflicts)

| Dev | Owns | Prizes they're chasing |
|---|---|---|
| **Dev A - Chain & Crypto** | `contracts/`, ethers integration, Sepolia deploy, trigger logic | Blockchain & Web3, Ethereum |
| **Dev B - AI & Voice** | `backend/src/services/ai/*`, voice clone, multilingual TTS, doc verification | Sarvam, ElevenLabs, Gemini, GenAI |
| **Dev C - Product & Platform** | `frontend/`, `backend` API+auth+vault, MongoDB, Vultr deploy, demo polish | MongoDB, Vultr, Open Innovation, overall UX |

Each person owns separate folders → fewer conflicts. Integration happens at
fixed checkpoints (see DEVELOPMENT_ROADMAP.md).

---

## 5. Naming - fix this now

Your overview doc uses three names: **LastLogin** (title), **LastJourney**, and
**Last Journey** (body). Pick one and purge the others before you submit, or it
reads as careless. Recommendation: **LastLogin** - "your last login" is a sharp,
memorable double meaning. Everything I've scaffolded uses `lastlogin`.

---

## 6. What you're missing / what I'd add (you asked)

- **A 90-second demo video + a "Devfolio-ready" pitch.** Judging is often the
  video + the live demo, not your code. Budget 2 hours for this. It's not
  optional - many sponsor prizes are judged partly on the submission page.
- **A throwaway testnet wallet.** Never put a real private key in `.env`. Make a
  fresh MetaMask account, fund it from a Sepolia faucet. (Don't touch the $100
  mainnet ETH prize during the build - that's a payout, not your gas budget.)
- **ElevenLabs free tier may block API access.** Free gives ~10k chars + 3 voice
  clones but several reports say **no API access** on free. Budget **$5 for the
  Starter plan** so your backend can actually call it. Cheapest insurance you'll buy.
- **Consent / ethics slide.** A "verified death + 2-of-3 guardian consent + you
  opt in while alive" slide pre-empts the obvious judge question ("isn't cloning a
  dead person's voice creepy/dangerous?"). Answer it before they ask.
- **A seeded demo account.** Don't onboard from scratch on stage. Have a
  pre-filled account ready AND show a 20-sec live onboard. Demo gods are cruel.
- **Fallbacks for every live API.** Wifi dies, rate limits hit. Pre-generate the
  Hindi voice clip and the Etherscan tx the night before as backups.
- **Submit on Devfolio 1 hour early.** Submission portals crash at the deadline.

---

## 7. The codebase is already built - start from it, don't scaffold

`lastlogin-project.tar.gz` is a **complete, runnable starter** (not stubs). It's
verified: the contract compiles + passes tests, the frontend builds clean, the
backend installs and its encryption round-trips. Extract it, open it in Claude
Code, and read `CLAUDE.md` first - Claude Code reads it automatically and it
encodes the demo spine, the design system, what's built, and the TODO list.

```bash
tar -xzf lastlogin-project.tar.gz && cd lastlogin
# follow CLAUDE.md → fill backend/.env → run backend, frontend, contracts
```

What's already implemented: the smart contract (2-of-3 guardians, beneficiary
split, proof-of-life, vault-hash anchor, tested); the full backend (auth, vault
with AES-256-GCM + on-chain integrity fingerprint, guardians, proof-of-life, all
AI routes, trigger orchestration, demo seed); and the frontend (landing, will-
assistant chat, vault, guardians, messages with record→clone→generate, public
family dashboard) in the candlelight design system. You're extending, not starting.

## 8. New "wow" features I baked in (beyond your original 8)

- **On-chain vault integrity hash** - the family can *cryptographically prove*
  nothing was altered after death. Strong, cheap Web3 narrative. (`setVaultHash`)
- **Proof-of-life dead-man's switch** - periodic "I'm still here" that resets an
  on-chain `lastSeen`; inactivity becomes a real, demoable soft signal. (`proveLife`)
- **The candle signature** - a flame that flickers while you're alive and goes
  *still* the instant the trigger fires. One quiet, unforgettable visual beat.
- **AI digital obituary** - Gemini writes a warm remembrance for the dashboard.
- **Time-capsule messages** - deliver a message on a future date ("her wedding
  day"), not only at death. (`deliverOn:"date"` - wiring is the first TODO.)

## 9. Claude Code workflow (you have Max - use it like a team of 9)

- Run **3 Claude Code sessions in parallel**, one per dev, each scoped to its
  folder (Dev A → `contracts/`, Dev B → `backend/src/services/ai/`, Dev C →
  `frontend/` + `backend` core). `CLAUDE.md` keeps them aligned.
- Point each session at the matching TODO in `CLAUDE.md` and the prompts in
  `BUILD_PROMPTS.md`. Tell it to make one reviewed PR per unit of work.
- Keep the contract tests green (`npx hardhat test`) - make that a rule in the session.
- Let Claude Code write commits + PR descriptions (prompts in `GITHUB_STRATEGY.md`)
  so your GitHub history stays prize-worthy without manual effort.

## 10. File map

- `lastlogin-project.tar.gz` - **the complete project** (extract & build).
- `CLAUDE.md` (also inside the tarball) - Claude Code's context + rules + TODO.
- `PROJECT_STRUCTURE.md` - granular file-by-file breakdown of what's built.
- `DEVELOPMENT_ROADMAP.md` - hour-by-hour plan with checkpoints.
- `BUILD_PROMPTS.md` - copy-paste prompts for Claude Code, mapped to the TODO.
- `GITHUB_STRATEGY.md` - win Best Use of GitHub + per-dev git/PR prompts.
- `API_KEYS_GUIDE.md` - every key: where, free tier, why, how to test.
- `setup_lastlogin.sh` - *superseded* by the tarball; keep only if you want to
  regenerate an empty scaffold from scratch.

Order: this file → API_KEYS_GUIDE (get keys now) → extract tarball → CLAUDE.md → DEVELOPMENT_ROADMAP.
