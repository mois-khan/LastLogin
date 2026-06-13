import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI missing");
  mongoose.connection.on("connected", () => console.log("Mongo connected"));
  mongoose.connection.on("error", (e) => console.error("Mongo error:", e.message));
  await mongoose.connect(uri);
}
