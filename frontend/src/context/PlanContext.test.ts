import { beforeEach, expect, test, vi } from "vitest";
import { calcularDadosFinanceiros, salvarNoBackend } from "./PlanContext";
import type { SimInput } from "../lib/finance";
import Cookies from "js-cookie";
import api from "@/lib/api";

vi.mock("js-cookie", () => ({
  default: {
    get: vi.fn(() => null),
    set: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock("@/lib/api", () => ({
  default: {
    post: vi.fn(),
    put: vi.fn(),
    get: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

test("salvarNoBackend não chama a API quando o usuário não está autenticado", async () => {
  const mockedGet = Cookies.get as ReturnType<typeof vi.fn>;
  mockedGet.mockReturnValue(null);

  const result = await salvarNoBackend({
    objetivo: null,
    pessoas: [],
    bancoEscolhido: null,
    aportesExtras: [],
    aportesRegularesEditados: {},
    aportesRegularesEditadosPorPessoa: {},
    mesesConcluidos: [],
  }, null, null);

  expect(result).toBeNull();
  expect(api.post).not.toHaveBeenCalled();
  expect(api.put).not.toHaveBeenCalled();
});

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
