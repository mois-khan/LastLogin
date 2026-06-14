import { ethers } from "ethers";

// Minimal ABI - matches contracts/contracts/LastLogin.sol
export const ABI = [
  "function getState() view returns (uint8)",
  "function vaultHash() view returns (bytes32)",
  "function lastSeen() view returns (uint256)",
  "function daysInactive() view returns (uint256)",
  "function confirmations() view returns (uint256)",
  "function proveLife()",
  "function setVaultHash(bytes32)",
  "function confirmDeath()",
  "function fund() payable",
  "event GuardianConfirmed(address indexed guardian, uint256 total, uint256 timestamp)",
  "event Executed(uint256 totalDistributed, uint256 timestamp)",
  "event ProofOfLife(uint256 timestamp)",
  "event VaultHashUpdated(bytes32 vaultHash, uint256 timestamp)",
];

export function getProvider() {
  const url = process.env.SEPOLIA_RPC_URL;
  if (!url) throw new Error("SEPOLIA_RPC_URL missing");
  return new ethers.JsonRpcProvider(url);
}

export function getContract(signerOrProvider) {
  const addr = process.env.CONTRACT_ADDRESS;
  if (!addr) throw new Error("CONTRACT_ADDRESS missing - deploy first");
  return new ethers.Contract(addr, ABI, signerOrProvider || getProvider());
}

export async function getState() {
  const c = getContract();
  const [state, confirmations, vaultHash] = await Promise.all([
    c.getState(), c.confirmations(), c.vaultHash(),
  ]);
  return { state: Number(state) === 1 ? "EXECUTING" : "ACTIVE", confirmations: Number(confirmations), vaultHash };
}

/** Owner anchors the vault fingerprint on-chain (tamper-proof). */
export async function anchorVaultHash(hash) {
  const signer = ownerSigner();
  const tx = await getContract(signer).setVaultHash(hash);
  await tx.wait();
  return tx.hash;
}

/** Owner proves they are alive (resets the dead-man's switch). */
export async function proveLife() {
  const tx = await getContract(ownerSigner()).proveLife();
  await tx.wait();
  return tx.hash;
}

/** A guardian confirms death. In a real app each guardian signs from their own wallet;
 *  for the demo the backend can submit using a guardian key. */
export async function confirmDeath(guardianPrivateKey) {
  const signer = new ethers.Wallet(guardianPrivateKey, getProvider());
  const tx = await getContract(signer).confirmDeath();
  const receipt = await tx.wait();
  return receipt.hash;
}

/** Subscribe to the on-chain Executed event. cb({ txHash, distributed }) */
export function onExecuted(cb) {
  const c = getContract();
  c.on("Executed", (distributed, ts, ev) => cb({ txHash: ev?.log?.transactionHash, distributed: distributed.toString() }));
  return () => c.removeAllListeners("Executed");
}

function ownerSigner() {
  const pk = process.env.DEPLOYER_PRIVATE_KEY;
  if (!pk) throw new Error("DEPLOYER_PRIVATE_KEY missing");
  return new ethers.Wallet(pk, getProvider());
}
