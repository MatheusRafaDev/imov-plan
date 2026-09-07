"use client";

import React from "react";
import { formatCurrency } from "@/utils/formatters";

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  variant?: "default" | "primary" | "success" | "muted" | "accent" | "warning";
  prefix?: string;
  className?: string;
  children?: React.ReactNode;
  subtitle?: string;
}

const variantStyles: Record<NonNullable<StatCardProps["variant"]>, string> = {
  default: "border-border/50",
  primary: "border-border/40",
  success: "border-success/20",
  muted:   "border-border/30",
  accent:  "border-accent/25",
  warning: "border-amber-500/25",
};

const labelStyles: Record<NonNullable<StatCardProps["variant"]>, string> = {
  default: "text-muted-foreground",
  primary: "text-muted-foreground",
  success: "text-success",
  muted:   "text-muted-foreground",
  accent:  "text-accent",
  warning: "text-amber-400",
};

const valueStyles: Record<NonNullable<StatCardProps["variant"]>, string> = {
  default: "text-foreground",
  primary: "text-foreground",
  success: "text-success",
  muted:   "text-muted-foreground",
  accent:  "text-accent",
  warning: "text-amber-300",
};

const iconBgStyles: Record<NonNullable<StatCardProps["variant"]>, string> = {
  default: "bg-white/5",
  primary: "bg-white/5",
  success: "bg-success/10",
  muted:   "bg-white/4",
  accent:  "bg-accent/10",
  warning: "bg-amber-400/10",
};

/**
 * StatCard - Componente genérico de card de estatística.
 * O valor (number | string) é passado pronto — sem cálculos aqui.
 */
export function StatCard({
  label,
  value,
  icon,
  variant = "default",
  prefix,
  className = "",
  children,
  subtitle,
}: StatCardProps) {
  const displayValue =
    typeof value === "number" ? formatCurrency(value) : value;

  return (
    <div
      className={`relative p-4 rounded-xl border overflow-hidden flex flex-col justify-center group transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card ${variantStyles[variant]} ${className}`}
      style={{ background: "hsl(222 40% 10% / 0.6)" }}
    >
      {/* Subtle hover glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: "hsl(43 96% 58% / 0.03)" }} />

      <div className={`relative flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold mb-2.5 ${labelStyles[variant]}`}>
        {icon && (
          <span className={`inline-flex items-center justify-center h-5 w-5 rounded-md ${iconBgStyles[variant]}`}>
            {icon}
          </span>
        )}
        {label}
      </div>
      <p className={`relative font-display text-xl md:text-2xl num leading-tight font-bold break-words ${valueStyles[variant]}`}>
        {prefix}{displayValue}
      </p>
      {subtitle && (
        <p className="relative mt-1.5 text-[11px] text-muted-foreground/70 leading-snug">{subtitle}</p>
      )}
      {children && <div className="relative mt-3">{children}</div>}
    </div>
  );
}
