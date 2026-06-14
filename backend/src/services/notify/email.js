import axios from "axios";

// Every outbound email in LastLogin goes through here. Twilio SendGrid - once you've
// verified a sender (Single Sender Verification) or a domain, it delivers to ANY recipient.
// Set SENDGRID_API_KEY and SENDGRID_FROM (your verified sender) in backend/.env.
export async function sendEmail({ to, subject, text, html }) {
  const key = process.env.SENDGRID_API_KEY;
  const from = process.env.SENDGRID_FROM;
  if (!key || !from) return { mocked: true, to, subject, text }; // safe no-op until configured

  const content = [{ type: "text/plain", value: text || "" }];
  if (html) content.push({ type: "text/html", value: html });

  const res = await axios.post(
    "https://api.sendgrid.com/v3/mail/send",
    {
      personalizations: [{ to: [{ email: to }] }],
      from: { email: from, name: "LastLogin" },
      subject,
      content,
    },
    { headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" } }
  );
  return { id: "sendgrid", status: res.status }; // 202 Accepted = queued for delivery
}
