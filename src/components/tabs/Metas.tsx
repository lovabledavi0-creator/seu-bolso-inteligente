import { useState, type FormEvent } from "react";
import { useFinance } from "@/hooks/use-finance";
import { brl } from "@/lib/format";
import { Plus, Target, Trash2, X, Sparkles } from "lucide-react";
import { toast } from "sonner";

function mensagemIA(pct: number, restante: number, nome: string) {
  if (pct >= 100) return `🎉 Você bateu a meta de ${nome}! Hora de comemorar.`;
  if (pct >= 75) return `🔥 Quase lá! Faltam só ${brl(restante)}.`;
  if (pct >= 50) return `💪 Já passou da metade. Continue assim!`;
  if (pct >= 25) return `🌱 Bom começo! Mantenha o ritmo.`;
  return `🚀 Comece guardando um pouco hoje. Cada real conta.`;
}

export function Metas() {
  const { metas, addMeta, updateMetaProgresso, removeMeta } = useFinance();
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState("");

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const alvo = parseFloat(valor.replace(",", "."));
    if (!nome || !alvo) return toast.error("Preencha nome e valor");
    try {
      await addMeta({ nome, valor_alvo: alvo, data_limite: data || null });
      toast.success("Meta criada!");
      setOpen(false); setNome(""); setValor(""); setData("");
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-2xl font-bold">Metas</h1>
          <p className="text-sm text-muted-foreground">Defina, acompanhe, conquiste.</p>
        </div>
        <button onClick={() => setOpen(true)} className="h-11 px-4 rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center gap-2 active:scale-95 transition">
          <Plus className="h-4 w-4" /> Nova
        </button>
      </div>

      {metas.length === 0 ? (
        <div className="rounded-3xl bg-surface border border-border p-10 text-center">
          <Target className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma meta ativa.<br/>Clique em "Nova" pra criar a primeira.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {metas.map((m) => {
            const pct = Math.min(100, (Number(m.valor_atual) / Number(m.valor_alvo)) * 100);
            const restante = Math.max(0, Number(m.valor_alvo) - Number(m.valor_atual));
            return (
              <li key={m.id} className="rounded-3xl bg-surface border border-border p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-lg">{m.nome}</h3>
                    {m.data_limite && <p className="text-xs text-muted-foreground">Até {new Date(m.data_limite).toLocaleDateString("pt-BR")}</p>}
                  </div>
                  <button onClick={() => removeMeta(m.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold">{brl(Number(m.valor_atual))}</span>
                  <span className="text-muted-foreground">de {brl(Number(m.valor_alvo))}</span>
                </div>
                <div className="h-3 rounded-full bg-background overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex items-center gap-2 text-sm bg-primary/10 border border-primary/20 rounded-xl p-3">
                  <Sparkles className="h-4 w-4 text-primary shrink-0" />
                  <span>{mensagemIA(pct, restante, m.nome)}</span>
                </div>
                <button
                  onClick={() => {
                    const inp = prompt(`Atualizar valor guardado pra "${m.nome}":`, String(m.valor_atual));
                    if (inp == null) return;
                    const v = parseFloat(inp.replace(",", "."));
                    if (!isNaN(v)) updateMetaProgresso(m.id, v).catch((e) => toast.error(e.message));
                  }}
                  className="w-full h-10 rounded-xl bg-background border border-border text-sm font-medium hover:border-primary"
                >Atualizar progresso</button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-3xl bg-surface border border-border p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Nova meta</h2>
              <button onClick={() => setOpen(false)} className="text-muted-foreground"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={onSubmit} className="space-y-3">
              <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome (ex: Viagem para o Chile)" className="w-full h-12 rounded-2xl bg-background border border-border px-4 outline-none focus:border-primary" />
              <input value={valor} onChange={(e) => setValor(e.target.value)} placeholder="Valor alvo (R$)" inputMode="decimal" className="w-full h-12 rounded-2xl bg-background border border-border px-4 outline-none focus:border-primary" />
              <input type="date" value={data} onChange={(e) => setData(e.target.value)} className="w-full h-12 rounded-2xl bg-background border border-border px-4 outline-none focus:border-primary text-muted-foreground" />
              <button type="submit" className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold">Criar meta</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
