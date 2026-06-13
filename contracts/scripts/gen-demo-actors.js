// Generate the demo cast: 3 guardians + 1 beneficiary (family) wallet we control.
// THROWAWAY testnet wallets only. Keys are saved to demo-actors.json (git-ignored)
// so the smoke test can sign as them. Run: npm run demo:actors
import { Wallet } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, "../demo-actors.json");
const force = process.argv.includes("--force");

if (fs.existsSync(OUT) && !force) {
  console.error("✖ demo-actors.json already exists — refusing to overwrite (would lose keys).");
  console.error("  Re-run with --force only if you mean to replace the cast.");
  process.exit(1);
}

const mk = () => { const w = Wallet.createRandom(); return { address: w.address, privateKey: w.privateKey }; };
const data = { guardians: [mk(), mk(), mk()], beneficiary: mk() };
fs.writeFileSync(OUT, JSON.stringify(data, null, 2) + "\n");

console.log("✔ Demo cast generated -> demo-actors.json (git-ignored)");
console.log("  Guardian 1:", data.guardians[0].address);
console.log("  Guardian 2:", data.guardians[1].address);
console.log("  Guardian 3:", data.guardians[2].address);
console.log("  Beneficiary (family):", data.beneficiary.address);
console.log("");
console.log("  Next: npm run deploy   (deploys with these guardians)");
