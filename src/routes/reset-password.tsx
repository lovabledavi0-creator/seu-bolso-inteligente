import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Redefinir senha — Bolso Sem Neura" }] }),
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase handles the recovery token automatically on URL hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => subscription.unsubscribe();
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (pwd.length < 6) return toast.error("Senha precisa de pelo menos 6 caracteres");
    if (pwd !== confirm) return toast.error("As senhas não conferem");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Senha atualizada!");
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-5">
      <div className="w-full max-w-md rounded-3xl bg-surface border border-border p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-primary/15 flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Definir nova senha</h1>
            <p className="text-sm text-muted-foreground">Escolha uma senha segura.</p>
          </div>
        </div>

        {!ready ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Validando link de recuperação...</p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="relative">
              <input type={show ? "text" : "password"} value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="Nova senha"
                className="w-full h-12 rounded-2xl bg-background border border-border px-4 pr-12 outline-none focus:border-primary" />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <input type={show ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirmar senha"
              className="w-full h-12 rounded-2xl bg-background border border-border px-4 outline-none focus:border-primary" />
            <button disabled={loading} className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Salvar nova senha"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
