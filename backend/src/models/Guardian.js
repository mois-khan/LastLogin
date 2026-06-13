import mongoose from "mongoose";

const guardianSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    name: String,
    email: String,
    walletAddress: String, // confirms on-chain
    access: { type: [String], default: [] }, // vault categories this guardian may see (RBAC)
    confirmed: { type: Boolean, default: false },
    confirmedAt: Date,
    otpCode: String, // emailed verification code (single-use)
    otpExpires: Date,
  },
  { timestamps: true }
);

export default mongoose.model("Guardian", guardianSchema);
