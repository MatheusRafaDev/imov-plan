"use client";

import { useRef, useEffect } from "react";
import React from "react";
import { usePlanLogic } from "@/hooks/usePlanLogic";
import { Card } from "@/components/ui/card";
import { useRouter, usePathname } from "next/navigation";
import { navPorCenario } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ChartSkeleton } from "@/components/ui/ChartSkeleton";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { ResultadoPageSkeleton } from "@/components/Skeleton";
import { SummaryCards } from "./components/SummaryCards";
import { ParticipantsCard } from "./components/ParticipantsCard";
import { FinancialSummaryCard } from "./components/FinancialSummaryCard";

import { 
  extractSimulacaoSummary, 
  extractParticipantesSummary, 
  extractChartData 
} from "@/utils/simulacaoSelectors";

// Lazy load heavy components
const InvestmentChart = dynamic(() => import("./components/InvestmentChart").then(mod => ({ default: mod.InvestmentChart })), {
  loading: () => <ChartSkeleton />,
  ssr: false
});

const TabelaMesAMes = dynamic(() => import("@/components/TabelaMesAMes").then(mod => ({ default: mod.TabelaMesAMes })), {
  loading: () => <TableSkeleton />,
  ssr: false
});

export default function ResultadoPage() {
  const { 
    cenario,
    saveDraft, 
    mesesConcluidos, 
    backendData,
    calculating,
    isDraftLoading,
    progressoAtual
  } = usePlanLogic();

  const router = useRouter();
  const pathname = usePathname();
  const nav = navPorCenario[cenario] ?? navPorCenario.entrada;
  const currentStep = nav.findIndex(n => pathname?.startsWith(n.to)) + 1;
  const totalSteps = nav.length;

  // Save mesesConcluidos to database when it changes
  const isFirstRender = useRef(true);
  const prevMesesRef = useRef<number[]>(mesesConcluidos);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevMesesRef.current = mesesConcluidos;
      return;
    }

    const prev = prevMesesRef.current;
    const curr = mesesConcluidos;

    if (prev.length === curr.length && prev.every((v, i) => v === curr[i])) {
      return;
    }

    prevMesesRef.current = curr;
    saveDraft({ mesesConcluidos: curr });
  }, [mesesConcluidos, saveDraft]);

  // Extrair os dados estritamente da API através de seletores, sem refazer os cálculos localmente.
  const summary = extractSimulacaoSummary(backendData || null);
  const participantes = extractParticipantesSummary(backendData || null);
  const chartData = extractChartData(backendData || null);

  const isLoading = isDraftLoading || (calculating && !summary);

  // Se estiver carregando ou calculando sem dados prévios, exibir o skeleton animado
  if (isLoading) {
    return <ResultadoPageSkeleton />;
  }

  // Se não tem nenhum dado e não está mais carregando, mostrar estado vazio
  if (!summary || !backendData) {
    return (
      <div className="max-w-screen-2xl w-full mx-auto space-y-7 px-4 md:px-6 animate-fade-in-up">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-orange-500 font-medium mb-1">
            Etapa {currentStep > 0 ? currentStep : 4} de {totalSteps}
          </p>
          <h1 className="font-display text-3xl md:text-4xl mb-1.5 font-semibold text-foreground tracking-tight">
            Seu plano em números
          </h1>
          <p className="text-muted-foreground text-sm">
            Preencha as etapas anteriores para ver o resultado ou aguarde o cálculo.
          </p>
        </div>
        <Card className="p-8 text-center border-border/50">
          <p className="text-muted-foreground">Complete as etapas 1 a 3 primeiro.</p>
          <Button onClick={() => router.push("/app/imovel")} className="mt-4">
            Ir para Etapa 1
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-screen-2xl w-full mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between px-4 sm:px-6 md:px-8 animate-fade-in-up" style={{ animationDelay: "0ms" }}>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-orange-500 font-medium mb-1">
            Etapa {currentStep > 0 ? currentStep : 4} de {totalSteps}
          </p>
          <h1 className="font-display text-3xl md:text-4xl mb-1 font-normal text-foreground tracking-tight">
            Seu plano em números
          </h1>
          <p className="text-muted-foreground text-sm">
            O resultado de tudo o que você preencheu nas etapas anteriores.
          </p>
        </div>
      </div>

      {calculating && (
        <div className="flex items-center justify-center py-4 animate-fade-in">
          <LoadingSpinner size="md" text="Atualizando simulação..." />
        </div>
      )}

      {/* Summary Cards */}
      <div className="animate-fade-in-up px-4 sm:px-6 md:px-8" style={{ animationDelay: "100ms" }}>
        <SummaryCards summary={summary} progressoAtual={progressoAtual} />
      </div>

      {/* Investment Chart */}
      <div className="animate-fade-in-up px-4 sm:px-6 md:px-8" style={{ animationDelay: "150ms" }}>
        <InvestmentChart data={chartData} summary={summary} />
      </div>

      {/* Financial Summary & Participants */}
      <div className="grid lg:grid-cols-2 gap-4 animate-fade-in-up px-4 sm:px-6 md:px-8" style={{ animationDelay: "200ms" }}>
        <FinancialSummaryCard summary={summary} />
        <ParticipantsCard participantes={participantes} />
      </div>

      {/* Table */}
      <div className="animate-fade-in-up px-4 sm:px-6 md:px-8" style={{ animationDelay: "250ms" }}>
        {calculating ? <TableSkeleton /> : <TabelaMesAMes />}
      </div>
    </div>
  );
}
