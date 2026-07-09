import React from "react";
import { formatCurrency } from "@/utils/formatters";

interface CurrencyProps {
  value: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export function Currency({ value, className = "", prefix = "", suffix = "" }: CurrencyProps) {
  return (
    <span className={`num ${className}`}>
      {prefix}
      {formatCurrency(value)}
      {suffix}
    </span>
  );
}
