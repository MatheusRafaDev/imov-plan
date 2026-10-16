export function parseBackendDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const dateOnly = value.match(/^\d{4}-\d{2}-\d{2}$/) ? `${value}T12:00:00` : value;
  const parsed = new Date(dateOnly);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function toLocalDateIso(value: string | Date | null | undefined): string | null {
  const parsed = parseBackendDate(value);
  if (!parsed) return null;

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Retorna ano, mês (1-12) e dia atual estritamente no fuso horário oficial de Brasília (America/Sao_Paulo).
 * Evita divergências de cálculo e virada de dia/mês entre diferentes dispositivos (ex: Desktop vs Mobile).
 */
export function getBrasiliaToday(): { ano: number; mes: number; dia: number; dataStr: string } {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const formatted = formatter.format(new Date());
    const [anoStr, mesStr, diaStr] = formatted.split("-");
    const ano = parseInt(anoStr, 10);
    const mes = parseInt(mesStr, 10);
    const dia = parseInt(diaStr, 10);
    if (!isNaN(ano) && !isNaN(mes) && !isNaN(dia)) {
      return { ano, mes, dia, dataStr: formatted };
    }
  } catch {
    // fallback if Intl timeZone is not supported
  }
  const now = new Date();
  const ano = now.getFullYear();
  const mes = now.getMonth() + 1;
  const dia = now.getDate();
  const dataStr = `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
  return { ano, mes, dia, dataStr };
}

