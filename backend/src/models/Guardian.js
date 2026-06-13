import mongoose from "mongoose";

const guardianSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    name: String,
    email: String,
    phone: String,
    walletAddress: String, // optional — confirms on-chain if present
    access: { type: [String], default: [] }, // legacy category RBAC (superseded by assetAccess)
    // Per-guardian, per-asset grants — completely isolated between guardians.
    assetAccess: { type: [mongoose.Schema.Types.ObjectId], ref: "VaultItem", default: [] },
    fileAccess: { type: [mongoose.Schema.Types.ObjectId], ref: "Attachment", default: [] },
    confirmed: { type: Boolean, default: false },
    confirmedAt: Date,
    otpCode: String, // emailed verification code (single-use)
    otpExpires: Date,
  },
  { timestamps: true }
);

export default mongoose.model("Guardian", guardianSchema);
