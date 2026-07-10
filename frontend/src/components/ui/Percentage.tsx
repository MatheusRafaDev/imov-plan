import React from "react";
import { formatPercent } from "@/utils/formatters";

interface PercentageProps {
  value: number;
  digits?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  colorCoded?: boolean; // Se true, verde para >0, vermelho para <0
}

export function Percentage({
  value,
  digits = 1,
  className = "",
  prefix = "",
  suffix = "",
  colorCoded = false,
}: PercentageProps) {
  let colorClass = "";
  if (colorCoded) {
    if (value > 0) colorClass = "text-success";
    else if (value < 0) colorClass = "text-destructive";
  }

  return (
    <span className={`num ${colorClass} ${className}`}>
      {prefix}
      {formatPercent(value, digits)}
      {suffix}
    </span>
  );
}
