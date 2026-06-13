// Smoke test for issue #12: prove the live confirm -> execute flip.
// Two guardians (whom we control) confirm death; on the 2nd the contract flips
// ACTIVE -> EXECUTING and pays the beneficiary. Exercises the same on-chain path
// as backend/src/services/blockchain/ethers.js (confirmDeath / getState / Executed).
// Run: npm run demo:trigger
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = fs.readFileSync(path.resolve(__dirname, "../../backend/.env"), "utf8");
const get = (k) => (env.match(new RegExp(`^${k}=(.*)$`, "m")) || [])[1]?.trim() || "";
const actors = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../demo-actors.json"), "utf8"));

const ABI = [
  "function getState() view returns (uint8)",
  "function confirmations() view returns (uint256)",
  "function confirmDeath()",
  "event GuardianConfirmed(address indexed guardian, uint256 total, uint256 timestamp)",
  "event Executed(uint256 totalDistributed, uint256 timestamp)",
];
const STATE = ["ACTIVE", "EXECUTING"];
const ES = (h) => "https://sepolia.etherscan.io/tx/" + h;

async function main() {
  const provider = new ethers.JsonRpcProvider(get("SEPOLIA_RPC_URL"));
  const deployer = new ethers.Wallet(get("DEPLOYER_PRIVATE_KEY"), provider);
  const addr = get("CONTRACT_ADDRESS");
  const read = new ethers.Contract(addr, ABI, provider);
  const beneficiary = actors.beneficiary.address;

  console.log("Contract:", addr);
  console.log("Beneficiary (family):", beneficiary, "\n");

  // Make sure the two confirming guardians can pay gas.
  for (let i = 0; i < 2; i++) {
    const g = actors.guardians[i];
    const bal = await provider.getBalance(g.address);
    if (bal < ethers.parseEther("0.0015")) {
      process.stdout.write(`Funding guardian ${i + 1} with gas... `);
      const tx = await deployer.sendTransaction({ to: g.address, value: ethers.parseEther("0.002") });
      await tx.wait();
      console.log("done");
    }
  }

  const stateBefore = Number(await read.getState());
  const benBefore = await provider.getBalance(beneficiary);
  console.log("\n--- BEFORE ---");
  console.log("State:", STATE[stateBefore], "| confirmations:", (await read.confirmations()).toString());
  console.log("Beneficiary balance:", ethers.formatEther(benBefore), "ETH\n");

  // Guardian 1 confirms.
  const g1 = new ethers.Contract(addr, ABI, new ethers.Wallet(actors.guardians[0].privateKey, provider));
  console.log("Guardian 1 confirming...");
  const t1 = await g1.confirmDeath();
  await t1.wait();
  console.log("  tx:", ES(t1.hash));
  console.log("  confirmations now:", (await read.confirmations()).toString(), "\n");

  // Guardian 2 confirms -> threshold reached -> auto-execute.
  const g2 = new ethers.Contract(addr, ABI, new ethers.Wallet(actors.guardians[1].privateKey, provider));
  console.log("Guardian 2 confirming (this should trigger execution)...");
  const t2 = await g2.confirmDeath();
  const receipt = await t2.wait();
  console.log("  tx:", ES(t2.hash));

  // Observe the Executed event from the receipt (same event backend onExecuted listens for).
  let executed = null;
  for (const log of receipt.logs) {
    try { const p = read.interface.parseLog(log); if (p?.name === "Executed") executed = p; } catch {}
  }

  const stateAfter = Number(await read.getState());
  const benAfter = await provider.getBalance(beneficiary);
  console.log("\n--- AFTER ---");
  console.log("State:", STATE[stateAfter]);
  console.log("Executed event:", executed ? `distributed ${ethers.formatEther(executed.args[0])} ETH` : "NOT FOUND");
  console.log("Beneficiary balance:", ethers.formatEther(benAfter), "ETH");
  console.log("Beneficiary received:", ethers.formatEther(benAfter - benBefore), "ETH\n");

  const ok = stateBefore === 0 && stateAfter === 1 && executed && benAfter > benBefore;
  console.log(ok
    ? "✅ #12 PROVEN: ACTIVE -> EXECUTING live, Executed fired, family was paid on-chain."
    : "❌ Something didn't flip as expected — see values above.");
  process.exit(ok ? 0 : 1);
}
main().catch((e) => { console.error("Error:", e.shortMessage || e.message); process.exit(1); });
