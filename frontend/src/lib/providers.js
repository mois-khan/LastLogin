// Popular providers the user can pick to auto-fill known details (login URL, label,
// platform key, brand mark) so they only type a username + password.
//
// Icon = a verified react-icons/si brand mark where one ships in react-icons v5.6,
// else a lucide-react fallback (Globe / Mail / Banknote). NEVER an emoji.
// Every Si* import below was checked to exist in this project's react-icons version —
// do not add a brand icon without verifying its export, a bad import breaks the build.
//
// category: one of "account" | "bank" | "subscription" | "social" | "email".
// The vault stores these as type:"account" with platform=key; category only drives
// grouping + the fallback icon in the picker.

import {
  SiGmail, SiProtonmail, SiInstagram, SiFacebook, SiX, SiYoutube, SiGithub,
  SiReddit, SiNetflix, SiSpotify, SiApple, SiPaypal, SiWhatsapp, SiDiscord,
  SiDropbox, SiTelegram,
} from "react-icons/si";
import { Globe, Mail, Banknote } from "lucide-react";

// SiLinkedin / SiAmazon do not ship in this react-icons version — fall back safely.
const SiLinkedin = Globe;

export const PROVIDERS = [
  // Email
  { key: "gmail", label: "Gmail", Icon: SiGmail, loginUrl: "https://mail.google.com", category: "email" },
  { key: "outlook", label: "Outlook", Icon: Mail, loginUrl: "https://outlook.live.com", category: "email" },
  { key: "proton", label: "Proton Mail", Icon: SiProtonmail, loginUrl: "https://mail.proton.me", category: "email" },

  // Social
  { key: "instagram", label: "Instagram", Icon: SiInstagram, loginUrl: "https://www.instagram.com", category: "social" },
  { key: "facebook", label: "Facebook", Icon: SiFacebook, loginUrl: "https://www.facebook.com", category: "social" },
  { key: "x", label: "X", Icon: SiX, loginUrl: "https://x.com", category: "social" },
  { key: "linkedin", label: "LinkedIn", Icon: SiLinkedin, loginUrl: "https://www.linkedin.com", category: "social" },
  { key: "youtube", label: "YouTube", Icon: SiYoutube, loginUrl: "https://www.youtube.com", category: "social" },
  { key: "reddit", label: "Reddit", Icon: SiReddit, loginUrl: "https://www.reddit.com", category: "social" },
  { key: "whatsapp", label: "WhatsApp", Icon: SiWhatsapp, loginUrl: "https://web.whatsapp.com", category: "social" },
  { key: "discord", label: "Discord", Icon: SiDiscord, loginUrl: "https://discord.com/login", category: "social" },
  { key: "telegram", label: "Telegram", Icon: SiTelegram, loginUrl: "https://web.telegram.org", category: "social" },

  // Accounts / cloud
  { key: "github", label: "GitHub", Icon: SiGithub, loginUrl: "https://github.com/login", category: "account" },
  { key: "apple", label: "Apple ID", Icon: SiApple, loginUrl: "https://account.apple.com", category: "account" },
  { key: "amazon", label: "Amazon", Icon: Globe, loginUrl: "https://www.amazon.com/ap/signin", category: "account" },
  { key: "dropbox", label: "Dropbox", Icon: SiDropbox, loginUrl: "https://www.dropbox.com/login", category: "account" },

  // Subscription
  { key: "netflix", label: "Netflix", Icon: SiNetflix, loginUrl: "https://www.netflix.com/login", category: "subscription" },
  { key: "spotify", label: "Spotify", Icon: SiSpotify, loginUrl: "https://accounts.spotify.com/login", category: "subscription" },

  // Money
  { key: "paypal", label: "PayPal", Icon: SiPaypal, loginUrl: "https://www.paypal.com/signin", category: "bank" },

  // Anything else
  { key: "other", label: "Other site", Icon: Globe, loginUrl: "", category: "account" },
];

// Fast lookups for the vault list (saved item -> brand mark) and the picker.
export const PROVIDER_BY_KEY = Object.fromEntries(PROVIDERS.map((p) => [p.key, p]));
export const providerIcon = (key) => PROVIDER_BY_KEY[key]?.Icon || Globe;

// Fallback used by the file vault / generic money rows when no brand applies.
export const GENERIC_ICONS = { Globe, Mail, Banknote };
