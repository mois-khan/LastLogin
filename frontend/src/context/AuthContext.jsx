import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api.js";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("ll_user");
    return raw ? JSON.parse(raw) : null;
  });

  const persist = (token, user) => {
    localStorage.setItem("ll_token", token);
    localStorage.setItem("ll_user", JSON.stringify(user));
    setUser(user);
  };

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    persist(data.token, data.user);
  };
  const register = async (email, password, name) => {
    const { data } = await api.post("/auth/register", { email, password, name });
    persist(data.token, data.user);
  };
  const logout = () => {
    localStorage.removeItem("ll_token");
    localStorage.removeItem("ll_user");
    setUser(null);
  };

  // Merge fields into the cached user and persist (e.g. voiceId after cloning).
  const updateUser = (patch) => {
    setUser((u) => {
      const merged = { ...(u || {}), ...patch };
      localStorage.setItem("ll_user", JSON.stringify(merged));
      return merged;
    });
  };

  // gentle proof-of-life ping on app open
  useEffect(() => {
    if (user) api.post("/proof-of-life").catch(() => {});
  }, [user?.id]);

  return <AuthCtx.Provider value={{ user, login, register, logout, updateUser }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
