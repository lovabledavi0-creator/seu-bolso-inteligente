import { useMemo, useState, type FormEvent } from "react";
import { useFinance, type Investimento } from "@/hooks/use-finance";
import { brl, pct } from "@/lib/format";
import { TIPOS, type TipoInvestimento } from "@/lib/cotacoes";
import { Plus, RefreshCw, Trash2, TrendingUp, TrendingDown, X, Wallet, Pencil, PiggyBank } from "lucide-react";
import { toast } from "sonner";

const fmtUSD = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
const fmtMoeda = (n: number, moeda: "BRL" | "USD") => moeda === "USD" ? fmtUSD(n) : brl(n);

export function Investimentos() {
  const {
    investimentos, cotacoes,
    totalInvestido, patrimonioInvestido, rentabilidade, rentabilidadePct,
    variacaoDia, variacaoDiaPct,
    addInvestimento, updateInvestimento, removeInvestimento, refreshCotacoes,
  } = useFinance();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Investimento | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [tipo, setTipo] = useState<TipoInvestimento>("acao_br");
  const [ticker, setTicker] = useState("");
  const [qtd, setQtd] = useState("");
  const [precoMedio, setPrecoMedio] = useState("");
  const [dataCompra, setDataCompra] = useState(new Date().toISOString().slice(0, 10));
  const [filtro, setFiltro] = useState<"todos" | TipoInvestimento>("todos");

  const tipoSelecionado = TIPOS.find((t) => t.value === tipo)!;
  const ehValorMonetario = tipo === "caixinha" || tipo === "renda_fixa";

  const proventos = useMemo(() => {
    return investimentos
      .filter((i) => i.tipo === "fii")
      .map((i) => ({ ticker: i.ticker.toUpperCase(), valor: +(Number(i.quantidade) * 0.1).toFixed(2) }));
  }, [investimentos]);
  const totalProventos = proventos.reduce((s, p) => s + p.valor, 0);

  const filtrados = filtro === "todos" ? investimentos : investimentos.filter((i) => i.tipo === filtro);

  // Resumo por tipo
  const porTipo = useMemo(() => {
    const map = new Map<TipoInvestimento, number>();
    for (const i of investimentos) {
      const cot = cotacoes[i.ticker.toUpperCase()];
      const preco = cot?.preco ?? Number(i.preco_medio);
      const v = Number(i.quantidade) * preco;
      map.set(i.tipo, (map.get(i.tipo) ?? 0) + v);
    }
    return Array.from(map.entries());
  }, [investimentos, cotacoes]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const q = parseFloat(qtd.replace(",", ".")) || 0;
    const p = parseFloat(precoMedio.replace(",", ".")) || 0;
    let tickerFinal = ticker.toUpperCase().trim();
    let quantidade = q;
    let preco = p;

    if (ehValorMonetario) {
      // Para caixinha/renda fixa: ticker é o nome (ex: "Poupança Nubank"), quantidade=1, preco_medio=valor
      if (!tickerFinal) return toast.error("Informe um nome para a aplicação");
      if (!p) return toast.error("Informe o valor guardado");
      quantidade = 1;
      preco = p;
    } else {
      if (!tickerFinal || !q || !p) return toast.error("Preencha ticker, quantidade e preço médio");
    }

    try {
      await addInvestimento({
        ticker: tickerFinal, quantidade, preco_medio: preco,
        data_compra: dataCompra, tipo, moeda: tipoSelecionado.moeda,
      });
      toast.success(`${tickerFinal} adicionado!`);
      setOpen(false); setTicker(""); setQtd(""); setPrecoMedio(""); setTipo("acao_br");
    } catch (e: any) { toast.error(e.message); }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshCotacoes();
    setTimeout(() => setRefreshing(false), 400);
    toast.success("Cotações atualizadas");
  };

  const positivo = rentabilidade >= 0;
  const diaPositivo = variacaoDia >= 0;

  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-2xl font-bold">Investimentos</h1>
          <p className="text-sm text-muted-foreground">B3, internacional, FIIs e caixinhas — em tempo real.</p>
        </div>
        <button onClick={handleRefresh} className="h-11 w-11 rounded-2xl bg-surface border border-border flex items-center justify-center" aria-label="Atualizar">
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Card patrimônio + variação do dia */}
      <div className="rounded-3xl bg-gradient-to-br from-surface to-secondary p-6 border border-border">
        <p className="text-sm text-muted-foreground">Total investido</p>
        <p className="text-3xl font-bold mt-1">{brl(totalInvestido)}</p>
        <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Posição atual</p>
            <p className="text-lg font-semibold">{brl(patrimonioInvestido)}</p>
            <p className={`text-xs font-bold mt-0.5 ${positivo ? "text-primary" : "text-destructive"}`}>
              {pct(rentabilidadePct)} total
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
              {diaPositivo ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />} Hoje
            </p>
            <p className={`text-lg font-bold ${diaPositivo ? "text-primary" : "text-destructive"}`}>
              {diaPositivo ? "+" : ""}{brl(variacaoDia)}
            </p>
            <p className={`text-xs font-semibold ${diaPositivo ? "text-primary" : "text-destructive"}`}>
              {pct(variacaoDiaPct)} no dia
            </p>
          </div>
        </div>

        {porTipo.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border space-y-1">
            <p className="text-xs text-muted-foreground mb-2">Distribuição por tipo</p>
            {porTipo.map(([t, v]) => {
              const meta = TIPOS.find((x) => x.value === t);
              const pctTipo = patrimonioInvestido > 0 ? (v / patrimonioInvestido) * 100 : 0;
              return (
                <div key={t} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{meta?.label ?? t}</span>
                  <span className="font-semibold">{brl(v)} <span className="text-muted-foreground">({pctTipo.toFixed(0)}%)</span></span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <button onClick={() => setOpen(true)} className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 active:scale-[0.98]">
        <Plus className="h-5 w-5" /> Adicionar investimento
      </button>

      {/* Filtros por tipo */}
      <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
        <FiltroChip ativo={filtro === "todos"} onClick={() => setFiltro("todos")}>Todos</FiltroChip>
        {TIPOS.map((t) => (
          <FiltroChip key={t.value} ativo={filtro === t.value} onClick={() => setFiltro(t.value)}>{t.label.split(" ")[0]}</FiltroChip>
        ))}
      </div>

      {/* Lista */}
      <div>
        <h2 className="text-base font-bold mb-3">Carteira ({filtrados.length})</h2>
        {filtrados.length === 0 ? (
          <div className="rounded-3xl bg-surface border border-border p-10 text-center">
            <TrendingUp className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum investimento neste filtro.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {filtrados.map((i) => {
              const ti = i.ticker.toUpperCase();
              const meta = TIPOS.find((x) => x.value === i.tipo);
              const ehCaixa = i.tipo === "caixinha" || i.tipo === "renda_fixa";
              const cot = cotacoes[ti];
              const moeda = (i.moeda as "BRL" | "USD") ?? "BRL";
              const preco = cot?.preco ?? Number(i.preco_medio);
              const varDia = cot?.variacaoDiaPct ?? 0;
              const qt = Number(i.quantidade);
              const pm = Number(i.preco_medio);
              const posicao = qt * preco;
              const investido = qt * pm;
              const lucro = posicao - investido;
              const lucroPct = investido > 0 ? (lucro / investido) * 100 : 0;
              const up = lucro >= 0;
              const upDia = varDia >= 0;

              return (
                <li key={i.id} className="rounded-2xl bg-surface border border-border p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-base">{ti}</p>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-background border border-border text-muted-foreground">
                          {meta?.label.split(" ")[0] ?? i.tipo}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{cot?.nome ?? i.nome ?? ti}</p>
                      {!ehCaixa && (
                        <p className="text-xs text-muted-foreground mt-1">{qt.toLocaleString("pt-BR")} cotas</p>
                      )}
                      {!ehCaixa && cot && (
                        <p className={`text-xs font-semibold mt-1 ${upDia ? "text-primary" : "text-destructive"}`}>
                          {upDia ? "▲" : "▼"} {pct(varDia)} hoje
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{fmtMoeda(posicao, moeda)}</p>
                      {!ehCaixa && (
                        <>
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${up ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"}`}>
                            {up ? "+" : ""}{fmtMoeda(lucro, moeda)}
                          </span>
                          <p className={`text-[11px] font-semibold mt-0.5 ${up ? "text-primary" : "text-destructive"}`}>{pct(lucroPct)}</p>
                        </>
                      )}
                      {ehCaixa && (
                        <p className="text-[11px] text-muted-foreground mt-1 flex items-center justify-end gap-1">
                          <PiggyBank className="h-3 w-3" /> guardado
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <button onClick={() => setEditing(i)}
                      className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                      <Pencil className="h-3 w-3" /> editar
                    </button>
                    <button onClick={() => removeInvestimento(i.id).catch((e) => toast.error(e.message))}
                      className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1">
                      <Trash2 className="h-3 w-3" /> remover
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Proventos */}
      <div className="rounded-3xl bg-surface border border-border p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold flex items-center gap-2"><Wallet className="h-4 w-4 text-primary" /> Proventos do mês (FIIs)</h2>
          <span className="text-primary font-bold">{brl(totalProventos)}</span>
        </div>
        {proventos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum FII na carteira.</p>
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

      {/* Modal add */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-3xl bg-surface border border-border p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Adicionar investimento</h2>
              <button onClick={() => setOpen(false)} className="text-muted-foreground"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={onSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-muted-foreground px-1 mb-1">Tipo de investimento</label>
                <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoInvestimento)}
                  className="w-full h-12 rounded-2xl bg-background border border-border px-4 outline-none focus:border-primary">
                  {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <p className="text-[11px] text-muted-foreground px-1 mt-1">{tipoSelecionado.descricao}</p>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground px-1 mb-1">
                  {ehValorMonetario ? "Nome da aplicação" : "Ticker"}
                </label>
                <input value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  placeholder={ehValorMonetario ? "Ex: POUPANCA NUBANK" : tipoSelecionado.descricao.split(",")[0]}
                  className="w-full h-12 rounded-2xl bg-background border border-border px-4 outline-none focus:border-primary uppercase font-bold tracking-wider"
                  maxLength={20} />
              </div>

              {!ehValorMonetario && (
                <div>
                  <label className="block text-xs text-muted-foreground px-1 mb-1">Quantidade de cotas</label>
                  <input value={qtd} onChange={(e) => setQtd(e.target.value)} placeholder="Ex: 100" inputMode="decimal"
                    className="w-full h-12 rounded-2xl bg-background border border-border px-4 outline-none focus:border-primary" />
                </div>
              )}

              <div>
                <label className="block text-xs text-muted-foreground px-1 mb-1">
                  {ehValorMonetario ? `Valor guardado (${tipoSelecionado.moeda === "USD" ? "US$" : "R$"})` : `Preço médio (${tipoSelecionado.moeda === "USD" ? "US$" : "R$"})`}
                </label>
                <input value={precoMedio} onChange={(e) => setPrecoMedio(e.target.value)}
                  placeholder={ehValorMonetario ? "Ex: 1500,00" : "Ex: 10,15"} inputMode="decimal"
                  className="w-full h-12 rounded-2xl bg-background border border-border px-4 outline-none focus:border-primary" />
              </div>

              <div>
                <label className="block text-xs text-muted-foreground px-1 mb-1">Data</label>
                <input type="date" value={dataCompra} onChange={(e) => setDataCompra(e.target.value)}
                  className="w-full h-12 rounded-2xl bg-background border border-border px-4 outline-none focus:border-primary text-muted-foreground" />
              </div>

              <button type="submit" className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold">
                Adicionar à carteira
              </button>
            </form>
          </div>
        </div>
      )}
      {editing && (
        <EditInvestModal inv={editing} onClose={() => setEditing(null)}
          onSave={async (patch) => {
            try {
              await updateInvestimento(editing.id, patch);
              toast.success(`${editing.ticker} atualizado!`);
              setEditing(null);
            } catch (e: any) { toast.error(e.message); }
          }} />
      )}
    </div>
  );
}

function FiltroChip({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`shrink-0 px-3 h-8 rounded-full text-xs font-semibold border transition ${ativo ? "bg-primary text-primary-foreground border-primary" : "bg-surface border-border text-muted-foreground"}`}>
      {children}
    </button>
  );
}

function EditInvestModal({ inv, onClose, onSave }: {
  inv: Investimento;
  onClose: () => void;
  onSave: (patch: { quantidade: number; preco_medio: number; data_compra: string }) => Promise<void>;
}) {
  const ehCaixa = inv.tipo === "caixinha" || inv.tipo === "renda_fixa";
  const [qtd, setQtd] = useState(String(inv.quantidade));
  const [pm, setPm] = useState(String(inv.preco_medio));
  const [data, setData] = useState((inv.data_compra ?? "").slice(0, 10));
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const q = ehCaixa ? 1 : parseFloat(qtd.replace(",", "."));
    const p = parseFloat(pm.replace(",", "."));
    if (!q || q <= 0) return toast.error("Quantidade inválida");
    if (!p || p <= 0) return toast.error("Valor inválido");
    setSaving(true);
    await onSave({ quantidade: q, preco_medio: p, data_compra: data });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl bg-surface border border-border p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Editar {inv.ticker}</h2>
            <p className="text-xs text-muted-foreground">{inv.nome ?? "Investimento"}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          {!ehCaixa && (
            <>
              <label className="block text-xs text-muted-foreground px-1">Quantidade de cotas</label>
              <input value={qtd} onChange={(e) => setQtd(e.target.value)} inputMode="decimal"
                className="w-full h-12 rounded-2xl bg-background border border-border px-4 outline-none focus:border-primary" />
            </>
          )}
          <label className="block text-xs text-muted-foreground px-1">{ehCaixa ? "Valor guardado" : "Preço médio"}</label>
          <input value={pm} onChange={(e) => setPm(e.target.value)} inputMode="decimal"
            className="w-full h-12 rounded-2xl bg-background border border-border px-4 outline-none focus:border-primary" />
          <label className="block text-xs text-muted-foreground px-1">Data</label>
          <input type="date" value={data} onChange={(e) => setData(e.target.value)}
            className="w-full h-12 rounded-2xl bg-background border border-border px-4 outline-none focus:border-primary text-muted-foreground" />
          <button type="submit" disabled={saving} className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold disabled:opacity-50">
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </form>
      </div>
    </div>
  );
}
