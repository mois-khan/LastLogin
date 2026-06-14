# Tech Stack — LastLogin

What each piece of technology is, and what it actually *does* in this project — in the simplest words.

## How it all fits together (the 10-second version)

```
  You (browser)                 Our server                 Helpers
  ─────────────                 ──────────                 ───────
  React app  ───requests──▶  Node + Express API  ──▶  MongoDB        (stores everything)
  (the screens)                 (the brain)        ──▶  Gemini        (AI words + reading certs)
                                                   ──▶  ElevenLabs    (your cloned voice)
                                                   ──▶  Sarvam        (Indian languages, speech↔text)
                                                   ──▶  SendGrid      (emails)
                                                   ──▶  Ethereum      (tamper-proof inheritance)
```

One server runs everything: the same Node app serves the React screens **and** answers the app's data requests.

---

## Frontend — what the user sees and clicks

| Tech | What it is | What it does in LastLogin |
|---|---|---|
| **React 18** | A way to build screens | Every page — vault, guardians, companion, the family memorial — is React |
| **Vite** | A build tool | Bundles and runs the React app (and the production build) |
| **Tailwind CSS** | Styling shortcuts | The warm "paper, ink, ember" look and every card/button comes from Tailwind |
| **React Router** | Page navigation | Moves you between `/vault`, `/access`, `/family` without full page reloads |
| **axios** | A messenger | Carries data between the screens and our server |
| **lucide-react + react-icons** | Icon sets | Real vector icons + brand logos (Gmail, Instagram…) — never emojis |
| **ethers.js** | Blockchain library | Reads the on-chain transfer so the family can verify it |
| **Web Audio / MediaRecorder** | Browser mic tools | Records your voice in the browser (to clone it, and to *talk* to the companion) |

## Backend — the brain

| Tech | What it is | What it does in LastLogin |
|---|---|---|
| **Node.js + Express** | A web server | The API: it answers every request — log in, save a vault item, send a message |
| **Mongoose** | A database helper | Defines what a User, Guardian, Message, Persona look like, and reads/writes them |
| **JWT** | A digital wristband | Proves who's logged in; gives a guardian a short-lived pass after they verify by email |
| **bcrypt** | A password scrambler | Stores passwords as one-way hashes — never in plain text |
| **multer** | File-upload handler | Receives death certificates, vault files, WhatsApp exports, and voice recordings |
| **adm-zip** | A zip opener | Reads the chat out of a WhatsApp `.zip` export |
| **AES-256-GCM** (Node crypto) | Strong encryption | Locks vault secrets so they're safe even in the database |

## Database

| Tech | What it is | What it does in LastLogin |
|---|---|---|
| **MongoDB Atlas** | A cloud database | Stores everything: accounts, the encrypted vault, guardians, messages, and the companion's memory |

## Blockchain — trustless inheritance

| Tech | What it is | What it does in LastLogin |
|---|---|---|
| **Solidity + Hardhat** | Smart-contract language + toolkit | `LastLogin.sol` is the on-chain rulebook: guardians, the 2-of-3 trigger, the beneficiary |
| **Ethereum (Sepolia testnet)** | A public blockchain | The inheritance transfer is recorded here, so it's **tamper-proof and anyone can verify it** |
| **ethers.js** | Blockchain library | Lets our server read and write the contract |

## AI & Voice — the heart of the product

| Tech | What it is | What it does in LastLogin |
|---|---|---|
| **Google Gemini** | A large AI model | The will-assistant chat, **reading** the death certificate (vision), drafting account-closure emails, and the **companion's replies** |
| **ElevenLabs** | Voice cloning + speech | Clones your voice from a short clip, then speaks your final messages and the companion **in your own voice** |
| **Sarvam AI** | India-first language AI | **Translates** messages to Hindi/Tamil/Telugu (with the correct gender), and does **speech-to-text** so you can *talk* instead of type |

## Email

| Tech | What it is | What it does in LastLogin |
|---|---|---|
| **Twilio SendGrid** | An email sender | Sends every email: verification codes, "a guardian reported a passing," and "a message was left for you" |

## Hosting & tooling

| Tech | What it is | What it does in LastLogin |
|---|---|---|
| **Render** / **Vultr** | Where the app runs online | Render = free + automatic HTTPS; Vultr = the sponsor host (a real server) |
| **Caddy** | Auto-HTTPS web server | Gives free SSL — needed because browsers only allow the microphone on `https://` |
| **pm2** | A process keeper | Keeps the server running and restarts it if it ever crashes |
| **Git + GitHub** | Version control | Stores the code and the full history (every change shipped as a reviewed PR) |

---

## Why each sponsor technology is here (for judges)

- **Google Gemini** — the assistant that fills the vault, the *eyes* that verify the death certificate, the email drafter, and the mind behind the AI companion.
- **ElevenLabs** — so the person's family hears *them*, not a stranger. Their actual voice.
- **Sarvam AI** — India-first: a family hears the message in *their* language, and can speak to the companion out loud.
- **MongoDB** — the encrypted vault and every record live here, reliably, in the cloud.
- **Vultr** — hosts the backend (and the whole app from one server).
- **Ethereum** — makes the inheritance **trustless**: transferred automatically, verifiable by anyone, contestable by no one.
- **GitHub** — the full, honest trail of how it was built.
