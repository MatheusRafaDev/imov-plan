"use client";

import React from "react";
import { SimulacaoSummary } from "@/types/simulacao";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/card";
import { Check, Coins, TrendingUp, CalendarCheck, Clock, Target, Wallet } from "lucide-react";
import { formatDate, formatCurrency } from "@/utils/formatters";
import { Currency } from "@/components/ui/Currency";

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

  // Quando não atingiu a meta, usa dataPrevistaAlvo diretamente (mesma lógica do planejamento)
  // para garantir consistência entre as páginas
  if (summary.dataPrevistaAlvo) {
    return {
      value: `Estimativa: ${formatDate(summary.dataPrevistaAlvo)}`,
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
  const progressPercent = ((summary.totalAcumulado / summary.totalNecessario) * 100).toFixed(1);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <StatCard
        label="Atinge a meta em"
        value={metaCard.value}
        icon={metaCard.icon}
        variant={metaCard.variant}
        subtitle={metaCard.subtitle}
      />

      <StatCard
        label="Progresso inicial da meta"
        value={`${formatCurrency(summary.totalAcumulado)} de ${formatCurrency(summary.totalNecessario)}`}
        icon={<Target className="w-3.5 h-3.5" />}
        variant="default"
        subtitle={`${progressPercent}% alcançado`}
      />

      <Card className="p-6 border-border/50 rounded-xl">
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-display text-lg font-medium">Resumo Financeiro</h3>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-border/40">
            <span className="text-muted-foreground text-sm">Total Acumulado</span>
            <span className="font-medium text-primary">
              <Currency value={summary.totalAcumulado} />
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-border/40">
            <span className="text-muted-foreground text-sm">Total Investido</span>
            <span className="font-medium">
              <Currency value={summary.totalInvestido} />
            </span>
          </div>

          <div className="flex justify-between items-center py-2">
            <span className="text-muted-foreground text-sm">Lucro Líquido</span>
            <span className="font-medium text-success">
              +<Currency value={summary.lucroLiquido} />
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
