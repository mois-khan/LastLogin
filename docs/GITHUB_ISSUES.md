# LastLogin — GitHub Issues (ready to auto-create)

> **Claude Code: how to use this file.**
> Create every issue listed below in this repo using the GitHub CLI (`gh`).
> Steps:
> 1. Check `gh auth status`. If not authenticated, tell the user to run `gh auth login` and stop.
> 2. First create the labels in the **Labels** section (skip any that already exist):
>    `gh label create "<name>" --color <hex> --description "<desc>"`
> 3. Then create each issue below. Everything under a `### N. Title` heading is one issue.
>    The `Labels:` line lists its labels; everything after `Body:` is the issue body (keep the checkboxes).
>    Use: `gh issue create --title "<title>" --body "<body>" --label "<l1>" --label "<l2>"`
> 4. If a Project board named "LastLogin" exists, add each created issue to it
>    (`gh project item-add`), otherwise skip silently.
> 5. Print a short summary: how many labels and issues were created.
> Do not ask for confirmation between issues — create them all.

---

## Labels (create these first)

- `area:chain` — color `5319E7` — Smart contract & blockchain
- `area:backend` — color `1D76DB` — Express API & data
- `area:ai` — color `0E8A16` — Gemini / ElevenLabs / Sarvam
- `area:frontend` — color `FBCA04` — React UI
- `area:devops` — color `5DADE2` — deploy, CI, infra
- `type:setup` — color `C2E0C6` — environment & keys
- `type:wire` — color `D4C5F9` — connect existing pieces together
- `type:wow` — color `E99695` — judge-impressing features
- `type:demo` — color `F9D0C4` — demo & submission
- `priority:p0` — color `B60205` — spine-critical, must work
- `priority:p1` — color `D93F0B` — important
- `priority:p2` — color `FEF2C0` — nice to have

---

## SETUP & DEVOPS

### 1. Get all API keys and fill backend/.env
Labels: type:setup, priority:p0
Body:
Collect every key the app needs and put them in `backend/.env` (copy from `.env.example`). See `docs/API_KEYS_GUIDE.md`.
- [ ] GEMINI_API_KEY (free, aistudio.google.com)
- [ ] ELEVENLABS_API_KEY ($5 Starter plan — free tier blocks API cloning)
- [ ] SARVAM_API_KEY (₹100 free credits, dashboard.sarvam.ai)
- [ ] MONGODB_URI, JWT_SECRET, VAULT_MASTER_KEY set
- [ ] `npm run dev` starts and `GET /health` returns `{ ok: true }`

### 2. Create MongoDB Atlas free cluster
Labels: area:backend, type:setup, priority:p0
Body:
Stand up a free M0 cluster and connect the backend.
- [ ] M0 cluster created
- [ ] Network access allows 0.0.0.0/0 (demo only)
- [ ] Connection string in `MONGODB_URI`
- [ ] Backend logs "Mongo connected"

### 3. Create throwaway Sepolia wallet + fund from faucet
Labels: area:chain, type:setup, priority:p0
Body:
Make a brand-new wallet used ONLY for testnet. Never reuse a real one.
- [ ] New wallet/account created
- [ ] ~0.1 Sepolia test ETH received from a faucet
- [ ] Private key placed in `DEPLOYER_PRIVATE_KEY`

### 4. Set up Sepolia RPC URL (Alchemy or Infura)
Labels: area:chain, type:setup, priority:p0
Body:
Get an RPC endpoint so the app can talk to Sepolia.
- [ ] App created on Alchemy/Infura
- [ ] HTTPS Sepolia URL in `SEPOLIA_RPC_URL`
- [ ] A quick `getBlockNumber()` call succeeds

### 5. Deploy LastLogin.sol to Sepolia
Labels: area:chain, type:setup, priority:p0
Body:
Deploy the contract and record its address. Edit guardian/beneficiary addresses in `scripts/deploy.js` first.
- [ ] `npx hardhat run scripts/deploy.js --network sepolia` succeeds
- [ ] `CONTRACT_ADDRESS` set in `.env`
- [ ] Contract visible on sepolia.etherscan.io

