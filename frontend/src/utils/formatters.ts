// ─── Utilitários de Formatação ────────────────────────────────────────────────
// Funções APENAS de formatação visual. Nunca deve realizar cálculos financeiros.

/** Formata um número como moeda BRL */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/** Formata um número como percentual */
export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

/** Formata uma data ISO em localidade pt-BR */
export function formatDate(isoDate: string, options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = { month: "long", year: "numeric" };
  return new Date(isoDate).toLocaleDateString("pt-BR", options ?? defaultOptions);
}

/** Formata uma data de referência mensal (ex: "jan. 2026") */
export function formatMonthYear(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
}

/** Retorna uma string de mês abreviado + ano (ex: "Jan 26") */
export function formatChartLabel(isoDate: string): string {
  return formatMonthYear(isoDate);
}
