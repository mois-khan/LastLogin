# LastLogin - API Keys Guide (free-first)

Get all of these in **Phase 0**. A dead key at hour 20 is how teams lose. Put
everything in `backend/.env` (copied from `.env.example`). Never commit it.

Quick verdict on cost: **everything is free except ElevenLabs, which needs the
$5 Starter plan for API access.** Total cash needed: ~$5 (≈ ₹430).

---

## 1. Gemini API - **FREE** · Will-assistant + doc verification + email drafting
- **Get it:** https://aistudio.google.com/apikey → "Create API key" (Google login).
- **Free tier:** generous free quota on `gemini-2.0-flash` (and current flash
  models) - plenty for a hackathon. No card required to start.
- **Why we need it:** (1) conversational will setup, (2) Vision death-certificate
  verification, (3) drafting account-closure emails.
- **Env:** `GEMINI_API_KEY=`
- **Test:**
  ```bash
  curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=$GEMINI_API_KEY" \
    -H 'Content-Type: application/json' \
    -d '{"contents":[{"parts":[{"text":"Say OK"}]}]}'
  ```

## 2. MongoDB Atlas - **FREE** · Encrypted vault + account catalog + messages
- **Get it:** https://www.mongodb.com/cloud/atlas/register → create a free **M0**
  cluster → Database Access (create a db user) → Network Access (allow your IP, or
  0.0.0.0/0 for the hackathon) → "Connect" → copy the connection string.
- **Free tier:** M0 shared cluster, 512 MB - more than enough.
- **Why:** primary datastore for encrypted vault blobs, accounts, final messages.
- **Env:** `MONGODB_URI=mongodb+srv://USER:PASS@cluster0.xxxx.mongodb.net/lastlogin`
- **Test:** the backend logs "Mongo connected" on `npm run dev`, or `mongosh "<uri>"`.

## 3. Sarvam AI - **FREE (₹100 credits)** · Indian-language final messages
- **Get it:** https://dashboard.sarvam.ai → sign up → API keys → create key.
  Every new user gets **₹100 free credits** (STT is ₹1.5/min; TTS similar) - easily
  enough for a demo. Optionally apply to the Sarvam Startup Program for more.
- **Why:** the ₹15,000 sponsor prize. Translate + speak the final message in
  Hindi/Tamil/Telugu/Marathi via the **Bulbul** TTS model. India-first by design.
- **Env:** `SARVAM_API_KEY=`
- **SDK:** `pip install sarvamai` (Python) or call the REST API from Node.
- **Test (python):**
  ```python
  from sarvamai import SarvamAI
  from sarvamai.play import save
  c = SarvamAI(api_subscription_key="YOUR_KEY")
  r = c.text_to_speech.convert(text="नमस्ते", target_language_code="hi-IN",
                               model="bulbul:v3", speaker="anushka")
  save(r, "out.wav")
  ```

## 4. ElevenLabs - **$5 Starter (needed for API)** · Voice cloning
- **Get it:** https://elevenlabs.io → sign up → Profile → API key.
- **Cost reality:** the **free tier gives ~10k chars + 3 instant voice clones but
  multiple sources report NO API access on free** - your backend can't call it.
  The **Starter plan ($5/mo, ~₹430)** unlocks Instant Voice Cloning + API access +
  commercial rights. Buy it in Phase 0; it's the cheapest insurance in this project.
- **Why:** the emotional centerpiece - the message is in the deceased's *own* voice.
  Instant Voice Cloning needs only a ~60-second clean sample.
- **Env:** `ELEVENLABS_API_KEY=`
- **Test:**
  ```bash
  curl https://api.elevenlabs.io/v1/voices -H "xi-api-key: $ELEVENLABS_API_KEY"
  ```

## 5. Sepolia RPC (Alchemy) - **FREE** · Ethereum testnet access
- **Get it:** https://dashboard.alchemy.com → sign up → create an app on the
  **Ethereum Sepolia** network → copy the HTTPS URL. (Infura works too.)
- **Free tier:** generous free request quota - fine for a hackathon.
- **Why:** deploy + interact with the LastLogin contract without spending real ETH.
- **Env:** `SEPOLIA_RPC_URL=`
- **Plus you need test ETH:** create a throwaway MetaMask wallet → fund it from a
  Sepolia faucet (e.g. Google Cloud Web3 faucet, Alchemy faucet, sepoliafaucet.com).
  Put that wallet's private key in `DEPLOYER_PRIVATE_KEY` - **testnet only, never a
  real wallet.**
- **Env:** `DEPLOYER_PRIVATE_KEY=`
- ⚠️ The **$100 Ethereum prize is a payout to mainnet**, not your gas budget. Build
  entirely on Sepolia.

## 6. Vultr - **FREE via credits** · Backend hosting
- **Get it:** https://www.vultr.com → sign up. Look for: a HackPrix/MLH coupon
  (ask the organizers/Discord - sponsors usually drop one), the GitHub Student
  Developer Pack ($/credit for students), or new-signup promo credit.
- **Why:** the "Best Use of Vultr" prize requires deploying *on* Vultr. A small
  Ubuntu compute instance running your Node backend (pm2) is enough. Deploy early.
- **No env var** - it's infra. Keep the public URL for your submission.

## 7. GitHub - **FREE** · Collaboration (and a prize)
- **Get it:** you already have it. Make the repo, add collaborators.
- **Why:** "Best Use of GitHub" prize - see GITHUB_STRATEGY.md.

## 8. (Optional) Email - Resend **FREE** · Account-executor demo
- **Get it:** https://resend.com → free tier ~3,000 emails/mo. Or skip and just
  *display* the Gemini-drafted emails in the UI (recommended for a demo - don't
  actually email Meta/Google).
- **Env:** `RESEND_API_KEY=`

---

## Summary table

| Service | Cost | Env var(s) | Used by | Powers which prize |
|---|---|---|---|---|
| Gemini | Free | `GEMINI_API_KEY` | Dev B | Gemini, GenAI |
| MongoDB Atlas | Free (M0) | `MONGODB_URI` | Dev C | MongoDB |
| Sarvam AI | Free ₹100 | `SARVAM_API_KEY` | Dev B | **Sarvam ₹15k** |
| ElevenLabs | **$5** | `ELEVENLABS_API_KEY` | Dev B | ElevenLabs |
| Alchemy/Sepolia | Free | `SEPOLIA_RPC_URL`, `DEPLOYER_PRIVATE_KEY` | Dev A | Web3, Ethereum |
| Vultr | Free credit | - (infra) | Dev C | Vultr |
| GitHub | Free | - | All | Best Use of GitHub |
| Resend (opt) | Free | `RESEND_API_KEY` | Dev C | - |

**Security rules:** `.env` is git-ignored - keep it that way. Use a throwaway
testnet wallet only. If any key leaks into a commit, **rotate it immediately**
(deleting the commit isn't enough - the key is already public).