### 6. Verify the contract on Etherscan
Labels: area:chain, type:setup, priority:p1
Body:
Verified source looks great to judges.
- [ ] `ETHERSCAN_API_KEY` set
- [ ] `npx hardhat verify --network sepolia <address> ...args` succeeds
- [ ] Source readable on Etherscan

### 7. Install + run everything on each teammate's machine
Labels: type:setup, priority:p0
Body:
Make sure all 3 devs can run the project locally.
- [ ] `cd backend && npm i && npm run dev` works
- [ ] `cd frontend && npm i && npm run dev` works (opens :5173)
- [ ] `cd contracts && npm i && npx hardhat test` passes

### 8. Confirm GitHub Actions CI passes on first push
Labels: area:devops, priority:p1
Body:
The included workflow builds the frontend and compiles the contract.
- [ ] CI is green on `main`
- [ ] Fix any path/node-version issues if red

### 9. Run the demo seed script
Labels: area:backend, type:setup, priority:p1
Body:
Seed a ready-made account so you never onboard live on stage.
- [ ] `npm run seed` creates demo@lastlogin.app / demo1234
- [ ] Login works and vault/guardians/message show up

---

## SMART CONTRACT (Dev A)

### 10. Confirm all contract tests pass
Labels: area:chain, priority:p0
Body:
- [ ] `npx hardhat test` shows 4/4 passing
- [ ] Understand each test (proof-of-life, vault hash, 2-of-3 payout, guard rejections)

### 11. Fund the deployed contract with test ETH for the demo
Labels: area:chain, priority:p1
Body:
Beneficiaries can only be paid if the contract holds funds.
- [ ] Send ~0.02 test ETH to the contract (via `fund()` or `receive`)
- [ ] Balance visible on Etherscan

### 12. Backend confirmDeath submits a real on-chain tx
Labels: area:chain, type:wire, priority:p0
Body:
Wire `services/blockchain/ethers.js#confirmDeath` so a guardian confirmation lands on-chain.
- [ ] `/api/trigger/confirm` returns a real txHash
- [ ] After the 2nd guardian, contract state flips ACTIVE → EXECUTING
- [ ] The `Executed` event is observed by the backend

### 13. Surface lastSeen / daysInactive to the API
Labels: area:chain, priority:p2
Body:
- [ ] Read `lastSeen` and `daysInactive()` from the contract
- [ ] Include them in `/api/trigger/status/:userId`

### 14. Anchor the vault integrity hash on-chain end-to-end
Labels: area:chain, type:wow, priority:p1
Body:
The "prove nothing was tampered with" feature.
- [ ] "Anchor integrity hash" button calls `setVaultHash`
- [ ] Hash readable back from the contract
- [ ] Shown on the family dashboard as a tamper-proof badge

---

## AI & VOICE (Dev B)

### 15. Verify Gemini will-assistant replies + JSON extraction
Labels: area:ai, priority:p0
Body:
- [ ] Chat returns sensible, one-question-at-a-time replies
- [ ] The `[[VAULT]]` JSON is parsed into "Captured so far"

### 16. Verify ElevenLabs voice cloning with a real sample
Labels: area:ai, priority:p0
Body:
- [ ] `POST /api/ai/voice/clone` with a ~60s clip returns a `voiceId`
- [ ] `voiceId` saved on the user

### 17. Verify Sarvam translation to Hindi
Labels: area:ai, priority:p0
Body:
- [ ] `translate()` turns English into natural Hindi (Devanagari)
- [ ] Try one other language (Tamil/Telugu/Marathi)

