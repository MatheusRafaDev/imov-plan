import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePlanLogic } from "./usePlanLogic";
import { usePlanStore } from "@/store/usePlanStore";

vi.mock("@/services/PlanService", () => ({
  PlanService: {
    getDraft: vi.fn().mockResolvedValue(null),
    saveDraft: vi.fn().mockResolvedValue("draft-123"),
  },
}));

vi.mock("@/services/SimulacaoService", () => ({
  SimulacaoService: {
    getUltimaSimulacao: vi.fn().mockResolvedValue(null),
    calcularSimulacao: vi.fn().mockResolvedValue(null),
  },
}));

describe("usePlanLogic - progressoAtual no primeiro mês e em nova criação", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    usePlanStore.getState().reset();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("não deve calcular rendimento CDI nem aplicar aporte na conta no primeiro mês ou na criação de novo imóvel", () => {
    // Configura o store como na criação de um novo imóvel/plano
    usePlanStore.getState().setPlanoId("plano-novo-123");
    usePlanStore.getState().setObjetivo({
      valorImovel: 500000,
      percentualEntrada: 20,
      percentualCustosExtras: 5,
      valorJaGuardado: 50000,
      prazoMeses: 36,
      taxaCdiAnual: 10.5,
      tipoInvestimento: "cdb_100",
    });
    usePlanStore.getState().setPessoas([
      {
        id: "pessoa-joao",
        nome: "Joao silva",
        renda_mensal: 6000,
        gastos_mensais: 4000,
        aporte_mensal: 2000,
        diaAporte: 1, // Dia 1 configurado
        valorInicial: 50000,
        valorAtual: 50000,
      },
    ]);
    usePlanStore.getState().setMesesConcluidos([]);

    const { result } = renderHook(() => usePlanLogic(), { wrapper });

    // O progresso deve ser exatamente os R$ 50.000 guardados informados
    // e NÃO 52.297,54 (que seria 50.000 + aporte de 2.000 + rendimento CDI)
    expect(result.current.progressoAtual).toBe(50000);
    expect(result.current.progressoAtualPorPessoa["pessoa-joao"]).toBe(50000);
  });

  it("deve somar o saldo base das pessoas sem inflar com rendimento quando nenhum mês foi concluído", () => {
    usePlanStore.getState().setPlanoId("plano-casal-123");
    usePlanStore.getState().setObjetivo({
      valorImovel: 600000,
      percentualEntrada: 20,
      percentualCustosExtras: 5,
      valorJaGuardado: 70000,
      prazoMeses: 24,
    });
    usePlanStore.getState().setPessoas([
      {
        id: "p1",
        nome: "Pessoa 1",
        renda_mensal: 5000,
        gastos_mensais: 3000,
        aporte_mensal: 2000,
        diaAporte: 1,
        valorInicial: 40000,
        valorAtual: 40000,
      },
      {
        id: "p2",
        nome: "Pessoa 2",
        renda_mensal: 4000,
        gastos_mensais: 2500,
        aporte_mensal: 1500,
        diaAporte: 5,
        valorInicial: 30000,
        valorAtual: 30000,
      },
    ]);
    usePlanStore.getState().setMesesConcluidos([]);

    const { result } = renderHook(() => usePlanLogic(), { wrapper });

    expect(result.current.progressoAtual).toBe(70000);
    expect(result.current.progressoAtualPorPessoa["p1"]).toBe(40000);
    expect(result.current.progressoAtualPorPessoa["p2"]).toBe(30000);
  });
});
