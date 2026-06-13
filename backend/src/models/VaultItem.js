import mongoose from "mongoose";

const vaultItemSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    type: {
      type: String,
      enum: ["account", "bank", "crypto", "insurance", "loan", "document", "subscription"],
      required: true,
    },
    label: String,
    // "client" = zero-knowledge (encrypted in the browser; server can't read it).
    // "server" = legacy fallback (encrypted server-side). New items are "client".
    scheme: { type: String, enum: ["server", "client"], default: "server" },
    // AES-256-GCM blob — raw secret is NEVER stored
    blob: { iv: String, tag: String, data: String },
  },
  { timestamps: true }
);

export default mongoose.model("VaultItem", vaultItemSchema);
