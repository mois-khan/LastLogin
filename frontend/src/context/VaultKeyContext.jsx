import { createContext, useContext, useState, useCallback } from "react";
import { api } from "../lib/api.js";
import { genSalt, deriveKey, encryptJSON, decryptJSON } from "../lib/crypto.js";

// Holds the derived vault key IN MEMORY only — it is never written to disk,
// localStorage, or sent to the server. Locks on reload (you re-enter the passphrase).
const Ctx = createContext(null);

export function VaultKeyProvider({ children }) {
  const [key, setKey] = useState(null);
  const unlocked = !!key;

  const status = useCallback(async () => {
    const { data } = await api.get("/vault/key");
    return { needsSetup: !data.salt };
  }, []);

  // First time: create the master passphrase. Server gets only salt + a verifier blob.
  const setup = useCallback(async (passphrase) => {
    const salt = genSalt();
    const k = await deriveKey(passphrase, salt);
    const verifier = await encryptJSON({ v: "lastlogin-ok" }, k);
    await api.post("/vault/key", { salt, verifier });
    setKey(k);
  }, []);

  // Returning: derive the key, prove it against the verifier (throws if wrong).
  const unlock = useCallback(async (passphrase) => {
    const { data } = await api.get("/vault/key");
    if (!data.salt) throw new Error("no key set");
    const k = await deriveKey(passphrase, data.salt);
    await decryptJSON(data.verifier, k); // throws on a wrong passphrase
    setKey(k);
  }, []);

  const lock = useCallback(() => setKey(null), []);

  return (
    <Ctx.Provider value={{ key, unlocked, status, setup, unlock, lock }}>
      {children}
    </Ctx.Provider>
  );
}

export const useVaultKey = () => useContext(Ctx);
