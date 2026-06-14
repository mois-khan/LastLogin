import jwt from "jsonwebtoken";

// Verifies a guardian's short-lived session token (issued after email+OTP in the /access flow).
// Prefers the body token: the axios interceptor stamps the OWNER's token on the Authorization
// header, which would otherwise clobber the guardian's session in the same browser.
export function guardianAuth(req, res, next) {
  const h = req.headers.authorization || "";
  const tok = req.body?.token || (h.startsWith("Bearer ") ? h.slice(7) : null);
  if (!tok) return res.status(401).json({ error: "Verify your email first." });
  try {
    const p = jwt.verify(tok, process.env.JWT_SECRET);
    if (p.kind !== "guardian") throw new Error("bad kind");
    req.guardian = p;
    next();
  } catch {
    return res.status(401).json({ error: "Your session expired — verify again." });
  }
}
