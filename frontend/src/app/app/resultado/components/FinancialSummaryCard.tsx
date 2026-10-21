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
    <Card className="p-6 border-border/50 rounded-xl">
      <div className="flex items-center gap-2 mb-6">
        <Wallet className="w-5 h-5 text-muted-foreground" />
        <h3 className="font-display text-lg font-medium">Resumo Financeiro</h3>
      </div>

      <div className="space-y-1">
        <div className="flex flex-wrap justify-between items-center gap-2 py-4 border-b border-border/40">
          <span className="text-muted-foreground">Valor Inicial</span>
          <span className="font-medium"><Currency value={summary.valorJaGuardado} /></span>
        </div>
        
        <div className="flex flex-wrap justify-between items-center gap-2 py-4 border-b border-border/40">
          <span className="text-muted-foreground">Aportes Regulares + Extras</span>
          <span className="font-medium"><Currency value={summary.totalInvestido - summary.valorJaGuardado} /></span>
        </div>

        <div className="flex flex-wrap justify-between items-center gap-2 py-4 border-b border-border/40">
          <span className="text-muted-foreground">Rendimento Acumulado</span>
          <span className="font-medium text-success bg-success/10 border border-success/20 px-2.5 py-1 rounded-md text-sm">
            +<Currency value={summary.lucroLiquido} />
          </span>
        </div>

        {summary.totalRetirado != null && summary.totalRetirado > 0 ? (
          <div className="flex flex-wrap justify-between items-center gap-2 py-4 border-b border-border/40">
            <span className="text-muted-foreground">Total Retirado</span>
            <span className="font-medium text-destructive bg-destructive/10 border border-destructive/20 px-2.5 py-1 rounded-md text-sm">
              -<Currency value={summary.totalRetirado} />
            </span>
          </div>
        ) : null}

        <div className="flex flex-wrap justify-between items-center gap-2 pt-5">
          <span className="text-muted-foreground font-medium">Saldo Final Acumulado</span>
          <span className="text-xl md:text-2xl font-display font-medium text-primary">
            <Currency value={summary.totalAcumulado} />
          </span>
        </div>
      </div>
    </Card>
  );
}
