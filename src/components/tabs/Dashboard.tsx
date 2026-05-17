import { useState, type FormEvent } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useFinance } from "@/hooks/use-finance";
import { parseTransacao } from "@/lib/parse-transaction";
import { brl, ddmm } from "@/lib/format";
import { Eye, EyeOff, Settings, Mic, Send, Sparkles, ShoppingCart, Car, Utensils, Home as HomeIcon, Heart, Briefcase, PiggyBank, Wallet, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { SettingsSheet } from "@/components/SettingsSheet";

const ICON_MAP: Record<string, typeof Car> = {
  Transporte: Car, Alimentação: Utensils, Lazer: Sparkles, Moradia: HomeIcon,
  Saúde: Heart, Salário: Briefcase, Freelance: Briefcase, Outros: ShoppingCart,
};

export function Dashboard() {
  const { displayName, user, hasPin } = useAuth();
  const { transacoes, receitasMes, despesasMes, saldoTotal, addTransacao } = useFinance();
  const [hide, setHide] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const emailUnconfirmed = user && !user.email_confirmed_at;

  const recentes = transacoes.slice(0, 5);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = parseTransacao(text);
    if (!parsed) {
      toast.error("Não consegui entender. Tente: \"40 reais com almoço\"");
      return;
    }
    setSending(true);
    try {
      await addTransacao(parsed);
      toast.success(
        `${parsed.tipo === "receita" ? "💰 Receita" : "💸 Despesa"} de ${brl(parsed.valor)} em ${parsed.categoria} registrada!`
      );
      setText("");
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao salvar");
    } finally {
      setSending(false);
    }
  };

  const valor = (v: number) => (hide ? "R$ ••••" : brl(v));

  return (
    <div className="space-y-5 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <p className="text-sm text-muted-foreground">Olá,</p>
          <h1 className="text-2xl font-bold leading-tight">{displayName || "Usuário"} 👋</h1>
        </div>
        <button
          onClick={() => setSettingsOpen(true)}
          className="relative h-11 w-11 rounded-full bg-surface flex items-center justify-center hover:bg-secondary transition"
          aria-label="Configurações"
        >
          <Settings className="h-5 w-5" />
          {(!hasPin || emailUnconfirmed) && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
          )}
        </button>
      </div>

      {emailUnconfirmed && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-destructive">Confirme seu e-mail</p>
            <p className="text-[11px] text-destructive/80">Enviamos um link para {user?.email}. Verifique sua caixa de entrada.</p>
          </div>
          <button onClick={() => setSettingsOpen(true)} className="text-[11px] font-semibold text-destructive underline">Reenviar</button>
        </div>
      )}

      {/* Card saldo */}
      <div className="rounded-3xl bg-gradient-to-br from-surface to-secondary p-6 border border-border shadow-xl">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Patrimônio total</span>
          <button onClick={() => setHide(!hide)} className="text-muted-foreground hover:text-foreground" aria-label="Mostrar/ocultar">
            {hide ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        <p className="mt-2 text-4xl font-bold tracking-tight">{valor(saldoTotal)}</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-primary/10 border border-primary/20 p-3">
            <p className="text-xs text-primary/90 font-medium">Receitas (mês)</p>
            <p className="text-lg font-bold text-primary">{valor(receitasMes)}</p>
          </div>
          <div className="rounded-2xl bg-destructive/10 border border-destructive/20 p-3">
            <p className="text-xs text-destructive/90 font-medium">Despesas (mês)</p>
            <p className="text-lg font-bold text-destructive">{valor(despesasMes)}</p>
          </div>
        </div>
      </div>

      {/* IA input */}
      <div className="rounded-3xl bg-surface border border-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">Entrada inteligente</p>
            <p className="text-xs text-muted-foreground">A IA categoriza pra você</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ex: 40 reais com almoço"
            className="flex-1 h-12 rounded-2xl bg-background border border-border px-4 text-base outline-none focus:border-primary"
          />
          <button type="button" className="h-12 w-12 rounded-2xl bg-background border border-border flex items-center justify-center hover:border-primary" aria-label="Microfone">
            <Mic className="h-5 w-5 text-muted-foreground" />
          </button>
          <button
            type="submit"
            disabled={sending || !text}
            className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 active:scale-95 transition"
            aria-label="Enviar"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>

      {/* Recentes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Transações recentes</h2>
          <span className="text-xs text-muted-foreground">{transacoes.length} total</span>
        </div>
        {recentes.length === 0 ? (
          <div className="rounded-3xl bg-surface border border-border p-8 text-center">
            <Wallet className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma transação ainda.<br/>Use o campo acima pra começar.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {recentes.map((t) => {
              const Icon = ICON_MAP[t.categoria] ?? (t.tipo === "receita" ? PiggyBank : ShoppingCart);
              const positive = t.tipo === "receita";
              return (
                <li key={t.id} className="flex items-center gap-3 rounded-2xl bg-surface border border-border p-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${positive ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{t.descricao}</p>
                    <p className="text-xs text-muted-foreground">{t.categoria} • {ddmm(t.data)}</p>
                  </div>
                  <p className={`font-bold ${positive ? "text-primary" : "text-destructive"}`}>
                    {positive ? "+" : "-"}{brl(Number(t.valor))}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {settingsOpen && <SettingsSheet onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
