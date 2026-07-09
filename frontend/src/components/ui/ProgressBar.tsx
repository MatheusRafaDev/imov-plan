import React from "react";
import { formatPercent } from "@/utils/formatters";

interface ProgressBarProps {
  value: number; // 0 to 100
  label?: string;
  showValue?: boolean;
  color?: string; // Tailwind class
  height?: string; // Tailwind class
  className?: string;
}

export function ProgressBar({
  value,
  label,
  showValue = true,
  color = "bg-primary",
  height = "h-2",
  className = "",
}: ProgressBarProps) {
  const clampedValue = Math.min(Math.max(value, 0), 100);

  return (
    <div className={`flex flex-col w-full ${className}`}>
      {(label || showValue) && (
        <div className="flex justify-between items-end mb-1 text-xs">
          {label && <span className="text-muted-foreground">{label}</span>}
          {showValue && (
            <span className="font-medium">{formatPercent(clampedValue)}</span>
          )}
        </div>
      )}
      <div className={`w-full bg-secondary overflow-hidden rounded-full ${height}`}>
        <div
          className={`${color} h-full transition-all duration-500 ease-out`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}
