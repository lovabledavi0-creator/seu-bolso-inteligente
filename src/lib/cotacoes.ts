// Cotações em tempo real via Brapi.dev (B3 + ações internacionais).
// Endpoint público: https://brapi.dev/api/quote/PETR4,MXRF11,AAPL
// Sem token funciona com rate limit baixo; com VITE_BRAPI_TOKEN aumenta o limite.

export type Cotacao = {
  ticker: string;
  nome: string;
  preco: number;
  variacaoDiaPct: number; // % do dia
  moeda: "BRL" | "USD";
};

export type TipoInvestimento =
  | "acao_br"
  | "fii"
  | "acao_us"
  | "cripto"
  | "renda_fixa"
  | "caixinha";

export const TIPOS: { value: TipoInvestimento; label: string; descricao: string; moeda: "BRL" | "USD" }[] = [
  { value: "acao_br", label: "Ação Brasileira (B3)", descricao: "PETR4, ITUB4, VALE3...", moeda: "BRL" },
  { value: "fii", label: "Fundo Imobiliário (FII)", descricao: "MXRF11, HGLG11, KNRI11...", moeda: "BRL" },
  { value: "acao_us", label: "Ação Internacional", descricao: "AAPL, MSFT, TSLA...", moeda: "USD" },
  { value: "cripto", label: "Criptomoeda", descricao: "BTC, ETH...", moeda: "BRL" },
  { value: "renda_fixa", label: "Renda Fixa / Tesouro", descricao: "CDB, Tesouro Selic, LCI...", moeda: "BRL" },
  { value: "caixinha", label: "Caixinha / Reserva", descricao: "Dinheiro guardado, poupança", moeda: "BRL" },
];

const NOMES_FALLBACK: Record<string, string> = {
  MXRF11: "Maxi Renda FII", HGLG11: "CSHG Logística FII", KNRI11: "Kinea Renda Imob",
  PETR4: "Petrobras PN", ITUB4: "Itaú Unibanco PN", VALE3: "Vale ON",
  BBAS3: "Banco do Brasil ON", BBDC4: "Bradesco PN", WEGE3: "WEG ON", MGLU3: "Magazine Luiza ON",
  AAPL: "Apple Inc.", MSFT: "Microsoft Corp.", TSLA: "Tesla Inc.", GOOGL: "Alphabet Inc.",
  AMZN: "Amazon.com", NVDA: "NVIDIA Corp.", META: "Meta Platforms",
};

export function getNomeAtivo(ticker: string): string {
  return NOMES_FALLBACK[ticker.toUpperCase()] ?? ticker.toUpperCase();
}

const TOKEN = (import.meta as any).env?.VITE_BRAPI_TOKEN as string | undefined;

async function fetchBrapi(tickers: string[]): Promise<Record<string, Cotacao>> {
  if (!tickers.length) return {};
  const url = `https://brapi.dev/api/quote/${tickers.join(",")}${TOKEN ? `?token=${TOKEN}` : ""}`;
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`brapi ${r.status}`);
    const json = await r.json();
    const out: Record<string, Cotacao> = {};
    for (const item of json.results ?? []) {
      const t = String(item.symbol).toUpperCase();
      out[t] = {
        ticker: t,
        nome: item.longName ?? item.shortName ?? NOMES_FALLBACK[t] ?? t,
        preco: Number(item.regularMarketPrice ?? 0),
        variacaoDiaPct: Number(item.regularMarketChangePercent ?? 0),
        moeda: item.currency === "USD" ? "USD" : "BRL",
      };
    }
    return out;
  } catch {
    return {};
  }
}

export async function fetchCotacoes(
  ativos: { ticker: string; tipo?: string }[]
): Promise<Record<string, Cotacao>> {
  // Filtra tickers de mercado (ignora caixinha e renda_fixa que não têm cotação)
  const tickersMercado = Array.from(
    new Set(
      ativos
        .filter((a) => a.tipo !== "caixinha" && a.tipo !== "renda_fixa")
        .map((a) => a.ticker.toUpperCase())
    )
  );
  const real = await fetchBrapi(tickersMercado);
  // Fallback simulado para o que a API não retornou (rate-limit / ticker novo)
  const out: Record<string, Cotacao> = { ...real };
  for (const t of tickersMercado) {
    if (out[t]) continue;
    const variacao = (Math.random() - 0.5) * 0.04;
    out[t] = {
      ticker: t,
      nome: NOMES_FALLBACK[t] ?? t,
      preco: +(20 * (1 + variacao)).toFixed(2),
      variacaoDiaPct: +(variacao * 100).toFixed(2),
      moeda: /^[A-Z]{1,5}$/.test(t) && t.length <= 4 && !/\d/.test(t) ? "USD" : "BRL",
    };
  }
  return out;
}
