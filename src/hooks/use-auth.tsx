import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { hashPin, PIN_UNLOCKED_KEY } from "@/lib/pin";

export type Profile = {
  display_name: string;
  profissao: string | null;
  idade: number | null;
};

type AuthCtx = {
  user: User | null;
  session: Session | null;
  displayName: string;
  profile: Profile | null;
  loading: boolean;
  hasPin: boolean;
  pinUnlocked: boolean;
  unlockWithPin: (pin: string) => Promise<boolean>;
  setPin: (pin: string) => Promise<void>;
  removePin: (pin: string) => Promise<boolean>;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pinHash, setPinHash] = useState<string | null>(null);
  const [pinUnlocked, setPinUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (uid: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("display_name, security_pin_hash, profissao, idade")
      .eq("id", uid)
      .maybeSingle();
    const d = data as any;
    if (d?.display_name) setDisplayName(d.display_name);
    setProfile({
      display_name: d?.display_name ?? "",
      profissao: d?.profissao ?? null,
      idade: d?.idade ?? null,
    });
    const hash = d?.security_pin_hash ?? null;
    setPinHash(hash);
    if (!hash) setPinUnlocked(true);
    else setPinUnlocked(sessionStorage.getItem(PIN_UNLOCKED_KEY) === uid);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setTimeout(() => loadProfile(s.user.id), 0);
      } else {
        setDisplayName("");
        setProfile(null);
        setPinHash(null);
        setPinUnlocked(false);
        sessionStorage.removeItem(PIN_UNLOCKED_KEY);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) loadProfile(data.session.user.id);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshProfile = async () => { if (user) await loadProfile(user.id); };

  const updateProfile = async (patch: Partial<Profile>) => {
    if (!user) throw new Error("Não autenticado");
    const { error } = await supabase.from("profiles").update(patch as any).eq("id", user.id);
    if (error) throw error;
    if (patch.display_name) setDisplayName(patch.display_name);
    setProfile((p) => ({ ...(p ?? { display_name: "", profissao: null, idade: null }), ...patch }));
  };

  const unlockWithPin = async (pin: string) => {
    if (!user || !pinHash) return false;
    const h = await hashPin(pin, user.id);
    if (h === pinHash) {
      setPinUnlocked(true);
      sessionStorage.setItem(PIN_UNLOCKED_KEY, user.id);
      return true;
    }
    return false;
  };

  const setPin = async (pin: string) => {
    if (!user) throw new Error("Não autenticado");
    if (!/^\d{4,6}$/.test(pin)) throw new Error("PIN deve ter 4 a 6 dígitos");
    const h = await hashPin(pin, user.id);
    const { error } = await supabase.from("profiles").update({ security_pin_hash: h }).eq("id", user.id);
    if (error) throw error;
    setPinHash(h);
    setPinUnlocked(true);
    sessionStorage.setItem(PIN_UNLOCKED_KEY, user.id);
  };

  const removePin = async (pin: string) => {
    if (!user || !pinHash) return false;
    const ok = (await hashPin(pin, user.id)) === pinHash;
    if (!ok) return false;
    const { error } = await supabase.from("profiles").update({ security_pin_hash: null }).eq("id", user.id);
    if (error) throw error;
    setPinHash(null);
    setPinUnlocked(true);
    sessionStorage.removeItem(PIN_UNLOCKED_KEY);
    return true;
  };

  const signOut = async () => {
    sessionStorage.removeItem(PIN_UNLOCKED_KEY);
    await supabase.auth.signOut();
  };

  return (
    <Ctx.Provider value={{
      user, session, displayName, profile, loading,
      hasPin: !!pinHash, pinUnlocked,
      unlockWithPin, setPin, removePin,
      updateProfile, refreshProfile, signOut,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
