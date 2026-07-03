import { expect, test } from "vitest";
import { calcularDadosFinanceiros } from "./PlanContext";
import type { SimInput } from "../lib/finance";

test("calcularDadosFinanceiros - soma de rendimentoTotal por pessoa bate com rendLiquido total da tabela", () => {
  const objetivo: Partial<SimInput> = {
    valorImovel: 235000,
    percentualEntrada: 20,
    percentualCustosExtras: 5,
    valorJaGuardado: 35000,
    taxaCdiAnual: 10.5,
    percentualCdi: 100,
    prazoMaxMeses: 10, // curto para teste
    dataInicio: new Date("2026-07-01T12:00:00"),
  };

  const pessoas = [
    {
      id: "p1",
      nome: "Pessoa 1",
      renda_mensal: 5000,
      renda_complementar: 0,
      gastos_mensais: 2000,
      aporte_mensal: 2219,
      valorInicial: 20000,
      tipoInvestimento: "cdb_100",
    },
    {
      id: "p2",
      nome: "Pessoa 2",
      renda_mensal: 4000,
      renda_complementar: 0,
      gastos_mensais: 1500,
      aporte_mensal: 871,
      valorInicial: 15000,
      tipoInvestimento: "cdb_100",
    }
  ];

  const result = calcularDadosFinanceiros(
    objetivo,
    pessoas,
    [], // sem extras
    {}, // sem editados
    {}
  );

  const totalRendimentoPessoas = result.perPersonStats.reduce((sum, p) => sum + p.rendimentoTotal, 0);
  const totalRendimentoSimResult = result.simResult?.rows.reduce((sum, r) => sum + r.rendimentoLiquido, 0) ?? 0;

  expect(totalRendimentoPessoas).toBeCloseTo(totalRendimentoSimResult, 2);
});
