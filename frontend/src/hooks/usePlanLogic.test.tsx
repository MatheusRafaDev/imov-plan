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
      prazoMaxMeses: 36,
      taxaCdiAnual: 10.5,
      tipoInvestimento: "cdb_100",
    });
    usePlanStore.getState().setPessoas([
      {
        id: "pessoa-joao",
        nome: "Joao silva",
        renda_mensal: 6000,
        renda_complementar: 0,
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
      prazoMaxMeses: 24,
    });
    usePlanStore.getState().setPessoas([
      {
        id: "p1",
        nome: "Pessoa 1",
        renda_mensal: 5000,
        renda_complementar: 0,
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
        renda_complementar: 0,
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

  it("deve calcular o progresso atual com base no dia de hoje da evolução diária quando existe simulação", async () => {
    const { getBrasiliaToday } = await import("@/utils/dates");
    const { SimulacaoService } = await import("@/services/SimulacaoService");
    const { ano, mes } = getBrasiliaToday();
    const dataRefAtual = `${ano}-${String(mes).padStart(2, "0")}-01`;

    const mockSim = {
      planoId: "plano-ativo-123",
      totalNecessario: 53750,
      valorJaGuardado: 42500,
      prazoMaxMeses: 36,
      taxaCdiAnual: 10.5,
      mesesParaAtingir: 4,
      atingiuMeta: false,
      detalhesMensais: [
        {
          mes: 0,
          dataReferencia: dataRefAtual,
          aporteMensal: 0,
          totalAcumulado: 42500,
          participantes: [
            { participanteId: "part1", nome: "Rafael", aporteMensal: 1535, saldo: 25000 },
            { participanteId: "part2", nome: "Maria", aporteMensal: 1535, saldo: 17500 },
          ],
        },
        {
          mes: 1,
          dataReferencia: dataRefAtual,
          aporteMensal: 3070,
          totalAcumulado: 45920,
          participantes: [
            { participanteId: "part1", nome: "Rafael", aporteMensal: 1535, saldo: 26710 },
            { participanteId: "part2", nome: "Maria", aporteMensal: 1535, saldo: 19210 },
          ],
        },
      ],
      participantesSnapshot: [
        { participanteId: "part1", nome: "Rafael", aporteMensal: 1535, valorInicial: 25000 },
        { participanteId: "part2", nome: "Maria", aporteMensal: 1535, valorInicial: 17500 },
      ],
    };

    vi.mocked(SimulacaoService.getUltimaSimulacao).mockResolvedValue(mockSim as any);
    queryClient.setQueryData(["simulacao", "plano-ativo-123"], mockSim);

    usePlanStore.getState().setPlanoId("plano-ativo-123");
    usePlanStore.getState().setObjetivo({
      valorImovel: 500000,
      valorJaGuardado: 42500,
      taxaCdiAnual: 10.5,
      tipoInvestimento: "cdb_100",
    });
    usePlanStore.getState().setPessoas([
      { id: "part1", nome: "Rafael", renda_mensal: 5000, renda_complementar: 0, gastos_mensais: 2000, aporte_mensal: 1535, diaAporte: 5, valorInicial: 25000 },
      { id: "part2", nome: "Maria", renda_mensal: 5000, renda_complementar: 0, gastos_mensais: 2000, aporte_mensal: 1535, diaAporte: 5, valorInicial: 17500 },
    ]);
    usePlanStore.getState().setMesesConcluidos([]);

    const { result } = renderHook(() => usePlanLogic(), { wrapper });

    // O progresso atual deve refletir o dia de hoje (superior a 42.500 e <= 45.920)
    expect(result.current.progressoAtual).toBeGreaterThan(42500);
    expect(result.current.progressoAtual).toBeLessThanOrEqual(45920);
    expect(result.current.progressoAtualPorPessoa["part1"]).toBeGreaterThan(25000);
    expect(result.current.progressoAtualPorPessoa["part2"]).toBeGreaterThan(17500);
  });
});
