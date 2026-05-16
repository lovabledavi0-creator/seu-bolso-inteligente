export const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const pct = (n: number) =>
  `${n >= 0 ? "+" : ""}${n.toFixed(2).replace(".", ",")}%`;

export const ddmm = (date: string | Date) => {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
};
