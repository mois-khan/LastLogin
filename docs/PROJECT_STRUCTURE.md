# LastLogin - Project Structure (as built)

This reflects the actual files shipped in `lastlogin-project.tar.gz`. Status:
✅ built & verified · 🔌 wired to extend · ⬜ TODO (see CLAUDE.md).
Owners: A = Chain, B = AI/Voice, C = Product/Platform.

```
lastlogin/
├── CLAUDE.md                         ✅ Claude Code context: spine, design, rules, TODO
├── README.md                         ✅ pitch + run instructions
├── .env.example / .gitignore         ✅
├── .github/workflows/ci.yml          ✅ [C] CI: builds frontend + compiles contracts
├── docs/ARCHITECTURE.md              ✅ diagrams + state machine + trust model
│
├── contracts/                        ========== [A] BLOCKCHAIN ==========
│   ├── contracts/LastLogin.sol       ✅ 2-of-3 guardians, beneficiary split,
│   │                                    proveLife(), setVaultHash() - COMPILES CLEAN
│   ├── test/LastLogin.test.js        ✅ 4 passing tests (proof-of-life, hash, payout, guards)
│   ├── scripts/deploy.js             ✅ Sepolia deploy (fill addresses)
│   ├── hardhat.config.js             ✅ optimizer on, etherscan verify ready
│   └── package.json                  ✅
│
├── backend/                          ========== [C core + B services] ==========
│   ├── package.json / .env.example   ✅ installs clean
│   └── src/
│       ├── server.js                 ✅ mounts all routes, degrades gracefully if Atlas down
│       ├── config/db.js              ✅ [C] mongoose connect
│       ├── middleware/
│       │   ├── auth.js               ✅ JWT guard
│       │   └── error.js              ✅ central handler
│       ├── models/
│       │   ├── User.js               ✅ voiceId, lastSeen (proof-of-life), estateState
│       │   ├── VaultItem.js          ✅ AES-256-GCM blob {iv,tag,data}
│       │   ├── Guardian.js           ✅ wallet + confirmation status
│       │   ├── Message.js            ✅ recipient, lang, audioUrl, deliverOn (death|date)
│       │   └── TriggerEvent.js       ✅ audit log mirroring on-chain events
│       ├── services/
│       │   ├── crypto/vault.js       ✅ encrypt/decrypt + vaultFingerprint() - TESTED
│       │   ├── ai/gemini.js          ✅ [B] will-assistant + Vision cert-verify +
│       │   │                            closure draft + obituary
│       │   ├── ai/elevenlabs.js      ✅ [B] cloneVoice() + speak()
│       │   ├── ai/sarvam.js          ✅ [B] translate() (Mayura) + tts() (Bulbul)
│       │   ├── ai/legacyMessage.js   ✅ [B] Sarvam translate → ElevenLabs cloned voice
│       │   ├── blockchain/ethers.js  ✅ [A] getState/confirmDeath/onExecuted/anchorVaultHash
│       │   └── notify/email.js       ✅ [C] mock-safe; Resend optional
│       ├── routes/
│       │   ├── auth.js               ✅ register/login (JWT, bcrypt)
│       │   ├── vault.js              ✅ CRUD + /fingerprint + /:id/reveal
│       │   ├── guardians.js          ✅ add + status (2-of-3 progress)
│       │   ├── proofOfLife.js        ✅ "I'm here" + inactivity status
│       │   ├── ai.js                 ✅ will-assistant, voice/clone, messages,
│       │   │                            verify-certificate, draft-closure, obituary
│       │   └── trigger.js            🔌 verify → confirm → family-unlock orchestration
│       └── scripts/seed-demo.js      ✅ demo@lastlogin.app / demo1234 pre-filled account
│
└── frontend/                         ========== [C] PRODUCT (candlelight UI) ==========
    ├── index.html                    ✅ Fraunces + Inter + IBM Plex Mono
    ├── vite/tailwind/postcss configs ✅ design tokens: paper/ink/ember/sage/mist/line
    └── src/
        ├── main.jsx / App.jsx        ✅ router (public family route + protected app shell)
        ├── index.css                 ✅ .card .btn .field .pill + candle flicker keyframes
        ├── lib/api.js                ✅ axios + JWT interceptor
        ├── context/AuthContext.jsx   ✅ login/register + proof-of-life ping
        ├── components/ui/Candle.jsx   ✅ the signature flame (flickers → still on death)
        ├── components/layout/Shell.jsx✅ nav
        └── pages/
            ├── auth/Login.jsx         ✅ landing hero + auth
            ├── will-assistant/        ✅ Gemini chat onboarding (★ spine 1)
            ├── vault/Vault.jsx        ✅ items + anchor integrity hash
            ├── guardians/Guardians.jsx✅ add + 2-of-3 progress (🔌 wire on-chain confirm)
            ├── messages/Messages.jsx  ✅ record→clone→generate cloned-voice clip (★ spine 2)
            └── family-dashboard/      ✅ public payoff: message player + Etherscan tx (★ spine 5)
```

## Build vs. extend (given the spine)
**Done & demoable:** will-assistant, voice clone → Hindi cloned-voice message, vault +
on-chain fingerprint, guardians UI, contract + tests, family dashboard, demo seed.

**First things to wire (TODO in CLAUDE.md):** guardian on-chain confirm button →
`/api/trigger/confirm`; death-cert upload screen → `/api/trigger/verify`; show
Gemini-drafted closure emails on the dashboard; schedule time-capsule messages;
move audio from base64 to GridFS/S3.

**Skip unless time remains:** languages beyond Hindi+English, mobile polish,
password reset, real email sending to platforms.
