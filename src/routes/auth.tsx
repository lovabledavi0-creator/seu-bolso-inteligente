import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";
import { Eye, EyeOff, Loader2, Wallet, Mail } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Bolso Sem Neura" },
      { name: "description", content: "Acesse sua conta no Bolso Sem Neura." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [showPwd, setShowPwd] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [nome, setNome] = useState("");
  const [aceito, setAceito] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [user, loading, navigate]);

  const pwdValid = password.length >= 6;
  const canSignup = nome.trim() && /\S+@\S+\.\S+/.test(email) && pwdValid && password === confirm && aceito;
  const canLogin = /\S+@\S+\.\S+/.test(email) && password.length >= 1;

  const onLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!canLogin) return toast.error("Verifique e-mail e senha");
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Bem-vindo!");
    navigate({ to: "/" });
  };

  const onSignup = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSignup) return toast.error("Preencha todos os campos corretamente");
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { display_name: nome.trim() },
      },
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Conta criada! Verifique seu e-mail se necessário.");
    navigate({ to: "/" });
  };

  const onReset = async (e: FormEvent) => {
    e.preventDefault();
    if (!/\S+@\S+\.\S+/.test(email)) return toast.error("E-mail inválido");
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Enviamos um e-mail com instruções!");
    setMode("login");
  };

  const onGoogle = async () => {
    setSubmitting(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) { setSubmitting(false); return toast.error("Falha no login com Google"); }
    if (result.redirected) return;
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/15 border border-primary/30">
            <Wallet className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bolso Sem Neura</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === "reset" ? "Recupere o acesso à sua conta" : "Seu dinheiro e investimentos controlados por IA."}
            </p>
          </div>
        </div>

        <div className="rounded-3xl bg-surface border border-border p-6 space-y-4">
          {mode === "signup" && (
            <div>
              <h2 className="text-xl font-bold">Criar Conta</h2>
              <p className="text-sm text-muted-foreground">Comece a organizar suas finanças em menos de 1 minuto.</p>
            </div>
          )}
          {mode === "reset" && (
            <div>
              <h2 className="text-xl font-bold">Recuperar senha</h2>
              <p className="text-sm text-muted-foreground">Enviaremos um link para o seu e-mail.</p>
            </div>
          )}

          <form onSubmit={mode === "login" ? onLogin : mode === "signup" ? onSignup : onReset} className="space-y-3">
            {mode === "signup" && (
              <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo (como te chamamos?)"
                className="w-full h-12 rounded-2xl bg-background border border-border px-4 outline-none focus:border-primary" />
            )}

            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" autoComplete="email"
              className="w-full h-12 rounded-2xl bg-background border border-border px-4 outline-none focus:border-primary" />

            {mode !== "reset" && (
              <div className="relative">
                <input type={showPwd ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  className="w-full h-12 rounded-2xl bg-background border border-border px-4 pr-12 outline-none focus:border-primary" />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label="Ver senha">
                  {showPwd ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            )}

            {mode === "signup" && (
              <>
                <input type={showPwd ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirmar senha"
                  className="w-full h-12 rounded-2xl bg-background border border-border px-4 outline-none focus:border-primary" />
                <div className="text-xs space-y-1 px-1">
                  <p className={pwdValid ? "text-primary" : "text-muted-foreground"}>✓ Mínimo 6 caracteres</p>
                  {confirm && (
                    <p className={password === confirm ? "text-primary" : "text-destructive"}>
                      {password === confirm ? "✓ Senhas conferem" : "✗ Senhas diferentes"}
                    </p>
                  )}
                </div>
                <label className="flex items-start gap-2 text-sm text-muted-foreground cursor-pointer pt-1">
                  <input type="checkbox" checked={aceito} onChange={(e) => setAceito(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-[var(--color-primary)]" />
                  <span>Aceito os Termos de Uso e Política de Privacidade</span>
                </label>
              </>
            )}

            <button type="submit"
              disabled={submitting || (mode === "signup" && !canSignup) || (mode === "login" && !canLogin)}
              className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition">
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> :
                mode === "login" ? "Entrar" : mode === "signup" ? "Criar Minha Conta" : <><Mail className="h-4 w-4" /> Enviar link</>}
            </button>

            {mode === "login" && (
              <button type="button" onClick={() => setMode("reset")} className="w-full text-center text-sm text-muted-foreground hover:text-foreground">
                Esqueceu sua senha?
              </button>
            )}
          </form>

          {mode !== "reset" && (
            <>
              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">ou entre com</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <button onClick={onGoogle} disabled={submitting}
                className="w-full h-12 rounded-2xl bg-white text-gray-900 font-semibold flex items-center justify-center gap-2 hover:bg-gray-100 transition disabled:opacity-50">
                <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Continuar com o Google
              </button>
            </>
          )}
        </div>

        {/* Alternância */}
        <div className="text-center text-sm text-muted-foreground">
          {mode === "login" && (
            <button onClick={() => setMode("signup")}>Não tem uma conta? <span className="text-primary font-semibold">Cadastre-se</span></button>
          )}
          {mode === "signup" && (
            <button onClick={() => setMode("login")}>Já tem uma conta? <span className="text-primary font-semibold">Faça Login</span></button>
          )}
          {mode === "reset" && (
            <button onClick={() => setMode("login")}>Voltar para <span className="text-primary font-semibold">Login</span></button>
          )}
        </div>
      </div>
    </div>
  );
}
