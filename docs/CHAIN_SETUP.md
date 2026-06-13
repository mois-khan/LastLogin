# Chain setup (Dev A) — keys, deploy, verify, and closing the issues

This is the chain-owner runbook for the three keys that don't come from a signup
form alone: `DEPLOYER_PRIVATE_KEY`, `CONTRACT_ADDRESS`, and `ETHERSCAN_API_KEY`.
We automated the mechanical parts; the parts that need a human (a faucet captcha,
an Etherscan signup) are called out explicitly.

> All four chain vars live in **`backend/.env`** — Hardhat loads it via
> `dotenv.config({ path: "../backend/.env" })` in `hardhat.config.js`. There is no
> separate `contracts/.env`. `.env` is git-ignored; never commit it.

## TL;DR — the whole flow is three commands

```bash
cd contracts
npm run wallet      # 1. make a throwaway wallet -> writes DEPLOYER_PRIVATE_KEY, prints an address to fund
#    (go fund that address from a faucet — the one manual step)
npm run deploy      # 2. deploy to Sepolia       -> writes CONTRACT_ADDRESS automatically
# 3. verify (the exact command is printed by deploy; needs ETHERSCAN_API_KEY):
npx hardhat verify --network sepolia --constructor-args scripts/verify-args.cjs <CONTRACT_ADDRESS>
```

---

## 1. `DEPLOYER_PRIVATE_KEY` — a throwaway testnet wallet  (issue #3)

**What it is:** the private key the deploy/owner transactions are signed with.
**Rule:** testnet only. Never paste a key for a wallet that holds real funds.

**Automated:** `npm run wallet` (`scripts/gen-wallet.js`) generates a brand-new
random wallet with ethers, writes the key straight into `backend/.env`, and prints
only the public address (the key never hits your terminal/scrollback). It refuses
to overwrite an existing key unless you pass `--force`.

**Your one manual step — fund it:** copy the printed address into a faucet and get
~0.1 Sepolia test ETH:
- https://cloud.google.com/application/web3/faucet/ethereum/sepolia
- https://www.alchemy.com/faucets/ethereum-sepolia
- https://sepoliafaucet.com

Faucets gate on a Google login / mainnet-balance / captcha, so this can't be
scripted — it's the one human step. Check the balance on
`https://sepolia.etherscan.io/address/<your-address>` before deploying.

## 2. `CONTRACT_ADDRESS` — output of the deploy  (issue #5)

**What it is:** the address of your deployed `LastLogin` contract. The backend
reads it in `services/blockchain/ethers.js#getContract`.

**Before deploying:** edit the real guardian + beneficiary addresses at the top of
`scripts/deploy.js` (`GUARDIANS` / `BENEFICIARIES` — currently `0x..0001`–`0004`
placeholders). The contract constructor requires **exactly 3 guardians** and that
beneficiary `bps` **sum to 10000**, or the deploy reverts.

**Automated:** `npm run deploy` deploys (funding the contract with 0.02 test ETH),
then writes `CONTRACT_ADDRESS=` into `backend/.env` for you and prints the
Etherscan link + the exact verify command. It also writes `scripts/verify-args.cjs`
(the exact constructor args) so verification can never drift from what you deployed.

Needs `SEPOLIA_RPC_URL` (already set) + a funded `DEPLOYER_PRIVATE_KEY` (step 1).

## 3. `ETHERSCAN_API_KEY` — for verifying the source  (issue #6)

**What it is:** an API key so `hardhat verify` can publish your source on Etherscan
(verified source reads far better to judges).

**Get it (manual signup):** https://etherscan.io → create an account → **API Keys**
→ Add. Paste it after `ETHERSCAN_API_KEY=` in `backend/.env`.

**Then verify (one command, printed by deploy):**
```bash
npx hardhat verify --network sepolia --constructor-args scripts/verify-args.cjs <CONTRACT_ADDRESS>
```
Success shows the contract source as readable + a ✓ on Etherscan.

---

## Resolving the GitHub issues once it's done

These map 1:1 to issues in `docs/GITHUB_ISSUES.md`. After each real step is done,
tick the boxes (or close from the CLI). Make sure `gh auth status` is logged in.

```bash
# #3 — wallet created + funded
gh issue close 3 --comment "Throwaway Sepolia wallet generated via 'npm run wallet' and funded ~0.1 test ETH from a faucet. Key in backend/.env (git-ignored)."

# #5 — contract deployed, address recorded
gh issue close 5 --comment "Deployed to Sepolia via 'npm run deploy'; CONTRACT_ADDRESS auto-written to backend/.env. Live: https://sepolia.etherscan.io/address/<ADDRESS>"

# #6 — source verified on Etherscan
gh issue close 6 --comment "Verified with 'hardhat verify' using scripts/verify-args.cjs. Source readable on Etherscan."
```

Don't close an issue until its step is actually green — `#5`/`#6` depend on a funded
wallet, so they come after the faucet step. (`SEPOLIA_RPC_URL` / issue #4 is already
set in `.env`.)
