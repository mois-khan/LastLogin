import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";

dotenv.config();

// Wipe the entire database - every collection, every document. Run: npm run db:drop
async function main() {
  await connectDB();
  const { host, name } = mongoose.connection;
  const before = await mongoose.connection.db.listCollections().toArray();
  await mongoose.connection.dropDatabase();
  console.log(`Dropped database "${name}" on ${host} - removed ${before.length} collection(s): ${before.map((c) => c.name).join(", ") || "(none)"}`);
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
