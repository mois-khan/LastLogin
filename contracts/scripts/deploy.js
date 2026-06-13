import hre from "hardhat";

// Fill these before deploying. Use THROWAWAY testnet addresses.
const GUARDIANS = [
  "0x0000000000000000000000000000000000000001",
  "0x0000000000000000000000000000000000000002",
  "0x0000000000000000000000000000000000000003",
];
const BENEFICIARIES = [
  { wallet: "0x0000000000000000000000000000000000000004", bps: 10000 },
];
const INITIAL_FUNDING_ETH = "0.02"; // small — Sepolia test ETH

async function main() {
  const c = await hre.ethers.deployContract("LastLogin", [GUARDIANS, BENEFICIARIES], {
    value: hre.ethers.parseEther(INITIAL_FUNDING_ETH),
  });
  await c.waitForDeployment();
  const addr = await c.getAddress();
  console.log("LastLogin deployed to:", addr);
  console.log("Add to backend/.env ->  CONTRACT_ADDRESS=" + addr);
  console.log("Verify with: npx hardhat verify --network sepolia", addr);
}

main().catch((e) => { console.error(e); process.exit(1); });
