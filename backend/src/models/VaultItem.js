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
    platform: String, // optional pre-defined platform key (gmail, instagram, facebook…) for the icon
    // Disposition (the lifecycle rule the owner sets per asset):
    //   "transfer" = details are released to the guardians the owner toggles on
    //   "delete"   = flagged for closure on trigger; NEVER shown to any guardian
    disposition: { type: String, enum: ["transfer", "delete"], default: "transfer", index: true },
    // "server" = encrypted at rest, server can open it (so guardians can be handed credentials).
    // "client" = legacy zero-knowledge items (browser-encrypted); shown to the owner only.
    scheme: { type: String, enum: ["server", "client"], default: "server" },
    // AES-256-GCM blob — raw secret is NEVER stored
    blob: { iv: String, tag: String, data: String },
  },
  { timestamps: true }
);

export default mongoose.model("VaultItem", vaultItemSchema);
