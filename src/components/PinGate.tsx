import { useState, type FormEvent } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Lock, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function PinGate() {
  const { unlockWithPin, signOut, displayName } = useAuth();
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^\d{4,6}$/.test(pin)) return toast.error("Digite seu PIN (4 a 6 dígitos)");
    setLoading(true);
    const ok = await unlockWithPin(pin);
    setLoading(false);
    if (!ok) { setPin(""); return toast.error("PIN incorreto"); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-5">
      <div className="w-full max-w-md rounded-3xl bg-surface border border-border p-6 space-y-5">
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 border border-primary/30">
            <Lock className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold">Olá, {displayName || "tudo bem"}?</h1>
          <p className="text-sm text-muted-foreground">Digite seu PIN de segurança para continuar.</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            autoFocus
            placeholder="• • • •"
            className="w-full h-16 rounded-2xl bg-background border border-border text-center text-3xl tracking-[0.6em] font-bold outline-none focus:border-primary"
          />
          <button disabled={loading} className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center disabled:opacity-50">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Desbloquear"}
          </button>
          <button type="button" onClick={() => signOut()} className="w-full text-sm text-muted-foreground flex items-center justify-center gap-2 pt-1">
            <LogOut className="h-4 w-4" /> Sair da conta
          </button>
        </form>
      </div>
    </div>
  );
}
