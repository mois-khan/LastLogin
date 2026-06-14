import mongoose from "mongoose";

// Media vault - images and files the owner leaves behind. Stored as a base64 data URL
// for the hackathon (swap for GridFS/S3 later). Same disposition rule as vault items:
// "delete" files are never surfaced to any guardian.
const attachmentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    name: String,
    mimeType: String,
    size: Number,
    dataUrl: String, // data:<mime>;base64,<...>
    disposition: { type: String, enum: ["transfer", "delete"], default: "transfer", index: true },
  },
  { timestamps: true }
);

export default mongoose.model("Attachment", attachmentSchema);
