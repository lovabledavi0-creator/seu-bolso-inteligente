// Mock cotações — preparado para trocar por Brapi.dev / HG Brasil no futuro.
// Para integrar real: const r = await fetch(`https://brapi.dev/api/quote/${tickers}?token=...`);

const MOCK: Record<string, { nome: string; preco: number }> = {
  MXRF11: { nome: "Maxi Renda FII", preco: 10.15 },
  PETR4: { nome: "Petrobras PN", preco: 38.42 },
  ITUB4: { nome: "Itaú Unibanco PN", preco: 33.18 },
  VALE3: { nome: "Vale ON", preco: 62.7 },
  BBAS3: { nome: "Banco do Brasil ON", preco: 28.55 },
  HGLG11: { nome: "CSHG Logística FII", preco: 158.9 },
  KNRI11: { nome: "Kinea Renda Imob FII", preco: 142.3 },
  BBDC4: { nome: "Bradesco PN", preco: 14.6 },
  WEGE3: { nome: "WEG ON", preco: 51.2 },
  MGLU3: { nome: "Magazine Luiza ON", preco: 9.85 },
};

export type Cotacao = { ticker: string; nome: string; preco: number };

export async function fetchCotacoes(tickers: string[]): Promise<Record<string, Cotacao>> {
  // Simula latência de rede
  await new Promise((r) => setTimeout(r, 250));
  const out: Record<string, Cotacao> = {};
  for (const t of tickers) {
    const up = t.toUpperCase();
    const base = MOCK[up];
    if (base) {
      // pequena variação aleatória ±2% para sensação de "tempo real"
      const variacao = (Math.random() - 0.5) * 0.04;
      out[up] = { ticker: up, nome: base.nome, preco: +(base.preco * (1 + variacao)).toFixed(2) };
    } else {
      out[up] = { ticker: up, nome: up, preco: 10 + Math.random() * 50 };
    }
  }
  return out;
}

export function getNomeAtivo(ticker: string): string {
  return MOCK[ticker.toUpperCase()]?.nome ?? ticker.toUpperCase();
}
