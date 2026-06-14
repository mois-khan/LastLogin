import mongoose from "mongoose";

// The owner's "self" for the AI companion: how they speak and think, distilled from a
// tailored questionnaire (+ their cloned voice, stored on User). Never holds secrets.
const personaSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true, index: true },
    answers: { type: Object, default: {} }, // questionnaire: question -> answer
    keyPhrases: { type: [String], default: [] }, // their signature sayings
    personaPrompt: String, // Gemini-synthesized style/voice guide used as the system instruction
    baseLanguage: { type: String, default: "en-IN" },
    ready: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Persona", personaSchema);
