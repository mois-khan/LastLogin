// Generate a THROWAWAY Sepolia wallet and write its key into backend/.env.
// Testnet only - never use this for a wallet that holds real funds.
// Run: npm run wallet     (from contracts/)   ->  resolves GitHub issue #3 (step 1)
import { Wallet } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.resolve(__dirname, "../../backend/.env");
const force = process.argv.includes("--force");

function setEnvVar(file, key, value) {
  let s = fs.readFileSync(file, "utf8");
  const line = `${key}=${value}`;
  if (new RegExp(`^${key}=`, "m").test(s)) s = s.replace(new RegExp(`^${key}=.*$`, "m"), line);
  else s = s.replace(/\n?$/, `\n${line}\n`);
  fs.writeFileSync(file, s);
}

function currentValue(file, key) {
  const m = fs.readFileSync(file, "utf8").match(new RegExp(`^${key}=(.*)$`, "m"));
  return m ? m[1].trim() : "";
}

if (!fs.existsSync(ENV_PATH)) {
  console.error(`✖ ${ENV_PATH} not found. Copy .env.example to backend/.env first.`);
  process.exit(1);
}

if (currentValue(ENV_PATH, "DEPLOYER_PRIVATE_KEY") && !force) {
  console.error("✖ DEPLOYER_PRIVATE_KEY is already set in backend/.env.");
  console.error("  Refusing to overwrite. Re-run with --force only if you mean to replace it.");
  process.exit(1);
}

const w = Wallet.createRandom();
setEnvVar(ENV_PATH, "DEPLOYER_PRIVATE_KEY", w.privateKey);

console.log("✔ Throwaway Sepolia wallet generated and written to backend/.env");
console.log("");
console.log("  Fund THIS address from a faucet (private key stays in .env, not printed):");
console.log("  ┌──────────────────────────────────────────────────────────────");
console.log(`  │  ${w.address}`);
console.log("  └──────────────────────────────────────────────────────────────");
console.log("");
console.log("  Faucets (pick one, paste the address above):");
console.log("    • https://cloud.google.com/application/web3/faucet/ethereum/sepolia");
console.log("    • https://www.alchemy.com/faucets/ethereum-sepolia");
console.log("    • https://sepoliafaucet.com");
console.log("");
console.log("  Want ~0.1 test ETH. Then: npm run deploy   (fills CONTRACT_ADDRESS).");
