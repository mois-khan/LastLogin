import mongoose from "mongoose";

const guardianSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    name: String,
    email: String,
    walletAddress: String, // confirms on-chain
    confirmed: { type: Boolean, default: false },
    confirmedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("Guardian", guardianSchema);
