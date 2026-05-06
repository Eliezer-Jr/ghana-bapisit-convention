import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { clearPortalSession, getPortalMinister, getPortalToken, PORTAL_MINISTER_KEY, PORTAL_TOKEN_KEY, PortalMinister } from "@/lib/portalApi";

interface PortalAuthCtx {
  token: string | null;
  minister: PortalMinister | null;
  setSession: (token: string, minister: PortalMinister) => void;
  signOut: () => void;
  loading: boolean;
}

const Ctx = createContext<PortalAuthCtx | undefined>(undefined);

export function PortalAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [minister, setMinister] = useState<PortalMinister | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setToken(getPortalToken());
    setMinister(getPortalMinister());
    setLoading(false);
  }, []);

  const setSession = (t: string, m: PortalMinister) => {
    localStorage.setItem(PORTAL_TOKEN_KEY, t);
    localStorage.setItem(PORTAL_MINISTER_KEY, JSON.stringify(m));
    setToken(t);
    setMinister(m);
  };
  const signOut = () => {
    clearPortalSession();
    setToken(null);
    setMinister(null);
  };
  return <Ctx.Provider value={{ token, minister, setSession, signOut, loading }}>{children}</Ctx.Provider>;
}

export function usePortalAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePortalAuth outside provider");
  return v;
}
