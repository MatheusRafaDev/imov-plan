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
