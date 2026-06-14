import { createContext, useContext, useState, useCallback } from "react";
import { api } from "../lib/api.js";
import { genSalt, deriveKey, encryptJSON, decryptJSON, genDek, importDek, wrapDek, unwrapDek } from "../lib/crypto.js";
import { split } from "../lib/shamir.js";

// Holds the vault's Data Encryption Key (DEK) IN MEMORY only. It is never written to
// disk/localStorage or sent to the server. The server stores only: a PBKDF2 salt, a tiny
// verifier blob, and the DEK *wrapped* by the passphrase-derived key - none of which it
// can open. Locks on reload (you re-enter the passphrase).
const Ctx = createContext(null);

// 2-of-3, mirroring the on-chain guardian quorum.
const SHARES = 3;
const THRESHOLD = 2;

export function VaultKeyProvider({ children }) {
  const [dek, setDek] = useState(null); // CryptoKey used to encrypt/decrypt items
  const [dekRaw, setDekRaw] = useState(null); // raw bytes, kept only to mint guardian codes
  const unlocked = !!dek;

  const status = useCallback(async () => {
    const { data } = await api.get("/vault/key");
    return { needsSetup: !data.salt };
  }, []);

  // First time: create the master passphrase + a fresh DEK. The server receives the salt,
  // a verifier blob, and the passphrase-wrapped DEK. Returns the guardian recovery codes
  // (Shamir shares of the DEK) for the owner to hand out - they are shown ONCE.
  const setup = useCallback(async (passphrase) => {
    const salt = genSalt();
    const kek = await deriveKey(passphrase, salt);
    const raw = genDek();
    const verifier = await encryptJSON({ v: "lastlogin-ok" }, kek);
    const wrappedDek = await wrapDek(raw, kek);
    await api.post("/vault/key", { salt, verifier, wrappedDek });
    setDek(await importDek(raw));
    setDekRaw(raw);
    return split(raw, SHARES, THRESHOLD); // ["1abc…", "2def…", "3ghi…"]
  }, []);

  // Returning: derive the key, prove it against the verifier, then unwrap the DEK.
  const unlock = useCallback(async (passphrase) => {
    const { data } = await api.get("/vault/key");
    if (!data.salt) throw new Error("no key set");
    const kek = await deriveKey(passphrase, data.salt);
    await decryptJSON(data.verifier, kek); // throws on a wrong passphrase
    const raw = await unwrapDek(data.wrappedDek, kek);
    setDek(await importDek(raw));
    setDekRaw(raw);
  }, []);

  // Re-mint the guardian recovery codes from the in-memory DEK (only while unlocked).
  const recoveryCodes = useCallback(() => (dekRaw ? split(dekRaw, SHARES, THRESHOLD) : null), [dekRaw]);

  const lock = useCallback(() => { setDek(null); setDekRaw(null); }, []);

  return (
    <Ctx.Provider value={{ dek, unlocked, status, setup, unlock, lock, recoveryCodes, threshold: THRESHOLD }}>
      {children}
    </Ctx.Provider>
  );
}

export const useVaultKey = () => useContext(Ctx);
