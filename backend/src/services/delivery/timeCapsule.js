import Message from "../../models/Message.js";
import User from "../../models/User.js";
import { sendEmail } from "../notify/email.js";

// Recipients of a message: explicit list, else the legacy single email.
function recipientsOf(m) {
  if (Array.isArray(m.recipients) && m.recipients.length) return m.recipients;
  return m.recipientEmail ? [m.recipientEmail] : [];
}

// Deliver any time-capsule message (deliverOn:"date") whose deliverAt has arrived and
// that hasn't been delivered yet. Marks it delivered and emails each recipient a link to
// open it. Unlike death-triggered messages, these fire while the owner is still alive.
export async function deliverDueMessages() {
  const now = new Date();
  const due = await Message.find({ deliverOn: "date", delivered: false, deliverAt: { $lte: now } });
  if (!due.length) return 0;
  const origin = process.env.CLIENT_ORIGIN || "http://localhost:5173";

  for (const m of due) {
    const u = await User.findById(m.userId).select("name");
    for (const to of recipientsOf(m)) {
      try {
        await sendEmail({
          to,
          subject: `A message from ${u?.name || "someone who loves you"}`,
          text: `${u?.name || "Someone"} scheduled this message to reach you today:\n\n"${m.text}"\n\nHear it in their own voice - and download it - here: ${origin}/inbox/${m.userId}`,
        });
      } catch { /* best-effort: a bad address shouldn't block the rest */ }
    }
    m.delivered = true;
    await m.save();
  }
  return due.length;
}

// Poll on an interval. Demo-safe: every tick swallows its own errors so a DB hiccup or a
// missing mail key never crashes the server. unref() lets the process exit cleanly.
export function startTimeCapsuleWorker(intervalMs = 60_000) {
  const tick = () =>
    deliverDueMessages()
      .then((n) => { if (n) console.log(`time-capsule: delivered ${n} message(s)`); })
      .catch((e) => console.warn("time-capsule tick failed:", e.message));
  tick();
  const timer = setInterval(tick, intervalMs);
  timer.unref?.();
  return () => clearInterval(timer);
}
