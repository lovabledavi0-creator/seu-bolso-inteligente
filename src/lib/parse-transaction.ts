export type ParsedTx = {
  tipo: "receita" | "despesa";
  valor: number;
  descricao: string;
  categoria: string;
};

const RECEITA_HINTS = ["recebi", "salário", "salario", "pix recebido", "ganhei", "entrou", "rendimento", "freela", "freelance", "venda"];
const CATEGORIAS: { keys: string[]; cat: string }[] = [
  { keys: ["uber", "99", "taxi", "ônibus", "onibus", "metrô", "metro", "gasolina", "combustível", "combustivel"], cat: "Transporte" },
  { keys: ["almoço", "almoco", "janta", "jantar", "café", "cafe", "lanche", "ifood", "mercado", "padaria", "restaurante", "pizza"], cat: "Alimentação" },
  { keys: ["cinema", "show", "netflix", "spotify", "bar", "balada", "game", "jogo"], cat: "Lazer" },
  { keys: ["aluguel", "luz", "água", "agua", "internet", "condomínio", "condominio", "conta"], cat: "Moradia" },
  { keys: ["farmácia", "farmacia", "remédio", "remedio", "médico", "medico", "consulta"], cat: "Saúde" },
  { keys: ["salário", "salario"], cat: "Salário" },
  { keys: ["freela", "freelance"], cat: "Freelance" },
];

export function parseTransacao(input: string): ParsedTx | null {
  const text = input.toLowerCase().trim();
  if (!text) return null;

  // Match value: "40", "40,50", "40.50", "R$ 40", "1500"
  const m = text.match(/(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)/);
  if (!m) return null;
  const valor = parseFloat(m[1].replace(",", "."));
  if (!valor || valor <= 0) return null;

  const isReceita = RECEITA_HINTS.some((k) => text.includes(k));
  const tipo: "receita" | "despesa" = isReceita ? "receita" : "despesa";

  let categoria = isReceita ? "Outros" : "Outros";
  for (const c of CATEGORIAS) {
    if (c.keys.some((k) => text.includes(k))) {
      categoria = c.cat;
      break;
    }
  }
  if (isReceita && categoria === "Outros") categoria = "Salário";

  // Descricao = remove valor e palavras de ligação
  let descricao = input
    .replace(/r\$\s*/i, "")
    .replace(/\b\d+(?:[.,]\d{1,2})?\b/, "")
    .replace(/\b(reais?|de|com|no|na|em|do|da|pra|para)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!descricao) descricao = categoria;
  descricao = descricao.charAt(0).toUpperCase() + descricao.slice(1);

  return { tipo, valor, descricao, categoria };
}
