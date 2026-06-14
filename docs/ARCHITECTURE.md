# LastLogin - Architecture

```
                ┌───────────────────────────────────────────────┐
                │                FRONTEND (React/Vite)            │
                │  Login · Will-Assistant · Vault · Guardians     │
                │  Messages · Family Dashboard (public)           │
                └───────────────┬─────────────────────────────────┘
                                │ REST /api  (JWT)   + ethers (browser wallet)
                ┌───────────────▼─────────────────────────────────┐
                │              BACKEND (Express, ESM)              │
                │ routes: auth vault guardians proof-of-life ai    │
                │         trigger                                  │
                │ services/ai:  gemini · elevenlabs · sarvam ·     │
                │               legacyMessage                      │
                │ services/crypto: AES-256-GCM vault + fingerprint │
                │ services/blockchain: ethers → Sepolia            │
                └───────┬───────────────────────────┬─────────────┘
                        │                           │
              ┌─────────▼────────┐        ┌─────────▼──────────────┐
              │  MongoDB Atlas   │        │  Sepolia (Ethereum)    │
              │ users, vault     │        │  LastLogin.sol         │
              │ guardians, msgs  │        │  guardians + escrow    │
              │ trigger events   │        │  vaultHash + lastSeen  │
              └──────────────────┘        └────────────────────────┘
```

## The legacy-message pipeline (the centerpiece)
```
English text
  → Sarvam (Mayura) translate → Hindi/Tamil/Telugu/Marathi   [India-first intelligence]
  → ElevenLabs (multilingual_v2, cloned voice) speak          [the person's own voice]
  → stored on the Message, played on the Family Dashboard
```

## The death-trigger state machine
```
                 guardian uploads death cert
                          │  Gemini Vision verify (gate)
                          ▼
   ACTIVE ──(2-of-3 guardians call confirmDeath on-chain)──▶ EXECUTING
                          │                                      │
                          │                          contract auto-splits ETH
                          │                          to beneficiaries (events)
                          ▼                                      ▼
              backend listens for Executed ──▶ unlock Family Dashboard,
                                                mark messages delivered
```

## Why blockchain (the defensible answer)
Inheritance is the rare case where trustlessness is the point: no bank or court can
freeze or delay the transfer, no relative can contest code, it works across borders,
and the guardian-confirmation ledger is immutable and timestamped. The vault integrity
hash lets the family cryptographically prove the contents were never altered after death.

## Trust & consent model
Nothing executes while the owner is alive. The owner opts in, proves life periodically
(dead-man's switch), and only a quorum (2 of 3) of people they personally chose can ever
trigger execution - mirroring how legal witnesses work.
