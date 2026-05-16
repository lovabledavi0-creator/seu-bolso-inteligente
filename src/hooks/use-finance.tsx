import { createContext, useContext, useEffect, useState, type ReactNode, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { fetchCotacoes, type Cotacao, getNomeAtivo } from "@/lib/cotacoes";

export type Transacao = {
  id: string;
  user_id: string;
  tipo: "receita" | "despesa";
  valor: number;
  descricao: string;
  categoria: string;
  data: string;
};

export type Investimento = {
  id: string;
  user_id: string;
  ticker: string;
  nome: string | null;
  quantidade: number;
  preco_medio: number;
  data_compra: string;
};

export type Meta = {
  id: string;
  user_id: string;
  nome: string;
  valor_alvo: number;
  valor_atual: number;
  data_limite: string | null;
};

type FinanceCtx = {
  transacoes: Transacao[];
  investimentos: Investimento[];
  metas: Meta[];
  cotacoes: Record<string, Cotacao>;
  loading: boolean;

  // derivados
  receitasMes: number;
  despesasMes: number;
  saldoConta: number;
  patrimonioInvestido: number;
  totalInvestido: number;
  rentabilidade: number;     // valor
  rentabilidadePct: number;  // %
  saldoTotal: number;

  // ações
  addTransacao: (t: Omit<Transacao, "id" | "user_id" | "data"> & { data?: string }) => Promise<void>;
  removeTransacao: (id: string) => Promise<void>;
  addInvestimento: (i: Omit<Investimento, "id" | "user_id" | "nome">) => Promise<void>;
  removeInvestimento: (id: string) => Promise<void>;
  addMeta: (m: { nome: string; valor_alvo: number; data_limite?: string | null }) => Promise<void>;
  updateMetaProgresso: (id: string, valor: number) => Promise<void>;
  removeMeta: (id: string) => Promise<void>;
  refreshCotacoes: () => Promise<void>;
};

const Ctx = createContext<FinanceCtx | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [investimentos, setInvestimentos] = useState<Investimento[]>([]);
  const [metas, setMetas] = useState<Meta[]>([]);
  const [cotacoes, setCotacoes] = useState<Record<string, Cotacao>>({});
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    if (!user) {
      setTransacoes([]); setInvestimentos([]); setMetas([]); setLoading(false);
      return;
    }
    setLoading(true);
    const [{ data: txs }, { data: invs }, { data: ms }] = await Promise.all([
      supabase.from("transacoes").select("*").order("data", { ascending: false }),
      supabase.from("investimentos").select("*").order("created_at", { ascending: false }),
      supabase.from("metas").select("*").order("created_at", { ascending: false }),
    ]);
    setTransacoes((txs ?? []) as Transacao[]);
    setInvestimentos((invs ?? []) as Investimento[]);
    setMetas((ms ?? []) as Meta[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Buscar cotações sempre que mudar a lista de ativos
  const refreshCotacoes = useCallback(async () => {
    const tickers = Array.from(new Set(investimentos.map((i) => i.ticker.toUpperCase())));
    if (!tickers.length) { setCotacoes({}); return; }
    const c = await fetchCotacoes(tickers);
    setCotacoes(c);
  }, [investimentos]);

  useEffect(() => {
    refreshCotacoes();
    const id = setInterval(refreshCotacoes, 30000);
    return () => clearInterval(id);
  }, [refreshCotacoes]);

  // --- ações ---
  const addTransacao: FinanceCtx["addTransacao"] = async (t) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("transacoes")
      .insert({ ...t, user_id: user.id, data: t.data ?? new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    setTransacoes((prev) => [data as Transacao, ...prev]);
  };

  const removeTransacao = async (id: string) => {
    const { error } = await supabase.from("transacoes").delete().eq("id", id);
    if (error) throw error;
    setTransacoes((prev) => prev.filter((t) => t.id !== id));
  };

  const addInvestimento: FinanceCtx["addInvestimento"] = async (i) => {
    if (!user) return;
    const nome = getNomeAtivo(i.ticker);
    const { data, error } = await supabase
      .from("investimentos")
      .insert({ ...i, ticker: i.ticker.toUpperCase(), nome, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    setInvestimentos((prev) => [data as Investimento, ...prev]);
  };

  const removeInvestimento = async (id: string) => {
    const { error } = await supabase.from("investimentos").delete().eq("id", id);
    if (error) throw error;
    setInvestimentos((prev) => prev.filter((i) => i.id !== id));
  };

  const addMeta: FinanceCtx["addMeta"] = async (m) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("metas")
      .insert({ ...m, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    setMetas((prev) => [data as Meta, ...prev]);
  };

  const updateMetaProgresso = async (id: string, valor: number) => {
    const { data, error } = await supabase
      .from("metas").update({ valor_atual: valor }).eq("id", id).select().single();
    if (error) throw error;
    setMetas((prev) => prev.map((m) => m.id === id ? (data as Meta) : m));
  };

  const removeMeta = async (id: string) => {
    const { error } = await supabase.from("metas").delete().eq("id", id);
    if (error) throw error;
    setMetas((prev) => prev.filter((m) => m.id !== id));
  };

  // --- derivados ---
  const derived = useMemo(() => {
    const now = new Date();
    const ehMesAtual = (d: string) => {
      const x = new Date(d);
      return x.getMonth() === now.getMonth() && x.getFullYear() === now.getFullYear();
    };
    const receitasMes = transacoes.filter((t) => t.tipo === "receita" && ehMesAtual(t.data)).reduce((s, t) => s + Number(t.valor), 0);
    const despesasMes = transacoes.filter((t) => t.tipo === "despesa" && ehMesAtual(t.data)).reduce((s, t) => s + Number(t.valor), 0);
    const saldoConta = transacoes.reduce((s, t) => s + (t.tipo === "receita" ? +t.valor : -t.valor), 0);

    const totalInvestido = investimentos.reduce((s, i) => s + Number(i.quantidade) * Number(i.preco_medio), 0);
    const patrimonioInvestido = investimentos.reduce((s, i) => {
      const preco = cotacoes[i.ticker.toUpperCase()]?.preco ?? Number(i.preco_medio);
      return s + Number(i.quantidade) * preco;
    }, 0);
    const rentabilidade = patrimonioInvestido - totalInvestido;
    const rentabilidadePct = totalInvestido > 0 ? (rentabilidade / totalInvestido) * 100 : 0;
    const saldoTotal = saldoConta + patrimonioInvestido;

    return { receitasMes, despesasMes, saldoConta, totalInvestido, patrimonioInvestido, rentabilidade, rentabilidadePct, saldoTotal };
  }, [transacoes, investimentos, cotacoes]);

  return (
    <Ctx.Provider value={{
      transacoes, investimentos, metas, cotacoes, loading,
      ...derived,
      addTransacao, removeTransacao, addInvestimento, removeInvestimento,
      addMeta, updateMetaProgresso, removeMeta, refreshCotacoes,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useFinance() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useFinance must be used within FinanceProvider");
  return c;
}
