import { useState, type FormEvent } from "react";
import { useAuth } from "@/hooks/use-auth";
import { X, ShieldCheck, ShieldOff, LogOut, Mail, CheckCircle2, AlertCircle, User as UserIcon, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Mode = "menu" | "set" | "remove" | "profile";

export function SettingsSheet({ onClose }: { onClose: () => void }) {
  const { user, hasPin, setPin, removePin, signOut, displayName, profile, updateProfile } = useAuth();
  const [mode, setMode] = useState<Mode>("menu");
  const [pin, setPinValue] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const emailConfirmed = !!user?.email_confirmed_at;

  // Profile form
  const [nome, setNome] = useState(profile?.display_name ?? displayName ?? "");
  const [profissao, setProfissao] = useState(profile?.profissao ?? "");
  const [idade, setIdade] = useState(profile?.idade ? String(profile.idade) : "");

  const onSet = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^\d{4,6}$/.test(pin)) return toast.error("PIN deve ter 4 a 6 dígitos");
    if (pin !== confirm) return toast.error("Os PINs não conferem");
    setLoading(true);
    try { await setPin(pin); toast.success("PIN definido!"); setMode("menu"); setPinValue(""); setConfirm(""); }
    catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const onRemove = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const ok = await removePin(pin);
    setLoading(false);
    if (!ok) return toast.error("PIN incorreto");
    toast.success("PIN removido");
    setMode("menu"); setPinValue("");
  };

  const onProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return toast.error("Informe seu nome");
    const id = idade ? parseInt(idade, 10) : null;
    if (idade && (!id || id < 1 || id > 120)) return toast.error("Idade inválida");
    setLoading(true);
    try {
      await updateProfile({ display_name: nome.trim(), profissao: profissao.trim() || null, idade: id });
      toast.success("Perfil atualizado!");
      setMode("menu");
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const resendConfirm = async () => {
    if (!user?.email) return;
    const { error } = await supabase.auth.resend({ type: "signup", email: user.email,
      options: { emailRedirectTo: `${window.location.origin}/` } });
    if (error) return toast.error(error.message);
    toast.success("E-mail de confirmação reenviado!");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl bg-surface border border-border p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Configurações</h2>
            <p className="text-xs text-muted-foreground">{displayName} • {user?.email}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground"><X className="h-5 w-5" /></button>
        </div>

        {mode === "menu" && (
          <div className="space-y-3">
            <div className={`rounded-2xl border p-4 flex items-start gap-3 ${emailConfirmed ? "border-primary/30 bg-primary/5" : "border-destructive/30 bg-destructive/5"}`}>
              {emailConfirmed ? <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" /> : <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{emailConfirmed ? "E-mail verificado" : "E-mail não verificado"}</p>
                <p className="text-xs text-muted-foreground">{emailConfirmed ? "Sua conta está confirmada." : "Confirme seu e-mail para liberar todos os recursos."}</p>
                {!emailConfirmed && (
                  <button onClick={resendConfirm} className="mt-2 text-xs font-semibold text-primary flex items-center gap-1">
                    <Mail className="h-3 w-3" /> Reenviar e-mail de confirmação
                  </button>
                )}
              </div>
            </div>

            <button onClick={() => setMode("profile")}
              className="w-full rounded-2xl border border-border bg-background p-4 flex items-center gap-3 hover:border-primary transition">
              <UserIcon className="h-5 w-5 text-primary" />
              <div className="text-left flex-1">
                <p className="text-sm font-semibold">Personalizar perfil</p>
                <p className="text-xs text-muted-foreground">
                  {profile?.profissao || profile?.idade
                    ? `${profile?.profissao ?? "—"}${profile?.idade ? ` • ${profile.idade} anos` : ""}`
                    : "Nome, profissão e idade"}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>

            <button onClick={() => setMode(hasPin ? "remove" : "set")}
              className="w-full rounded-2xl border border-border bg-background p-4 flex items-center gap-3 hover:border-primary transition">
              {hasPin ? <ShieldOff className="h-5 w-5 text-destructive" /> : <ShieldCheck className="h-5 w-5 text-primary" />}
              <div className="text-left flex-1">
                <p className="text-sm font-semibold">{hasPin ? "Remover PIN de segurança" : "Definir PIN de segurança"}</p>
                <p className="text-xs text-muted-foreground">{hasPin ? "Desativa o bloqueio do app." : "Protege o app com um PIN de 4 a 6 dígitos."}</p>
              </div>
            </button>

            <button onClick={() => signOut()}
              className="w-full rounded-2xl border border-border bg-background p-4 flex items-center gap-3 hover:border-destructive transition">
              <LogOut className="h-5 w-5 text-destructive" />
              <div className="text-left flex-1">
                <p className="text-sm font-semibold">Sair da conta</p>
                <p className="text-xs text-muted-foreground">Encerra a sessão neste dispositivo.</p>
              </div>
            </button>
          </div>
        )}

        {mode === "profile" && (
          <form onSubmit={onProfile} className="space-y-3">
            <p className="text-sm text-muted-foreground">Como devemos te chamar? Personalize seu perfil.</p>
            <div>
              <label className="block text-xs text-muted-foreground px-1 mb-1">Nome (como você quer ser chamado)</label>
              <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Davi"
                className="w-full h-12 rounded-2xl bg-background border border-border px-4 outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground px-1 mb-1">Profissão</label>
              <input value={profissao} onChange={(e) => setProfissao(e.target.value)} placeholder="Ex: Desenvolvedor, Estudante..."
                className="w-full h-12 rounded-2xl bg-background border border-border px-4 outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground px-1 mb-1">Idade</label>
              <input value={idade} onChange={(e) => setIdade(e.target.value.replace(/\D/g, "").slice(0, 3))}
                inputMode="numeric" placeholder="Ex: 25"
                className="w-full h-12 rounded-2xl bg-background border border-border px-4 outline-none focus:border-primary" />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setMode("menu")} className="flex-1 h-12 rounded-2xl bg-background border border-border font-semibold">Cancelar</button>
              <button type="submit" disabled={loading} className="flex-1 h-12 rounded-2xl bg-primary text-primary-foreground font-bold disabled:opacity-50">
                {loading ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        )}

        {mode === "set" && (
          <form onSubmit={onSet} className="space-y-3">
            <p className="text-sm text-muted-foreground">Crie um PIN de 4 a 6 dígitos. Ele será pedido sempre que você abrir o app.</p>
            <input value={pin} onChange={(e) => setPinValue(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric" placeholder="Novo PIN" autoFocus
              className="w-full h-14 rounded-2xl bg-background border border-border text-center text-2xl tracking-[0.5em] font-bold outline-none focus:border-primary" />
            <input value={confirm} onChange={(e) => setConfirm(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric" placeholder="Confirmar PIN"
              className="w-full h-14 rounded-2xl bg-background border border-border text-center text-2xl tracking-[0.5em] font-bold outline-none focus:border-primary" />
            <div className="flex gap-2">
              <button type="button" onClick={() => setMode("menu")} className="flex-1 h-12 rounded-2xl bg-background border border-border font-semibold">Cancelar</button>
              <button type="submit" disabled={loading} className="flex-1 h-12 rounded-2xl bg-primary text-primary-foreground font-bold">Salvar PIN</button>
            </div>
          </form>
        )}

        {mode === "remove" && (
          <form onSubmit={onRemove} className="space-y-3">
            <p className="text-sm text-muted-foreground">Digite seu PIN atual para desativar a proteção.</p>
            <input value={pin} onChange={(e) => setPinValue(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric" placeholder="PIN atual" autoFocus
              className="w-full h-14 rounded-2xl bg-background border border-border text-center text-2xl tracking-[0.5em] font-bold outline-none focus:border-primary" />
            <div className="flex gap-2">
              <button type="button" onClick={() => setMode("menu")} className="flex-1 h-12 rounded-2xl bg-background border border-border font-semibold">Cancelar</button>
              <button type="submit" disabled={loading} className="flex-1 h-12 rounded-2xl bg-destructive text-destructive-foreground font-bold">Remover PIN</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
