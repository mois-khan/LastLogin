import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    recipientName: String,
    recipientEmail: String, // legacy single recipient
    // Who may see this message:
    //   scope "global"   -> everyone (the public memorial + every guardian)
    //   scope "assigned" -> only the emails in `recipients` (guardians or anyone)
    scope: { type: String, enum: ["global", "assigned"], default: "assigned" },
    recipients: { type: [String], default: [] },
    text: String,
    language: { type: String, default: "en-IN" }, // hi-IN, ta-IN, te-IN, mr-IN
    audioUrl: String, // generated legacy-voice clip
    // delivery: on death, or a scheduled future date (time capsule)
    deliverOn: { type: String, enum: ["death", "date"], default: "death" },
    deliverAt: Date,
    delivered: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
