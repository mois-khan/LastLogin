import mongoose from "mongoose";

// A service the user wants handled after death (distinct from the encrypted vault
// secrets) — used by the Account Executor to draft + send closure requests.
const accountSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    platform: String, // "Instagram"
    domain: String, // "instagram.com" — drives the logo + where the request goes
    category: { type: String, enum: ["social", "email", "bank", "subscription", "other"], default: "other" },
    action: { type: String, enum: ["delete", "memorialize", "transfer"], default: "delete" },
    contactEmail: String, // where the request is sent (a test inbox for the demo)
    draft: String, // Gemini-drafted request body
    status: { type: String, enum: ["pending", "sent"], default: "pending" },
    sentAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("Account", accountSchema);
