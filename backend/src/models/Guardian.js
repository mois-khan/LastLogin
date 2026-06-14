import mongoose from "mongoose";

const guardianSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    name: String,
    email: String,
    phone: String,
    walletAddress: String, // guardian's Phantom (Solana) address - must match to unlock granted crypto recovery phrases
    access: { type: [String], default: [] }, // legacy category RBAC (superseded by assetAccess)
    // Per-guardian, per-asset grants - completely isolated between guardians.
    assetAccess: { type: [mongoose.Schema.Types.ObjectId], ref: "VaultItem", default: [] },
    fileAccess: { type: [mongoose.Schema.Types.ObjectId], ref: "Attachment", default: [] },
    confirmed: { type: Boolean, default: false }, // uploaded a verified death certificate
    confirmedAt: Date,
    certVerified: { type: Boolean, default: false },
    certName: String,
    otpCode: String, // emailed verification code (single-use)
    otpExpires: Date,
  },
  { timestamps: true }
);

export default mongoose.model("Guardian", guardianSchema);
