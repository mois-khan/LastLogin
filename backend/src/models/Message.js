import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    recipientName: String,
    recipientEmail: String,
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
