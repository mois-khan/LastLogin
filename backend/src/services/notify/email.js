import axios from "axios";

// Optional. For the demo, prefer DISPLAYING drafted emails in the dashboard rather
// than actually sending to Meta/Google. Resend free tier (~3k/mo) if you want real sends.
export async function sendEmail({ to, subject, text }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { mocked: true, to, subject, text }; // safe no-op for demos
  const { data } = await axios.post(
    "https://api.resend.com/emails",
    { from: "LastLogin <onboarding@resend.dev>", to, subject, text },
    { headers: { Authorization: `Bearer ${key}` } }
  );
  return data;
}
