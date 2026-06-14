# Deploying LastLogin

One server runs everything: the Node/Express backend **also serves the built React frontend**,
so there's a single origin - no CORS, no separate frontend host. MongoDB is Atlas (already in
the cloud); the contract is already on Sepolia.

> **HTTPS is required, not optional.** The voice features (cloning, the companion's mic/STT)
> use the browser microphone, which browsers **block on plain `http://` or a bare IP**. So the
> public URL must be `https://…`. The steps below get you free, automatic HTTPS with Caddy.

## Two ways - both free

**A. Render - easiest, truly $0, no server to manage.** Best if you just want it live fast.
Render's free plan gives automatic HTTPS on a `*.onrender.com` URL (so the mic works) and reads the
[`render.yaml`](render.yaml) in this repo:
1. Go to **render.com → New → Blueprint** → connect this GitHub repo.
2. It picks up `render.yaml`, then prompts you to paste each secret (your keys). Paste them.
3. Deploy. In ~3 min you get `https://lastlogin-xxxx.onrender.com`. Put that exact URL in
   **CLIENT_ORIGIN** (Environment tab) and click **Manual Deploy** once more.
4. MongoDB Atlas → Network Access → allow `0.0.0.0/0` (Render's IPs are dynamic).
   - Trade-off: the free service **sleeps after ~15 min idle** - open the URL a minute before you
     demo so it's awake. You don't earn the Vultr sponsor point.

**B. Vultr on free signup credit - keeps the sponsor prize, steadier for a live demo.** New Vultr
accounts (and the HackPrix sponsor) come with credit that easily covers a small VM for the event,
so it's free for you. Follow the runbook below - same steps, funded by the credit. A dedicated VM
means no cold-start while judges watch.

> If you have any Vultr credit, use **B** (free + prize + reliable). If not, **A** is genuinely $0
> and live in minutes.

---

## What you need first
1. A **Vultr** account → we'll create one small Cloud Compute VM (the sponsor host).
2. Your **API keys** (the ones already in `backend/.env`): Mongo, Gemini, Sarvam, ElevenLabs,
   SendGrid, and the Sepolia/chain values.
3. A **free subdomain** for HTTPS: sign up at **duckdns.org**, create something like
   `lastlogin-yourname.duckdns.org`, and (after step 1) point it at your VM's IP.
4. In **MongoDB Atlas → Network Access**, add your VM's IP (or `0.0.0.0/0` for the demo) so the
   server can connect.

---

## Step 1 - Create the VM
Vultr → **Deploy → Cloud Compute → Ubuntu 24.04**, the smallest plan is fine. Copy its **public IP**.
Then in **duckdns.org**, set your subdomain's IP to that address.

## Step 2 - One-time setup (SSH in as root: `ssh root@YOUR_IP`)
Paste this whole block:

```bash
# Node 20 + git + pm2 (keeps the app running) + Caddy (automatic HTTPS)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs git
apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt-get update && apt-get install -y caddy
npm i -g pm2

# Get the code and build the frontend
git clone https://github.com/mois-khan/LastLogin.git /opt/lastlogin
cd /opt/lastlogin/frontend && npm install && npm run build
cd /opt/lastlogin/backend && npm install
```

## Step 3 - Environment
Create `/opt/lastlogin/backend/.env`:

```bash
nano /opt/lastlogin/backend/.env
```

Paste your values (set `CLIENT_ORIGIN` to your **https** URL - it's used in the emails we send):

```
PORT=4000
CLIENT_ORIGIN=https://lastlogin-yourname.duckdns.org
MONGODB_URI=...your Atlas URI...
JWT_SECRET=...a long random string...
VAULT_MASTER_KEY=...32-byte hex or a long passphrase...
GEMINI_API_KEY=...
SARVAM_API_KEY=...
ELEVENLABS_API_KEY=...
SENDGRID_API_KEY=...
SENDGRID_FROM=your-verified-sender@example.com
# On-chain (for the Etherscan proof + reads)
SEPOLIA_RPC_URL=...
CONTRACT_ADDRESS=0x...
PROOF_TX=0x...        # the prior execution tx the demo links to
# DEPLOYER_PRIVATE_KEY only if you run a LIVE on-chain confirm; the demo path doesn't need it
```

## Step 4 - Run it
```bash
cd /opt/lastlogin/backend
pm2 start src/server.js --name lastlogin
pm2 save
pm2 startup        # run the one command it prints, so it survives reboots
```

## Step 5 - HTTPS (Caddy reverse proxy)
```bash
nano /etc/caddy/Caddyfile
```
Replace the contents with (use YOUR subdomain):
```
lastlogin-yourname.duckdns.org {
    reverse_proxy localhost:4000
}
```
Then:
```bash
systemctl restart caddy
ufw allow 80,443,22/tcp && ufw --force enable   # open web + ssh (skip if no ufw)
```
Caddy fetches a free SSL certificate automatically. Open **https://lastlogin-yourname.duckdns.org** - that's the live app. Seed the demo account if you want: `cd /opt/lastlogin/backend && npm run seed`.

---

## Redeploying after a code change
```bash
cd /opt/lastlogin && git pull
cd frontend && npm install && npm run build
cd ../backend && npm install && pm2 restart lastlogin
```

## Quick checks / troubleshooting
- App health: `curl -s http://localhost:4000/health` on the VM → `{"ok":true}`.
- Logs: `pm2 logs lastlogin`.
- Mic blocked / "voice cloning failed" in the browser → you're not on `https://` (or you denied the mic permission).
- "Couldn't connect to DB" → add the VM's IP in Atlas Network Access.
- Emails not arriving → finish SendGrid **Single Sender Verification** for `SENDGRID_FROM`.

## Faster fallback (not Vultr)
If Caddy/DuckDNS is fighting you near the deadline: deploy the same `backend/` folder to
**Render.com** (free, automatic HTTPS) with build `npm install && npm --prefix ../frontend install && npm --prefix ../frontend run build`
and start `node src/server.js`. You lose the Vultr sponsor point but get a working HTTPS URL in minutes.
