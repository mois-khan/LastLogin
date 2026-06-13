import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";
import Guardian from "../models/Guardian.js";
import VaultItem from "../models/VaultItem.js";
import Message from "../models/Message.js";
import { encrypt } from "../services/crypto/vault.js";

dotenv.config();

// Idempotent demo seed. Run: npm run seed
async function main() {
  await connectDB();
  const email = "demo@lastlogin.app";
  await Promise.all([
    User.deleteOne({ email }),
  ]);
  const user = await User.create({
    email,
    passwordHash: await bcrypt.hash("demo1234", 10),
    name: "Rajesh Kumar",
    voiceId: process.env.DEMO_VOICE_ID || "", // set after you clone once
    estateState: "ACTIVE",
  });
  await VaultItem.deleteMany({ userId: user._id });
  await Guardian.deleteMany({ userId: user._id });
  await Message.deleteMany({ userId: user._id });

  await VaultItem.create([
    { userId: user._id, type: "account", label: "Gmail", blob: encrypt("rajesh@gmail.com / ********") },
    { userId: user._id, type: "crypto", label: "MetaMask seed", blob: encrypt("**** redacted demo ****") },
    { userId: user._id, type: "document", label: "Life insurance policy", blob: encrypt("Policy #LIC-99231") },
    { userId: user._id, type: "subscription", label: "Netflix", blob: encrypt("cancel on trigger") },
  ]);
  await Guardian.create([
    { userId: user._id, name: "Priya (wife)", email: "priya@example.com", walletAddress: "0x...G1" },
    { userId: user._id, name: "Arjun (brother)", email: "arjun@example.com", walletAddress: "0x...G2" },
    { userId: user._id, name: "Family lawyer", email: "lawyer@example.com", walletAddress: "0x...G3" },
  ]);
  await Message.create({
    userId: user._id, recipientName: "Ananya (daughter)",
    text: "बेटा, मुझे तुम पर बहुत गर्व है। हमेशा खुश रहना।",
    language: "hi-IN", deliverOn: "death", delivered: false,
    audioUrl: process.env.DEMO_AUDIO_URL || "", // paste a pre-generated clip for a guaranteed demo
  });

  console.log("Seeded demo user:", email, "/ password: demo1234");
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
