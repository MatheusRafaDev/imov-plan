"use client";

import { useRef, useEffect } from "react";
import React from "react";
import { usePlanLogic } from "@/hooks/usePlanLogic";;
import { Card } from "@/components/ui/card";
import { useRouter, usePathname } from "next/navigation";
import { navPorCenario } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ChartSkeleton } from "@/components/ui/ChartSkeleton";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { SummaryCards } from "./components/SummaryCards";
import { ParticipantsCard } from "./components/ParticipantsCard";
import { FinancialSummaryCard } from "./components/FinancialSummaryCard";
import { RefreshCw } from "lucide-react";
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
    objetivo, 
    pessoas, 
    saveDraft, 
    mesesConcluidos, 
    backendData,
    calcularBackend,
    calculating,
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

  // Se não tem nenhum dado, mostrar estado vazio
  if (!summary || !backendData) {
    return (
      <div className="max-w-screen-2xl w-full mx-auto space-y-7 px-4 md:px-6">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-1">Etapa {currentStep > 0 ? currentStep : 4} de {totalSteps}</p>
          <h1 className="font-display text-3xl md:text-4xl mb-1.5 font-light">Seu plano em números</h1>
          <p className="text-muted-foreground text-sm">Preencha as etapas anteriores para ver o resultado ou aguarde o cálculo.</p>
        </div>
        <Card className="p-8 text-center border-border/50">
          <p className="text-muted-foreground">Complete as etapas 1 a 3 primeiro.</p>
          <Button onClick={() => router.push("/app/imovel")} className="mt-4">Ir para Etapa 1</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-screen-2xl w-full mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between px-4 sm:px-6 md:px-8">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-1">Etapa {currentStep > 0 ? currentStep : 4} de {totalSteps}</p>
          <h1 className="font-display text-3xl md:text-4xl mb-1 font-light">Seu plano em números</h1>
          <p className="text-muted-foreground text-sm">O resultado de tudo o que você preencheu nas etapas anteriores.</p>
        </div>
      </div>

      {calculating && (
        <div className="flex items-center justify-center py-6">
          <LoadingSpinner size="md" text="Carregando simulação salva..." />
        </div>
      )}

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both px-4 sm:px-6 md:px-8">
        <SummaryCards summary={summary} />
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-both px-4 sm:px-6 md:px-8">
        <InvestmentChart data={chartData} summary={summary} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both px-4 sm:px-6 md:px-8">
        <FinancialSummaryCard summary={summary} />
        <ParticipantsCard participantes={participantes} totalAcumulado={summary.totalAcumulado} />
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both">
        <TabelaMesAMes />
      </div>
    </div>
  );
}
