"use client";

import React from "react";
import { SimulacaoSummary } from "@/types/simulacao";
import { StatCard } from "@/components/ui/StatCard";
import { Check, Coins, TrendingUp, CalendarCheck } from "lucide-react";
import { formatDate } from "@/utils/formatters";

interface SummaryCardsProps {
  summary: SimulacaoSummary | null;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  if (!summary) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Atinge a meta em"
        value={summary.atingiuMeta ? formatDate(summary.dataPrevistaAlvo) : "Não atingiu"}
        icon={<CalendarCheck className="w-3.5 h-3.5" />}
        variant={summary.atingiuMeta ? "success" : "muted"}
      />

      <StatCard
        label="Total Acumulado"
        value={summary.totalAcumulado}
        icon={<Coins className="w-3.5 h-3.5" />}
        variant="primary"
      />

      <StatCard
        label="Total Investido"
        value={summary.totalInvestido}
        icon={<TrendingUp className="w-3.5 h-3.5" />}
      />

      <StatCard
        label="Lucro Líquido"
        value={summary.lucroLiquido}
        icon={<Check className="w-3.5 h-3.5" />}
        variant="success"
        prefix="+"
      />
    </div>
  );
}