### 18. End-to-end legacy message: English → Hindi → cloned voice  ⭐
Labels: area:ai, priority:p0
Body:
THE emotional centerpiece. Must be flawless.
- [ ] `POST /api/ai/messages` returns a playable `audioUrl`
- [ ] The audio is in the user's cloned voice, speaking Hindi
- [ ] Latency acceptable, or pre-generate for the demo

### 19. Gemini Vision death-certificate verification
Labels: area:ai, priority:p0
Body:
- [ ] `POST /api/ai/verify-certificate` on a sample image returns `{looksValid, confidence, deceasedName, date}`
- [ ] Handles a clearly-not-a-cert image (returns false)

### 20. Gemini closure-email drafting for multiple platforms
Labels: area:ai, priority:p1
Body:
- [ ] `POST /api/ai/draft-closure` returns platform-specific text for Google, Meta, and a bank
- [ ] Mentions the attached certificate

### 21. AI digital obituary generation
Labels: area:ai, type:wow, priority:p1
Body:
- [ ] `POST /api/ai/obituary` returns a warm ~120-word remembrance from profile notes
- [ ] No clichés; reads with dignity

### 22. Add Tamil / Telugu / Marathi end-to-end to messages
Labels: area:ai, priority:p2
Body:
- [ ] Language dropdown options all produce translated, cloned-voice audio

### 23. Graceful fallback when an AI key is missing or over quota
Labels: area:ai, priority:p1
Body:
The demo must never hard-crash on an API error.
- [ ] Clear, friendly error messages
- [ ] Falls back to a pre-seeded clip / cached response where possible

---

## BACKEND CORE (Dev C)

### 24. Verify auth register/login + JWT
Labels: area:backend, priority:p0
Body:
- [ ] Register and login return a token
- [ ] Protected routes reject missing/invalid tokens

### 25. Verify vault encrypt / store / reveal against Atlas
Labels: area:backend, priority:p0
Body:
- [ ] Adding an item stores only the encrypted blob (check the DB)
- [ ] `/:id/reveal` decrypts correctly
- [ ] `/fingerprint` returns a stable 0x hash

### 26. Trigger status endpoint returns combined on-chain + DB state
Labels: area:backend, type:wire, priority:p0
Body:
- [ ] `/api/trigger/status/:userId` returns estateState, on-chain state, confirmed count, and the event log
- [ ] Frontend can poll it for the live status

### 27. Time-capsule delivery worker (deliverOn:"date")
Labels: area:backend, type:wow, priority:p2
Body:
- [ ] A scheduled job marks date-based messages delivered when their date arrives
- [ ] Works alongside death-triggered delivery

### 28. Persist generated audio to GridFS instead of base64
Labels: area:backend, priority:p2
Body:
Base64 data URLs bloat responses; stream files instead.
- [ ] Audio stored in GridFS (or S3)
- [ ] `audioUrl` points to a streaming endpoint
- [ ] Payloads are small again

### 29. Proof-of-life endpoint + lastSeen refresh on login
Labels: area:backend, priority:p1
Body:
- [ ] `POST /api/proof-of-life` updates lastSeen
- [ ] `GET /api/proof-of-life/status` returns daysInactive
- [ ] Login also refreshes lastSeen

---

## FRONTEND (Dev C)

### 30. Run the app and walk every page
Labels: area:frontend, priority:p0
Body:
- [ ] Landing, will-assistant, vault, guardians, messages, family dashboard all load
- [ ] List anything visibly broken as new issues

### 31. Guardians page: "Confirm passing" flow → /api/trigger/confirm
Labels: area:frontend, type:wire, priority:p0
Body:
- [ ] A confirm action calls the trigger endpoint with the guardian's key/wallet
- [ ] The 2-of-3 progress bar advances on each confirmation
- [ ] Second confirmation triggers execution

### 32. Death-certificate upload UI → /api/trigger/verify
Labels: area:frontend, type:wire, priority:p0
Body:
- [ ] Upload an image on a guardian-facing screen
- [ ] Show Gemini's verification result
- [ ] Verification gates the confirm step

