import { useMemo, useState, type FormEvent } from "react";
import { useFinance } from "@/hooks/use-finance";
import { brl, pct } from "@/lib/format";
import { Plus, RefreshCw, Trash2, TrendingUp, X, Wallet } from "lucide-react";
import { toast } from "sonner";

export function Investimentos() {
  const { investimentos, cotacoes, totalInvestido, patrimonioInvestido, rentabilidade, rentabilidadePct, addInvestimento, removeInvestimento, refreshCotacoes } = useFinance();
  const [open, setOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [ticker, setTicker] = useState("");
  const [qtd, setQtd] = useState("");
  const [precoMedio, setPrecoMedio] = useState("");
  const [dataCompra, setDataCompra] = useState(new Date().toISOString().slice(0, 10));

  // Proventos simulados (mock baseado nos FIIs do usuário)
  const proventos = useMemo(() => {
    return investimentos
      .filter((i) => /11$/.test(i.ticker.toUpperCase()))
      .map((i) => ({
        ticker: i.ticker.toUpperCase(),
        valor: +(Number(i.quantidade) * 0.1).toFixed(2),
        data: new Date(),
      }));
  }, [investimentos]);
  const totalProventos = proventos.reduce((s, p) => s + p.valor, 0);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const q = parseFloat(qtd.replace(",", "."));
    const p = parseFloat(precoMedio.replace(",", "."));
    if (!ticker || !q || !p) return toast.error("Preencha todos os campos");
    try {
      await addInvestimento({ ticker: ticker.toUpperCase(), quantidade: q, preco_medio: p, data_compra: dataCompra });
      toast.success(`${ticker.toUpperCase()} adicionado!`);
      setOpen(false); setTicker(""); setQtd(""); setPrecoMedio("");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshCotacoes();
    setTimeout(() => setRefreshing(false), 400);
    toast.success("Cotações atualizadas");
  };

  const positivo = rentabilidade >= 0;

  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-2xl font-bold">Carteira B3</h1>
          <p className="text-sm text-muted-foreground">Seus ativos em tempo real.</p>
        </div>
        <button onClick={handleRefresh} className="h-11 w-11 rounded-2xl bg-surface border border-border flex items-center justify-center" aria-label="Atualizar">
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Card patrimônio */}
      <div className="rounded-3xl bg-gradient-to-br from-surface to-secondary p-6 border border-border">
        <p className="text-sm text-muted-foreground">Total investido</p>
        <p className="text-3xl font-bold mt-1">{brl(totalInvestido)}</p>
        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Posição atual</p>
            <p className="text-lg font-semibold">{brl(patrimonioInvestido)}</p>
          </div>
          <div className="text-right">
            <p className={`text-lg font-bold ${positivo ? "text-primary" : "text-destructive"}`}>
              {pct(rentabilidadePct)}
            </p>
            <p className={`text-xs font-medium ${positivo ? "text-primary" : "text-destructive"}`}>
              {positivo ? "+" : ""}{brl(rentabilidade)}
            </p>
          </div>
        </div>
      </div>

      <button onClick={() => setOpen(true)} className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 active:scale-[0.98]">
        <Plus className="h-5 w-5" /> Adicionar ativo
      </button>

      {/* Lista */}
      <div>
        <h2 className="text-base font-bold mb-3">Carteira</h2>
        {investimentos.length === 0 ? (
          <div className="rounded-3xl bg-surface border border-border p-10 text-center">
            <TrendingUp className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Sua carteira está vazia.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {investimentos.map((i) => {
              const ti = i.ticker.toUpperCase();
              const cot = cotacoes[ti]?.preco ?? Number(i.preco_medio);
              const nome = cotacoes[ti]?.nome ?? i.nome ?? ti;
              const qt = Number(i.quantidade);
              const pm = Number(i.preco_medio);
              const posicao = qt * cot;
              const investido = qt * pm;
              const lucro = posicao - investido;
              const lucroPct = (lucro / investido) * 100;
              const up = lucro >= 0;
              return (
                <li key={i.id} className="rounded-2xl bg-surface border border-border p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-base">{ti}</p>
                      <p className="text-xs text-muted-foreground truncate">{nome}</p>
                      <p className="text-xs text-muted-foreground mt-1">{qt.toLocaleString("pt-BR")} cotas</p>
                    </div>
                    <div className="text-center text-xs">
                      <p className="text-muted-foreground">PM</p>
                      <p className="font-medium">{brl(pm)}</p>
                      <p className="text-muted-foreground mt-1">Atual</p>
                      <p className={`font-medium ${up ? "text-primary" : "text-destructive"}`}>{brl(cot)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{brl(posicao)}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${up ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"}`}>
                        {up ? "+" : ""}{brl(lucro)}
                      </span>
                      <p className={`text-[11px] font-semibold mt-0.5 ${up ? "text-primary" : "text-destructive"}`}>{pct(lucroPct)}</p>
                    </div>
                  </div>
                  <button onClick={() => removeInvestimento(i.id).catch((e) => toast.error(e.message))}
                    className="mt-2 text-xs text-muted-foreground hover:text-destructive flex items-center gap-1">
                    <Trash2 className="h-3 w-3" /> remover
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Proventos */}
      <div className="rounded-3xl bg-surface border border-border p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold flex items-center gap-2"><Wallet className="h-4 w-4 text-primary" /> Proventos do mês</h2>
          <span className="text-primary font-bold">{brl(totalProventos)}</span>
        </div>
        {proventos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum provento esse mês.</p>
        ) : (
          <ul className="space-y-2">
            {proventos.map((p) => (
              <li key={p.ticker} className="flex justify-between text-sm">
                <span className="font-medium">{p.ticker}</span>
                <span className="text-primary font-semibold">+{brl(p.valor)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modal add ativo */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-3xl bg-surface border border-border p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Adicionar ativo</h2>
              <button onClick={() => setOpen(false)} className="text-muted-foreground"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={onSubmit} className="space-y-3">
              <input value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} placeholder="Ticker (ex: MXRF11, PETR4)" className="w-full h-12 rounded-2xl bg-background border border-border px-4 outline-none focus:border-primary uppercase font-bold tracking-wider" maxLength={6} />
              <input value={qtd} onChange={(e) => setQtd(e.target.value)} placeholder="Quantidade de cotas" inputMode="decimal" className="w-full h-12 rounded-2xl bg-background border border-border px-4 outline-none focus:border-primary" />
              <input value={precoMedio} onChange={(e) => setPrecoMedio(e.target.value)} placeholder="Preço médio (R$)" inputMode="decimal" className="w-full h-12 rounded-2xl bg-background border border-border px-4 outline-none focus:border-primary" />
              <input type="date" value={dataCompra} onChange={(e) => setDataCompra(e.target.value)} className="w-full h-12 rounded-2xl bg-background border border-border px-4 outline-none focus:border-primary text-muted-foreground" />
              <button type="submit" className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold">Adicionar à carteira</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
