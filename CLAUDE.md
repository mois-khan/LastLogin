# CLAUDE.md — context for Claude Code

> Read this fully before doing anything. It defines how we work on LastLogin.

## What this is
**LastLogin** — a proactive digital-estate manager for HackPrix Season 3
(Jun 13–14, 2026). It activates only after a verified death: secure vault,
2-of-3 guardian death trigger, on-chain crypto inheritance, an AI will-assistant,
and final messages delivered in the user's own cloned voice in their family's
language. Team of 3. Goal: a flawless live demo that wins multiple sponsor prizes.

## The Demo Spine — protect this above all else
Every change must keep this 5-step flow working end-to-end:
1. **Gemini** will-assistant chat fills the vault.
2. **ElevenLabs** clones the user's voice; **Sarvam** translates a message to Hindi;
   it's spoken back in the cloned voice. ← the emotional centerpiece.
3. User funds the **Sepolia** contract and names a beneficiary.
4. 2 guardians confirm + a death cert is **Gemini-Vision** verified → contract flips
   `ACTIVE → EXECUTING` live on Etherscan.
5. **Family dashboard** unlocks: plays the message, shows the on-chain transfer.

If asked to add something that risks the spine, say so and propose a safer path.

## Stack & layout
- `frontend/` React 18 + Vite + Tailwind (design tokens below). Router in `App.jsx`.
- `backend/` Node + Express (ESM, `type:module`) + Mongoose. Routes in `src/routes/*`,
  controllers inlined. AI integrations in `src/services/ai/*`, chain in
  `src/services/blockchain/ethers.js`, encryption in `src/services/crypto/vault.js`.
- `contracts/` Solidity 0.8.24 + Hardhat. `LastLogin.sol` is the state machine.

## Design system (do not drift from this — it's the brand)
Context is grief/legacy: calm, warm, reverent. **No alarm reds.**
- Colors (Tailwind): `paper #FBF7F0`, `ink #2B2A28`, `ember #C8743A` (accent, sparing),
  `sage #6E8B74` (alive/verified), `mist #9A938A`, `line #E7E0D4`.
- Type: `font-display` Fraunces (headings), `font-body` Inter, `font-mono` IBM Plex Mono (hashes/data).
- Signature: the candle (`components/ui/Candle.jsx`) flickers while ACTIVE, goes
  `still` at the death trigger. Keep that meaning intact.
- Components use the `.card .btn-ember .btn-ghost .field .label .pill` classes in `index.css`.

## Commands
```bash
# backend
cd backend && npm i && cp ../.env.example .env   # fill keys, then:
npm run dev            # :4000
npm run seed           # seed demo@lastlogin.app / demo1234
# frontend
cd frontend && npm i && npm run dev   # :5173 (proxies /api -> :4000)
# contracts
cd contracts && npm i && npx hardhat test
npx hardhat run scripts/deploy.js --network sepolia
```

## What's already built (don't rebuild — extend)
- Contract: guardians 2-of-3, beneficiary split, `proveLife()`, `setVaultHash()`. Tested.
- Backend: auth, vault (AES-256-GCM + on-chain fingerprint), guardians, proof-of-life,
  AI routes (will-assistant, voice clone, legacy message, cert verify, closure draft,
  obituary), trigger orchestration, demo seed.
- Frontend: auth/landing, will-assistant chat, vault, guardians, messages (record→clone→
  generate), public family dashboard.

## Status / TODO (pick up here)
- [ ] Wire the on-chain confirm flow into the Guardians UI (call `/api/trigger/confirm`).
- [ ] Death-cert upload UI + `/api/trigger/verify` on a guardian-facing screen.
- [ ] Persist generated audio to GridFS/S3 instead of base64 data URLs (perf).
- [ ] Account-executor: list accounts → show Gemini-drafted closure emails in the dashboard.
- [ ] Time-capsule messages (`deliverOn:"date"`) scheduled delivery worker.
- [ ] Proof-of-life on-chain (`proveLife()`) button + inactivity banner.
- [ ] Polish family dashboard motion (reduced-motion safe).

## Rules for working here
- ESM everywhere in JS. Keep controllers inline in routes (hackathon speed).
- Never commit `.env` or keys. Never put a real wallet key anywhere — Sepolia throwaway only.
- Keep responses to the brand voice: plain, warm, active voice, sentence case.
- Prefer small, reviewed PRs (see docs/GITHUB_STRATEGY.md) — we're also chasing the GitHub prize.
- When you finish a unit of work, write a conventional commit and stop; don't sprawl.
- Before changing the contract, run `npx hardhat test` and keep all tests green.

## Sponsor-prize map (why each tech is here — keep these defensible)
Gemini = will-assistant + cert vision + email drafting + obituary. ElevenLabs = the
person's own voice. Sarvam = India-first translation/TTS for the family's language.
MongoDB = encrypted vault + messages. Vultr = backend host. Ethereum = trustless,
uncontestable inheritance + immutable guardian ledger. GitHub = collaboration trail.
