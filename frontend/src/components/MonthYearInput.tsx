"use client";
import { useState, useEffect } from "react";

interface MonthYearInputProps {
  value: string; // ISO format: yyyy-mm-dd (always 1st of month)
  onChange: (value: string) => void;
  className?: string;
}

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export function MonthYearInput({ value, onChange, className }: MonthYearInputProps) {
  const parseDate = (iso: string) => {
    if (!iso) return { month: "", year: "" };
    const parts = iso.split("-");
    if (parts.length >= 2) {
      return { month: String(parseInt(parts[1])), year: parts[0] };
    }
    return { month: "", year: "" };
  };

  const [month, setMonth] = useState(() => parseDate(value).month);
  const [year, setYear] = useState(() => parseDate(value).year);

  useEffect(() => {
    const parsed = parseDate(value);
    setMonth(parsed.month);
    setYear(parsed.year);
  }, [value]);

  const emitChange = (m: string, y: string) => {
    const mm = m.padStart(2, "0");
    const yyyy = y;
    if (m && y && y.length === 4 && !isNaN(Number(y))) {
      const iso = `${yyyy}-${mm}-01`;
      const d = new Date(iso);
      if (!isNaN(d.getTime())) {
        onChange(iso);
      }
    }
  };

  const handleMonthChange = (m: string) => {
    setMonth(m);
    emitChange(m, year);
  };

  const handleYearChange = (y: string) => {
    const digits = y.replace(/\D/g, "").slice(0, 4);
    setYear(digits);
    if (digits.length === 4) emitChange(month, digits);
  };

  return (
    <div className={`flex gap-2 ${className ?? ""}`}>
      <select
        value={month}
        onChange={e => handleMonthChange(e.target.value)}
        className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <option value="">Mês</option>
        {MESES.map((nome, i) => (
          <option key={i + 1} value={String(i + 1)}>{nome}</option>
        ))}
      </select>
      <input
        type="text"
        inputMode="numeric"
        value={year}
        onChange={e => handleYearChange(e.target.value)}
        placeholder="Ano"
        maxLength={4}
        className="w-20 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      />
    </div>
  );
}
