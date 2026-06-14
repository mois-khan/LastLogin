# 🕯️ LastLogin

**Your digital life, handled - so your family doesn't have to.**

A proactive digital-estate manager that activates only after a verified death.
It passes on your accounts, your crypto, and your final words - gently, on-chain,
and in your own voice. Built for HackPrix Season 3.

## Why it matters
The average person has 150+ online accounts, crypto with real money, and irreplaceable
memories - and almost no plan for any of it. Families spend months fighting platforms,
lose crypto forever, and never get a goodbye. LastLogin fixes that end-to-end.

## What it does
- **Vault** - accounts, crypto keys, documents, encrypted client-side (AES-256-GCM),
  with a tamper-proof integrity hash anchored on Ethereum.
- **Guardians** - 2-of-3 trusted people must jointly confirm a death; no one acts alone.
- **Death trigger** - guardian confirmations + a Gemini-Vision–verified certificate flip
  an on-chain state machine from `ACTIVE → EXECUTING`.
- **Crypto inheritance** - the smart contract auto-splits escrowed funds to beneficiaries.
- **Final messages** - recorded once, delivered in the user's **cloned voice**
  (ElevenLabs) and their family's **language** (Sarvam) after death.
- **AI guide** - Gemini walks you through the whole setup as a conversation, and drafts
  account-closure requests for the family.

## Stack
React + Vite + Tailwind · Node + Express + MongoDB Atlas · Solidity + Hardhat (Sepolia) ·
Gemini · ElevenLabs · Sarvam AI · deployed on Vultr.

## Run it
See `CLAUDE.md` for full commands. Short version:
```bash
cp .env.example backend/.env          # fill keys (see docs/API_KEYS_GUIDE.md)
cd backend  && npm i && npm run dev    # :4000
cd frontend && npm i && npm run dev    # :5173
cd contracts && npm i && npx hardhat test && npx hardhat run scripts/deploy.js --network sepolia
```

## Architecture
See `docs/ARCHITECTURE.md`. Smart contract: `contracts/contracts/LastLogin.sol`
(deployed at `CONTRACT_ADDRESS`, verified on Sepolia Etherscan).

## Team
3 builders - see `docs/` for roadmap, build prompts, GitHub workflow, and API setup.

_Built with consent at its core: nothing activates while you're alive, and only a
quorum of people you chose can ever change that._
