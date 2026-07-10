"use client";

import React from "react";
import { formatCurrency } from "@/utils/formatters";

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  variant?: "default" | "primary" | "success" | "muted" | "accent";
  prefix?: string;
  className?: string;
  children?: React.ReactNode;
}

const variantStyles: Record<NonNullable<StatCardProps["variant"]>, string> = {
  default: "bg-card border-border/40",
  primary: "bg-primary/5 border-border/40",
  success: "bg-success/5 border-border/40",
  muted: "bg-secondary/30 border-border/40",
  accent: "bg-accent/5 border-accent/20",
};

const labelStyles: Record<NonNullable<StatCardProps["variant"]>, string> = {
  default: "text-muted-foreground",
  primary: "text-primary",
  success: "text-success",
  muted: "text-muted-foreground",
  accent: "text-accent",
};

const valueStyles: Record<NonNullable<StatCardProps["variant"]>, string> = {
  default: "text-foreground",
  primary: "text-primary",
  success: "text-success",
  muted: "text-foreground",
  accent: "text-accent",
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
}: StatCardProps) {
  const displayValue =
    typeof value === "number" ? formatCurrency(value) : value;

  return (
    <div
      className={`p-4 rounded-xl border flex flex-col justify-center transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${variantStyles[variant]} ${className}`}
    >
      <div
        className={`flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-medium mb-2 ${labelStyles[variant]}`}
      >
        {icon}
        {label}
      </div>
      <p className={`font-display text-2xl num leading-tight ${valueStyles[variant]}`}>
        {prefix}{displayValue}
      </p>
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}
