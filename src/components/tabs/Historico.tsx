import { useMemo, useState } from "react";
import { useFinance } from "@/hooks/use-finance";
import { brl, ddmm } from "@/lib/format";
import { Trash2 } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "sonner";

const CATEGORIAS = ["Todas", "Alimentação", "Transporte", "Lazer", "Moradia", "Saúde", "Salário", "Outros"];
const PERIODOS = ["Este Mês", "Últimos 30 dias", "Tudo"] as const;
const CHART_COLORS = ["#00E676", "#FF5252", "#FFB300", "#29B6F6", "#AB47BC", "#FF7043", "#66BB6A", "#8E8E93"];

export function Historico() {
  const { transacoes, removeTransacao } = useFinance();
  const [cat, setCat] = useState("Todas");
  const [periodo, setPeriodo] = useState<(typeof PERIODOS)[number]>("Este Mês");

  const filtradas = useMemo(() => {
    const now = new Date();
    return transacoes.filter((t) => {
      if (cat !== "Todas" && t.categoria !== cat) return false;
      const d = new Date(t.data);
      if (periodo === "Este Mês") {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      if (periodo === "Últimos 30 dias") {
        return (now.getTime() - d.getTime()) <= 30 * 24 * 60 * 60 * 1000;
      }
      return true;
    });
  }, [transacoes, cat, periodo]);

  const chartData = useMemo(() => {
    const map = new Map<string, number>();
    filtradas.filter((t) => t.tipo === "despesa").forEach((t) => {
      map.set(t.categoria, (map.get(t.categoria) ?? 0) + Number(t.valor));
    });
    return Array.from(map, ([name, value]) => ({ name, value }));
  }, [filtradas]);

  const totalDespesas = chartData.reduce((s, d) => s + d.value, 0);

  const onDelete = async (id: string) => {
    try { await removeTransacao(id); toast.success("Removida"); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-5 pb-6">
      <div>
        <h1 className="text-2xl font-bold pt-2">Histórico</h1>
        <p className="text-sm text-muted-foreground">Veja, filtre e analise seus gastos.</p>
      </div>

      {/* Filtros */}
      <div className="space-y-2">
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          {PERIODOS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`shrink-0 px-4 h-9 rounded-full text-sm font-medium border transition ${
                periodo === p ? "bg-primary text-primary-foreground border-primary" : "bg-surface text-muted-foreground border-border"
              }`}
            >{p}</button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          {CATEGORIAS.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`shrink-0 px-4 h-9 rounded-full text-sm font-medium border transition ${
                cat === c ? "bg-foreground text-background border-foreground" : "bg-surface text-muted-foreground border-border"
              }`}
            >{c}</button>
          ))}
        </div>
      </div>

      {/* Gráfico */}
      <div className="rounded-3xl bg-surface border border-border p-5">
        <h2 className="text-base font-bold mb-2">Gastos por categoria</h2>
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Sem despesas no período</p>
        ) : (
          <div className="flex items-center gap-4">
            <div className="w-32 h-32 shrink-0">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={chartData} dataKey="value" innerRadius={32} outerRadius={60} paddingAngle={2}>
                    {chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#1A1A1E", border: "1px solid #2a2a2e", borderRadius: 12 }} formatter={(v: number) => brl(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="flex-1 space-y-1.5">
              {chartData.map((d, i) => {
                const pct = (d.value / totalDespesas) * 100;
                return (
                  <li key={d.name} className="text-sm">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                        {d.name}
                      </span>
                      <span className="text-muted-foreground">{pct.toFixed(0)}%</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Lista */}
      <div>
        <h2 className="text-base font-bold mb-3">{filtradas.length} transações</h2>
        <ul className="space-y-2">
          {filtradas.map((t) => {
            const positive = t.tipo === "receita";
            return (
              <li key={t.id} className="flex items-center gap-3 rounded-2xl bg-surface border border-border p-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{t.descricao}</p>
                  <p className="text-xs text-muted-foreground">{t.categoria} • {ddmm(t.data)}</p>
                </div>
                <p className={`font-bold ${positive ? "text-primary" : "text-destructive"}`}>
                  {positive ? "+" : "-"}{brl(Number(t.valor))}
                </p>
                <button onClick={() => onDelete(t.id)} className="h-9 w-9 rounded-xl hover:bg-destructive/15 text-muted-foreground hover:text-destructive flex items-center justify-center" aria-label="Excluir">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
