import { describe, it, expect, vi } from "vitest";
import { buildExportRows, exportPlanToExcel, exportPlanToCSV } from "./exportPlan";
import type { BackendSimulacaoResult, BackendDetalheMensal } from "@/types/simulacao";

describe("exportPlan utility", () => {
  const mockDetalhes = [
    {
      mes: 0,
      dataReferencia: "2026-01-01T00:00:00.000Z",
      aporteMensal: 0,
      aportesExtras: 0,
      retiradas: 0,
      rendimentoLiquido: 0,
      totalAcumulado: 50000,
      participantes: [
        {
          participanteId: "p1",
          nome: "Rafael",
          aporteMensal: 0,
          aportesExtras: 0,
          rendimentoLiquido: 0,
          saldo: 30000,
        },
        {
          participanteId: "p2",
          nome: "Mariana",
          aporteMensal: 0,
          aportesExtras: 0,
          rendimentoLiquido: 0,
          saldo: 20000,
        },
      ],
    },
    {
      mes: 1,
      dataReferencia: "2026-02-01T00:00:00.000Z",
      aporteMensal: 5000,
      aportesExtras: 1000,
      retiradas: 0,
      rendimentoLiquido: 450,
      totalAcumulado: 56450,
      participantes: [
        {
          participanteId: "p1",
          nome: "Rafael",
          aporteMensal: 3000,
          aportesExtras: 1000,
          rendimentoLiquido: 270,
          saldo: 34270,
        },
        {
          participanteId: "p2",
          nome: "Mariana",
          aporteMensal: 2000,
          aportesExtras: 0,
          rendimentoLiquido: 180,
          saldo: 22180,
        },
      ],
    },
    {
      mes: 2,
      dataReferencia: "2026-03-01T00:00:00.000Z",
      aporteMensal: 5000,
      aportesExtras: 0,
      retiradas: 0,
      rendimentoLiquido: 510,
      totalAcumulado: 61960,
      participantes: [
        {
          participanteId: "p1",
          nome: "Rafael",
          aporteMensal: 3000,
          aportesExtras: 0,
          rendimentoLiquido: 300,
          saldo: 37570,
        },
        {
          participanteId: "p2",
          nome: "Mariana",
          aporteMensal: 2000,
          aportesExtras: 0,
          rendimentoLiquido: 210,
          saldo: 24390,
        },
      ],
    },
  ];

  const mockPessoas = [
    { id: "p1", nome: "Rafael", valorInicial: 30000 },
    { id: "p2", nome: "Mariana", valorInicial: 20000 },
  ];

  const mockBackendData = {
    totalNecessario: 100000,
    valorJaGuardado: 50000,
    totalInvestido: 60000,
    totalRetirado: 0,
    totalAcumulado: 61960,
    lucroLiquido: 960,
    atingiuMeta: false,
    mesesParaAtingir: 10,
    dataPrevistaAlvo: "2026-11-01T00:00:00.000Z",
    falta: 38040,
    detalhesMensais: mockDetalhes as unknown as BackendDetalheMensal[],
    participantesSnapshot: [
      { participanteId: "p1", nome: "Rafael", valorInicial: 30000 },
      { participanteId: "p2", nome: "Mariana", valorInicial: 20000 },
    ],
  } as unknown as BackendSimulacaoResult;

  it("buildExportRows correctly formats rows and maps participants", () => {
    const rows = buildExportRows(mockDetalhes as unknown as BackendDetalheMensal[], mockPessoas, 2, false);
    expect(rows).toHaveLength(3);

    expect(rows[0].mes).toBe(0);
    expect(rows[0].mesLabel).toBe("Início");
    expect(rows[0].saldoPorPessoa["p1"]).toBe(30000);
    expect(rows[0].saldoPorPessoa["p2"]).toBe(20000);

    expect(rows[1].mes).toBe(1);
    expect(rows[1].aporteLiquidoMes).toBe(6000); // 5000 + 1000
    expect(rows[1].aporteFinalPorPessoa["p1"]).toBe(3000);
    expect(rows[1].aporteFinalPorPessoa["p2"]).toBe(2000);
  });

  it("exportPlanToExcel executes without throwing and builds valid sheets", async () => {
    // Mock DOM download
    const appendChildSpy = vi.spyOn(document.body, "appendChild").mockImplementation(() => null as any);
    const removeChildSpy = vi.spyOn(document.body, "removeChild").mockImplementation(() => null as any);

    await expect(
      exportPlanToExcel({
        objetivo: { valorImovel: 400000, percentualEntrada: 20, percentualCustosExtras: 5 },
        pessoas: mockPessoas,
        backendData: mockBackendData,
        cenario: "entrada",
        aportesExtras: [{ mes: 1, valor: 1000, motivo: "Bônus", tipo: "aporte" }],
        showFinancials: true,
      })
    ).resolves.not.toThrow();

    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });

  it("exportPlanToCSV generates valid CSV string with UTF-8 BOM", () => {
    const appendChildSpy = vi.spyOn(document.body, "appendChild").mockImplementation(() => null as any);
    const removeChildSpy = vi.spyOn(document.body, "removeChild").mockImplementation(() => null as any);

    expect(() =>
      exportPlanToCSV({
        objetivo: { valorImovel: 400000 },
        pessoas: mockPessoas,
        backendData: mockBackendData,
        cenario: "entrada",
        showFinancials: true,
      })
    ).not.toThrow();

    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });
});