### 33. Verify will-assistant chat is wired to Gemini
Labels: area:frontend, priority:p0
Body:
- [ ] Messages send to `/api/ai/will-assistant` and render replies
- [ ] "Captured so far" appears when JSON is extracted

### 34. Verify Messages flow: record → clone → generate → play
Labels: area:frontend, priority:p0
Body:
- [ ] Mic recording works and uploads
- [ ] After cloning, generating a message returns audio that plays in-page

### 35. Family dashboard polls status + shows Etherscan tx
Labels: area:frontend, type:wire, priority:p0
Body:
- [ ] When EXECUTING, the dashboard unlocks
- [ ] Messages play; the transfer tx links to sepolia.etherscan.io

### 36. Candle goes "still" at the death trigger
Labels: area:frontend, type:wow, priority:p1
Body:
- [ ] On the family dashboard the flame animation stops and dims (already coded — verify it reads as intentional)

### 37. Proof-of-life "I'm still here" button + inactivity banner
Labels: area:frontend, type:wow, priority:p2
Body:
- [ ] Button calls proof-of-life and resets the timer
- [ ] A banner shows days since last seen

### 38. Account-executor view: accounts list + drafted closure emails
Labels: area:frontend, priority:p1
Body:
- [ ] Family dashboard lists accounts with status (transfer/memorialize/delete)
- [ ] Shows the Gemini-drafted email per account

### 39. Mobile responsiveness on the 3 demo-spine screens
Labels: area:frontend, priority:p2
Body:
- [ ] Will-assistant, messages, and family dashboard look right on a phone

### 40. Loading + error states on slow AI calls
Labels: area:frontend, priority:p1
Body:
AI calls take seconds — the UI must never look frozen.
- [ ] Spinners/skeletons while waiting
- [ ] Friendly error messages on failure

---

## DEMO & SUBMISSION

### 41. Pre-generate a guaranteed Hindi voice clip (fallback)  ⭐
Labels: type:demo, priority:p0
Body:
Insurance for the centerpiece in case ElevenLabs is slow/down on stage.
- [ ] Generate one perfect clip ahead of time
- [ ] Set `DEMO_AUDIO_URL` so the seeded message uses it

### 42. Seed a polished demo account with realistic data
Labels: type:demo, priority:p0
Body:
- [ ] Tweak `seed-demo.js` so the demo account looks real and complete
- [ ] Re-run before the demo

### 43. Write + rehearse the 3–4 minute demo script
Labels: type:demo, priority:p0
Body:
Follow the spine: AI guide → cloned voice in Hindi → fund contract → guardians confirm → dashboard unlocks.
- [ ] Script written
- [ ] Rehearsed end-to-end at least twice, timed

### 44. Add a consent/ethics one-liner to the pitch
Labels: type:demo, priority:p1
Body:
- [ ] Slide/line: nothing activates while alive, you opt in, a quorum is required

### 45. Record a backup demo video
Labels: type:demo, priority:p0
Body:
If the live demo fails, you still have a clean run to show.
- [ ] Full flow recorded
- [ ] Uploaded and linked in the submission

### 46. Submit on Devfolio with all sponsor tracks tagged
Labels: type:demo, priority:p0
Body:
- [ ] Description, repo link, and video added
- [ ] Tracks ticked: Sarvam, Gemini, ElevenLabs, MongoDB, Vultr, Ethereum, Blockchain&Web3, Open Innovation, GenAI&ML
- [ ] Submitted before the deadline

### 47. Deploy backend to Vultr
Labels: area:devops, priority:p1
Body:
For the Vultr prize and a live demo URL.
- [ ] Backend reachable on a public URL
- [ ] Frontend points to it (or also deployed)

### 48. Update README with live URL + deployed contract address
Labels: area:devops, priority:p1
Body:
- [ ] Live demo link added
- [ ] Sepolia contract address + Etherscan link added
