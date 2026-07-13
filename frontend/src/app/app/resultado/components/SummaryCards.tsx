"use client";

import React from "react";
import { SimulacaoSummary } from "@/types/simulacao";
import { StatCard } from "@/components/ui/StatCard";
import { Check, Coins, TrendingUp, CalendarCheck, Clock } from "lucide-react";
import { formatDate } from "@/utils/formatters";

interface SummaryCardsProps {
  summary: SimulacaoSummary | null;
}

/**
 * Resolve o valor e as props do card "Atinge a meta em" com base na projeção.
 *
 * Casos:
 * - atingiu       → data formatada, variant success
 * - estimativa    → "Estimativa: {data}", variant warning + subtitle
 * - impossivel    → mensagem de revisão, variant muted
 */
function resolveMetaCard(summary: SimulacaoSummary): {
  value: string;
  variant: "success" | "warning" | "muted";
  subtitle?: string;
  icon: React.ReactNode;
} {
  if (summary.atingiuMeta) {
    return {
      value: formatDate(summary.dataPrevistaAlvo),
      variant: "success",
      icon: <CalendarCheck className="w-3.5 h-3.5" />,
    };
  }

  const projecao = summary.projecaoDataMeta;

  if (projecao.tipo === "estimativa") {
    return {
      value: `Estimativa: ${formatDate(projecao.data)}`,
      variant: "warning",
      subtitle: "Mantendo os aportes e a rentabilidade atuais.",
      icon: <Clock className="w-3.5 h-3.5" />,
    };
  }

  // impossivel
  return {
    value: "Meta não atingível",
    variant: "muted",
    subtitle: "Considere aumentar aportes, ampliar o prazo ou revisar a rentabilidade.",
    icon: <CalendarCheck className="w-3.5 h-3.5" />,
  };
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  if (!summary) return null;

  const metaCard = resolveMetaCard(summary);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Atinge a meta em"
        value={metaCard.value}
        icon={metaCard.icon}
        variant={metaCard.variant}
        subtitle={metaCard.subtitle}
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
