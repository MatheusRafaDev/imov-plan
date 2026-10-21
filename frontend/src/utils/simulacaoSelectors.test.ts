import { describe, it, expect } from "vitest";
import { extractSaldoAtual, extractSimulacaoSummary } from "./simulacaoSelectors";
import { BackendSimulacaoResult } from "@/types/simulacao";
import { getBrasiliaToday } from "./dates";

describe("simulacaoSelectors - extractSaldoAtual", () => {
  it("deve retornar 0 quando result for nulo", () => {
    expect(extractSaldoAtual(null)).toBe(0);
  });

  it("deve retornar valorJaGuardado quando não houver detalhes mensais", () => {
    const sim: BackendSimulacaoResult = {
      id: "1",
      planejamentoId: "p1",
      geradoEm: "2026-10-01T00:00:00Z",
      origem: "teste",
      versao: 1,
      valorImovel: 250000,
      totalNecessario: 53750,
      valorJaGuardado: 42500,
      aporteMensalTotal: 3070,
      taxaCdiAnual: 10.5,
      percentualCdi: 100,
      mesesParaAtingir: 4,
      dataPrevistaAlvo: "2027-02-01",
      totalInvestido: 75230,
      totalAcumulado: 79287.92,
      lucroLiquido: 4057.92,
      atingiuMeta: true,
      falta: 0,
      detalhesMensais: [],
      participantesSnapshot: [],
    };

    expect(extractSaldoAtual(sim)).toBe(42500);
  });

  it("deve calcular o saldo do dia corrente quando o mês atual estiver presente nos detalhes mensais", () => {
    const { ano, mes } = getBrasiliaToday();
    const dataRefAtual = `${ano}-${String(mes).padStart(2, "0")}-01`;

    const sim: BackendSimulacaoResult = {
      id: "1",
      planejamentoId: "p1",
      geradoEm: "2026-10-01T00:00:00Z",
      origem: "teste",
      versao: 1,
      valorImovel: 250000,
      totalNecessario: 53750,
      valorJaGuardado: 42500,
      aporteMensalTotal: 3070,
      taxaCdiAnual: 10.5,
      percentualCdi: 100,
      mesesParaAtingir: 4,
      dataPrevistaAlvo: "2027-02-01",
      totalInvestido: 75230,
      totalAcumulado: 79287.92,
      lucroLiquido: 4057.92,
      atingiuMeta: true,
      falta: 0,
      detalhesMensais: [
        {
          mes: 0,
          dataReferencia: dataRefAtual,
          aporteMensal: 0,
          aportesExtras: 0,
          rendimentoBruto: 0,
          imposto: 0,
          rendimentoLiquido: 0,
          totalAcumulado: 42500,
          participantes: [
            {
              participanteId: "part1",
              nome: "Rafael",
              aporteMensal: 1535,
              aportesExtras: 0,
              rendimentoLiquido: 0,
              saldo: 25000,
            },
            {
              participanteId: "part2",
              nome: "Maria",
              aporteMensal: 1535,
              aportesExtras: 0,
              rendimentoLiquido: 0,
              saldo: 17500,
            },
          ],
        },
        {
          mes: 1,
          dataReferencia: dataRefAtual,
          aporteMensal: 3070,
          aportesExtras: 0,
          rendimentoBruto: 350,
          imposto: 0,
          rendimentoLiquido: 350,
          totalAcumulado: 45920,
          participantes: [
            {
              participanteId: "part1",
              nome: "Rafael",
              aporteMensal: 1535,
              aportesExtras: 0,
              rendimentoLiquido: 175,
              saldo: 26710,
            },
            {
              participanteId: "part2",
              nome: "Maria",
              aporteMensal: 1535,
              aportesExtras: 0,
              rendimentoLiquido: 175,
              saldo: 19210,
            },
          ],
        },
      ],
      participantesSnapshot: [
        {
          participanteId: "part1",
          nome: "Rafael",
          aporteMensal: 1535,
          valorInicial: 25000,
          sobraMensal: 2000,
        },
        {
          participanteId: "part2",
          nome: "Maria",
          aporteMensal: 1535,
          valorInicial: 17500,
          sobraMensal: 2000,
        },
      ],
    };

    const saldoAtual = extractSaldoAtual(sim);
    // O saldo do dia deve ser maior que o saldo inicial de 42500 (pois já teve aportes e rendimento até hoje)
    expect(saldoAtual).toBeGreaterThan(42500);
    // E deve ser menor ou igual ao fechamento do mês (45920)
    expect(saldoAtual).toBeLessThanOrEqual(45920);

    const summary = extractSimulacaoSummary(sim);
    expect(summary?.saldoAtual).toBe(saldoAtual);
  });
});
