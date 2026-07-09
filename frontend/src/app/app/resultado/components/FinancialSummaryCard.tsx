"use client";

import React from "react";
import { SimulacaoSummary } from "@/types/simulacao";
import { Card } from "@/components/ui/card";
import { Wallet } from "lucide-react";
import { Currency } from "@/components/ui/Currency";

interface FinancialSummaryCardProps {
  summary: SimulacaoSummary | null;
}

export function FinancialSummaryCard({ summary }: FinancialSummaryCardProps) {
  if (!summary) return null;

  return (
    <Card className="p-6 border-border/50 bg-secondary/20">
      <div className="flex items-center gap-2 mb-6">
        <Wallet className="w-5 h-5 text-muted-foreground" />
        <h3 className="font-display text-lg font-medium">Resumo Financeiro</h3>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center pb-4 border-b border-border/50">
          <span className="text-muted-foreground">Valor Inicial</span>
          <span className="font-medium"><Currency value={summary.valorJaGuardado} /></span>
        </div>
        
        <div className="flex justify-between items-center pb-4 border-b border-border/50">
          <span className="text-muted-foreground">Aportes Regulares + Extras</span>
          <span className="font-medium"><Currency value={summary.totalInvestido - summary.valorJaGuardado} /></span>
        </div>

        <div className="flex justify-between items-center pb-4 border-b border-border/50">
          <span className="text-muted-foreground">Rendimento Acumulado</span>
          <span className="font-medium text-green-600 dark:text-green-400">
            +<Currency value={summary.lucroLiquido} />
          </span>
        </div>

        <div className="flex justify-between items-center pt-2">
          <span className="text-muted-foreground font-medium">Saldo Final Acumulado</span>
          <span className="text-xl font-display font-medium text-primary">
            <Currency value={summary.totalAcumulado} />
          </span>
        </div>
      </div>
    </Card>
  );
}
