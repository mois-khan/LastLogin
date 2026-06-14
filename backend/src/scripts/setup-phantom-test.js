import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";
import Guardian from "../models/Guardian.js";
import VaultItem from "../models/VaultItem.js";
import { encrypt } from "../services/crypto/vault.js";

dotenv.config();

// One-shot setup to test the Phantom crypto-unlock WITHOUT running the full death flow.
// Usage: node src/scripts/setup-phantom-test.js <YOUR_PHANTOM_ADDRESS>
//
// It ensures the demo owner exists, adds a guardian whose Phantom address is the one you pass,
// gives that guardian a crypto recovery-phrase item, and forces the estate to EXECUTING so the
// guardian portal shows the (blurred) phrase ready to unlock.
async function main() {
  const phantomAddress = (process.argv[2] || "").trim();
  if (!phantomAddress) {
    console.warn("⚠  No Phantom address passed. The Unlock button won't match until you set one.");
    console.warn("   Re-run as: node src/scripts/setup-phantom-test.js <YOUR_PHANTOM_ADDRESS>\n");
  }

  await connectDB();

  // Owner (reuse the demo account if it exists).
  const email = "demo@lastlogin.app";
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      email, passwordHash: await bcrypt.hash("demo1234", 10),
      name: "Rajesh Kumar", estateState: "ACTIVE",
    });
  }

  // A crypto recovery-phrase item with a real-looking (test-only) seed phrase so the reveal shows something.
  const phrase = "witch collapse practice feed shame open despair creek road again ice least";
  // "Recovery words" (not "seed") so that once Phantom un-blurs it, it shows in full immediately.
  const blob = encrypt(JSON.stringify({ "Recovery words": phrase, Wallet: "MetaMask (demo)" }));
  let crypto = await VaultItem.findOne({ userId: user._id, type: "crypto", label: "MetaMask recovery phrase" });
  if (crypto) { crypto.blob = blob; crypto.disposition = "transfer"; crypto.scheme = "server"; await crypto.save(); }
  else crypto = await VaultItem.create({ userId: user._id, type: "crypto", label: "MetaMask recovery phrase", disposition: "transfer", scheme: "server", blob });

  // The guardian you'll log in as, carrying YOUR Phantom address + a grant to the crypto item.
  const gEmail = "tester@example.com";
  let g = await Guardian.findOne({ userId: user._id, email: gEmail });
  const patch = { name: "Phantom Tester", email: gEmail, walletAddress: phantomAddress, assetAccess: [crypto._id], confirmed: true, confirmedAt: new Date(), certVerified: true };
  if (g) { Object.assign(g, patch); await g.save(); }
  else g = await Guardian.create({ userId: user._id, ...patch });

  // Force the estate to EXECUTING so guardianGrants releases the item (skips the cert flow for testing).
  user.estateState = "EXECUTING";
  await user.save();

  console.log("\n✅ Phantom test ready.");
  console.log("   Owner (deceased) email : ", email);
  console.log("   Guardian login email   : ", gEmail);
  console.log("   Guardian Phantom addr  : ", phantomAddress || "(none set - Unlock won't match)");
  console.log("   Crypto item            :  MetaMask recovery phrase (granted)");
  console.log("\nNow open the app → /access → look up by", email, "→ verify as", gEmail, "→ Accounts tab.\n");
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
