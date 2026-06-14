// Popular providers the user can pick to auto-fill known details (login URL, label, platform
// key, brand mark + brand colour) so they only type a username + password.
//
// Icon = a verified react-icons/si brand mark where one ships in react-icons v5.6, else a
// lucide-react fallback (Globe / Mail / Banknote). NEVER an emoji.
// color = the brand's real colour. Left undefined for black/white brands (X, GitHub, Apple,
// TikTok, Steam) so they inherit the theme text colour and stay visible in light AND dark.

import {
  SiGmail, SiProtonmail, SiInstagram, SiFacebook, SiX, SiYoutube, SiGithub,
  SiReddit, SiNetflix, SiSpotify, SiApple, SiPaypal, SiWhatsapp, SiDiscord,
  SiDropbox, SiTelegram, SiIcloud, SiTiktok, SiSnapchat, SiPinterest, SiTwitch,
  SiCoinbase, SiBinance, SiGoogledrive, SiSlack, SiSteam,
} from "react-icons/si";
import { Globe, Mail, Banknote } from "lucide-react";

// SiLinkedin / SiAmazon do not ship in this react-icons version - fall back safely.
const SiLinkedin = Globe;

export const PROVIDERS = [
  // Email
  { key: "gmail", label: "Gmail", Icon: SiGmail, color: "#EA4335", loginUrl: "https://mail.google.com", category: "email" },
  { key: "outlook", label: "Outlook", Icon: Mail, color: "#0F6CBD", loginUrl: "https://outlook.live.com", category: "email" },
  { key: "proton", label: "Proton Mail", Icon: SiProtonmail, color: "#6D4AFF", loginUrl: "https://mail.proton.me", category: "email" },

  // Social
  { key: "instagram", label: "Instagram", Icon: SiInstagram, color: "#E4405F", loginUrl: "https://www.instagram.com", category: "social" },
  { key: "facebook", label: "Facebook", Icon: SiFacebook, color: "#0866FF", loginUrl: "https://www.facebook.com", category: "social" },
  { key: "x", label: "X", Icon: SiX, color: undefined, loginUrl: "https://x.com", category: "social" },
  { key: "linkedin", label: "LinkedIn", Icon: SiLinkedin, color: "#0A66C2", loginUrl: "https://www.linkedin.com", category: "social" },
  { key: "youtube", label: "YouTube", Icon: SiYoutube, color: "#FF0000", loginUrl: "https://www.youtube.com", category: "social" },
  { key: "reddit", label: "Reddit", Icon: SiReddit, color: "#FF4500", loginUrl: "https://www.reddit.com", category: "social" },
  { key: "whatsapp", label: "WhatsApp", Icon: SiWhatsapp, color: "#25D366", loginUrl: "https://web.whatsapp.com", category: "social" },
  { key: "discord", label: "Discord", Icon: SiDiscord, color: "#5865F2", loginUrl: "https://discord.com/login", category: "social" },
  { key: "telegram", label: "Telegram", Icon: SiTelegram, color: "#26A5E4", loginUrl: "https://web.telegram.org", category: "social" },
  { key: "tiktok", label: "TikTok", Icon: SiTiktok, color: undefined, loginUrl: "https://www.tiktok.com/login", category: "social" },
  { key: "snapchat", label: "Snapchat", Icon: SiSnapchat, color: "#FFB000", loginUrl: "https://accounts.snapchat.com", category: "social" },
  { key: "pinterest", label: "Pinterest", Icon: SiPinterest, color: "#E60023", loginUrl: "https://www.pinterest.com/login", category: "social" },
  { key: "twitch", label: "Twitch", Icon: SiTwitch, color: "#9146FF", loginUrl: "https://www.twitch.tv/login", category: "social" },

  // Accounts / cloud
  { key: "github", label: "GitHub", Icon: SiGithub, color: undefined, loginUrl: "https://github.com/login", category: "account" },
  { key: "apple", label: "Apple ID", Icon: SiApple, color: undefined, loginUrl: "https://account.apple.com", category: "account" },
  { key: "icloud", label: "iCloud", Icon: SiIcloud, color: "#3693F3", loginUrl: "https://www.icloud.com", category: "account" },
  { key: "amazon", label: "Amazon", Icon: Globe, color: "#FF9900", loginUrl: "https://www.amazon.com/ap/signin", category: "account" },
  { key: "dropbox", label: "Dropbox", Icon: SiDropbox, color: "#0061FF", loginUrl: "https://www.dropbox.com/login", category: "account" },
  { key: "googledrive", label: "Google Drive", Icon: SiGoogledrive, color: "#1FA463", loginUrl: "https://drive.google.com", category: "account" },
  { key: "slack", label: "Slack", Icon: SiSlack, color: "#36C5F0", loginUrl: "https://slack.com/signin", category: "account" },
  { key: "steam", label: "Steam", Icon: SiSteam, color: undefined, loginUrl: "https://store.steampowered.com/login", category: "account" },

  // Subscription
  { key: "netflix", label: "Netflix", Icon: SiNetflix, color: "#E50914", loginUrl: "https://www.netflix.com/login", category: "subscription" },
  { key: "spotify", label: "Spotify", Icon: SiSpotify, color: "#1DB954", loginUrl: "https://accounts.spotify.com/login", category: "subscription" },

  // Money
  { key: "paypal", label: "PayPal", Icon: SiPaypal, color: "#0070BA", loginUrl: "https://www.paypal.com/signin", category: "bank" },
  { key: "coinbase", label: "Coinbase", Icon: SiCoinbase, color: "#0052FF", loginUrl: "https://www.coinbase.com/signin", category: "bank" },
  { key: "binance", label: "Binance", Icon: SiBinance, color: "#F0B90B", loginUrl: "https://accounts.binance.com/en/login", category: "bank" },

  // Anything else
  { key: "other", label: "Other site", Icon: Globe, color: undefined, loginUrl: "", category: "account" },
];

// Fast lookups for the vault list (saved item -> brand mark) and the picker.
export const PROVIDER_BY_KEY = Object.fromEntries(PROVIDERS.map((p) => [p.key, p]));
export const providerIcon = (key) => PROVIDER_BY_KEY[key]?.Icon || Globe;
export const providerColor = (key) => PROVIDER_BY_KEY[key]?.color;

// Fallback used by the file vault / generic money rows when no brand applies.
export const GENERIC_ICONS = { Globe, Mail, Banknote };
