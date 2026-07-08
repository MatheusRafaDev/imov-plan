"use client";

import React, { createContext, useState, useContext, ReactNode, useCallback, useRef, useEffect, useMemo } from "react";
import type { SimInput, Aporte, SimResult, SimRow, CenarioSimulacao } from "@/lib/finance";
import { simular, percentualCdiPorTipoInvestimento, mesDaSimulacaoParaData } from "@/lib/finance";
import Cookies from "js-cookie";
import api from "@/lib/api";
import { SimulacaoService, type BackendSimulacaoResult } from "@/services/SimulacaoService";

export type CenarioCompra = "entrada" | "pronto" | "planta";

export type GastoDetalhado = {
  id: string;
  nome: string;
  valor: number;
};

export type Banco = {
  id: string;
  nome: string;
  taxa: number;
};

export type Pessoa = {
  id: string;
  nome: string;
  renda_mensal: number;
  renda_complementar: number;
  gastos_mensais: number;
  gastos_detalhados?: GastoDetalhado[];
  usar_gastos_detalhados?: boolean;
  aporte_mensal: number;
  valorInicial?: number;
  tipoInvestimento?: string;
};

export type DadosCalculados = {
  aporteTotal: number;
  totalGuardado: number;
  effectivePercentualCdi: number;
  virtualAportesRegularesEditados: Record<number, number>;
  combinedExtras: Aporte[];
  simResult: SimResult | null;
  perPersonStats: Array<{
    id: string;
    nome: string;
    tipoInvestimento: string | undefined;
    percentualCdiInvestimento: number;
    valorInicial: number;
    aporteTotal: number;
    extrasTotal: number;
    rendimentoTotal: number;
    saldoFinal: number;
    retornoInvestimento: number;
  }>;
};

// Shape exata que o backend PlanoController espera (PlanoDraftDto)
type PlanoDraftPayload = {
  usuarioId?: string;
  objetivo: {
    valorImovel: number;
    percentualEntrada: number;
    percentualCustosExtras: number;
    valorJaGuardado: number;
    taxaCdiAnual: number;
    percentualCdi: number;
    prazoMaxMeses: number;
    dataInicio: string | null;
    nomePlano: string;
    tipoInvestimento: string;
  } | null;
  pessoas: Pessoa[];
  bancoEscolhido: Banco | null;
  aportesExtras: Aporte[];
  aportesRegularesEditados: Record<number, number>;
  aportesRegularesEditadosPorPessoa: Record<string, Record<number, number>>;
  mesesConcluidos: number[];
};

type PlanContextType = {
  objetivo: Partial<SimInput> | null;
  setObjetivo: React.Dispatch<React.SetStateAction<Partial<SimInput> | null>>;
  pessoas: Pessoa[];
  setPessoas: React.Dispatch<React.SetStateAction<Pessoa[]>>;
  aportesExtras: Aporte[];
  setAportesExtras: React.Dispatch<React.SetStateAction<Aporte[]>>;
  planoId: string | null;
  bancoEscolhido: Banco | null;
  setBancoEscolhido: React.Dispatch<React.SetStateAction<Banco | null>>;
  cenario: CenarioCompra;
  setCenario: React.Dispatch<React.SetStateAction<CenarioCompra>>;
  cenarioSimulacao: CenarioSimulacao;
  setCenarioSimulacao: React.Dispatch<React.SetStateAction<CenarioSimulacao>>;
  aportesRegularesEditados: Record<number, number>;
  setAportesRegularesEditados: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  aportesRegularesEditadosPorPessoa: Record<string, Record<number, number>>;
  setAportesRegularesEditadosPorPessoa: React.Dispatch<React.SetStateAction<Record<string, Record<number, number>>>>;
  mesesConcluidos: number[];
  setMesesConcluidos: React.Dispatch<React.SetStateAction<number[]>>;
  salvarPlano: (objetivoOverride?: Partial<SimInput> | null) => Promise<string | null>;
  saveDraft: (patch?: {
    objetivo?: Partial<SimInput> | null;
    pessoas?: Pessoa[];
    mesesConcluidos?: number[];
    aportesExtras?: Aporte[];
    aportesRegularesEditados?: Record<number, number>;
    aportesRegularesEditadosPorPessoa?: Record<string, Record<number, number>>;
  }) => Promise<string | null>;
  carregarPlano: () => Promise<void>;
  dadosCalculados: DadosCalculados;
  recalcular: () => void;
  backendData: BackendSimulacaoResult | null;
  calculating: boolean;
  backendError: string | null;
  simSource: "backend" | "client";
  loadingBackend: boolean;
  calcularBackend: (planoIdOverride?: string | null) => Promise<void>;
};

const PlanContext = createContext<PlanContextType | undefined>(undefined);

const CHAVE_LOCAL = "imovplan_dados";

// Função centralizada para calcular todos os dados financeiros
export function calcularDadosFinanceiros(
  objetivo: Partial<SimInput> | null,
  pessoas: Pessoa[],
  aportesExtras: Aporte[],
  aportesRegularesEditados: Record<number, number>,
  aportesRegularesEditadosPorPessoa: Record<string, Record<number, number>>,
  cenarioSimulacao: CenarioSimulacao = "realista"
): DadosCalculados {
  const aporteTotal = pessoas.reduce((s, p) => s + Number(p.aporte_mensal ?? 0), 0);
  const pessoasGuardadoSum = pessoas.reduce((s, p) => s + (p.valorInicial ?? 0), 0);
  const totalGuardado = pessoasGuardadoSum > 0 ? pessoasGuardadoSum : Number(objetivo?.valorJaGuardado ?? 0);

  const effectivePercentualCdi = (() => {
    const totalSaved = pessoas.reduce((sum, p) => sum + Number(p.valorInicial ?? 0), 0);
    if (totalSaved <= 0) {
      return Number(objetivo?.percentualCdi ?? 100);
    }
    return pessoas.reduce((sum, p) => {
      const tipoPercent = p.tipoInvestimento
        ? percentualCdiPorTipoInvestimento(p.tipoInvestimento)
        : Number(objetivo?.percentualCdi ?? 100);
      return sum + tipoPercent * (Number(p.valorInicial ?? 0) / totalSaved);
    }, 0);
  })();

  const combinedExtras = aportesExtras.map(a => ({ ...a, valor: Number(a.valor) }));

  const virtualAportesRegularesEditados = (() => {
    const virtualMap: Record<number, number> = {};
    const prazoMax = objetivo?.prazoMaxMeses ?? 600;

    for (let mes = 1; mes <= prazoMax; mes++) {
      let isEditedInMonth = false;
      let totalForMonth = 0;
      const isLegacyEdited = aportesRegularesEditados[mes] !== undefined;
      const defaultAporte = aporteTotal;

      pessoas.forEach(p => {
        const editedValue = aportesRegularesEditadosPorPessoa[p.id]?.[mes];
        if (editedValue !== undefined) {
          isEditedInMonth = true;
          totalForMonth += editedValue;
        } else if (isLegacyEdited && defaultAporte > 0) {
          totalForMonth += ((Number(p.aporte_mensal) || 0) / defaultAporte) * (aportesRegularesEditados[mes] || 0);
        } else {
          totalForMonth += Number(p.aporte_mensal) || 0;
        }
      });

      if (!isEditedInMonth && isLegacyEdited) {
        virtualMap[mes] = aportesRegularesEditados[mes];
      } else if (isEditedInMonth) {
        virtualMap[mes] = totalForMonth;
      }
    }
    return virtualMap;
  })();

  const inicio = objetivo?.dataInicio
    ? (typeof objetivo.dataInicio === "string"
      ? new Date(objetivo.dataInicio + "T12:00:00")
      : new Date(objetivo.dataInicio))
    : new Date();

  const simResult = objetivo?.valorImovel ? simular({
    valorImovel: Number(objetivo?.valorImovel ?? 0),
    percentualEntrada: Number(objetivo?.percentualEntrada ?? 0),
    percentualCustosExtras: Number(objetivo?.percentualCustosExtras ?? 0),
    valorJaGuardado: totalGuardado,
    taxaCdiAnual: Number(objetivo?.taxaCdiAnual ?? 0),
    percentualCdi: effectivePercentualCdi,
    aporteMensalTotal: aporteTotal,
    aportesRegularesEditados: virtualAportesRegularesEditados,
    dataInicio: objetivo?.dataInicio ?? new Date(),
    aportesExtras: combinedExtras,
    prazoMaxMeses: objetivo?.prazoMaxMeses ?? 600,
    cenario: cenarioSimulacao,
  }) : null;

  const perPersonStats = (() => {
    if (!simResult) return [];

    const initialById = Object.fromEntries(pessoas.map(p => [p.id, Number(p.valorInicial ?? 0)]));
    const aporteTotalById = Object.fromEntries(pessoas.map(p => [p.id, 0]));
    const extrasTotalById = Object.fromEntries(pessoas.map(p => [p.id, 0]));
    const rendimentoTotalById = Object.fromEntries(pessoas.map(p => [p.id, 0]));
    const finalSaldoById: Record<string, number> = { ...initialById };

    for (const row of simResult.rows) {
      if (row.mes === 0) continue;

      const defaultAporte = aporteTotal;
      const isEditedMonth = aportesRegularesEditados[row.mes] !== undefined;
      const aporteFinalPorPessoa: Record<string, number> = {};

      pessoas.forEach(p => {
        const editedValue = aportesRegularesEditadosPorPessoa[p.id]?.[row.mes];
        if (editedValue !== undefined) {
          aporteFinalPorPessoa[p.id] = editedValue;
        } else if (isEditedMonth && defaultAporte > 0) {
          aporteFinalPorPessoa[p.id] = ((Number(p.aporte_mensal) || 0) / defaultAporte) * (aportesRegularesEditados[row.mes] || 0);
        } else {
          aporteFinalPorPessoa[p.id] = Number(p.aporte_mensal) || 0;
        }
      });

      const extrasMes = combinedExtras.filter(a => {
        const mesOffset = mesDaSimulacaoParaData(a.data, inicio);
        return mesOffset === row.mes;
      });

      const extrasPorPessoa: Record<string, number> = {};
      let extrasConjunto = 0;
      extrasMes.forEach(a => {
        if (a.pessoaId) {
          extrasPorPessoa[a.pessoaId] = (extrasPorPessoa[a.pessoaId] || 0) + Number(a.valor);
        } else {
          extrasConjunto += Number(a.valor);
        }
      });

      const weightedBalances = Object.fromEntries(
        pessoas.map(p => {
          const saldoAtual = (finalSaldoById[p.id] || 0) + (aporteFinalPorPessoa[p.id] || 0) + (extrasPorPessoa[p.id] || 0);
          return [
            p.id,
            saldoAtual * (percentualCdiPorTipoInvestimento(p.tipoInvestimento) / 100),
          ];
        })
      );
      const totalWeighted = Object.values(weightedBalances).reduce((sum, value) => sum + value, 0);

      pessoas.forEach(p => {
        const balance = finalSaldoById[p.id] || 0;
        const saldoAtual = balance + (aporteFinalPorPessoa[p.id] || 0) + (extrasPorPessoa[p.id] || 0);
        const weight = totalWeighted > 0
          ? (weightedBalances[p.id] || 0) / totalWeighted
          : (row.saldoAcumulado > 0 ? saldoAtual / row.saldoAcumulado : 0);
        const rendimentoPessoa = row.rendimentoLiquido * weight;

        aporteTotalById[p.id] += aporteFinalPorPessoa[p.id];
        extrasTotalById[p.id] += extrasPorPessoa[p.id] || 0;
        rendimentoTotalById[p.id] += rendimentoPessoa;
        finalSaldoById[p.id] = saldoAtual + rendimentoPessoa;
      });
    }

    return pessoas.map(p => ({
      id: p.id,
      nome: p.nome,
      tipoInvestimento: p.tipoInvestimento,
      percentualCdiInvestimento: percentualCdiPorTipoInvestimento(p.tipoInvestimento),
      valorInicial: Number(p.valorInicial ?? 0),
      aporteTotal: aporteTotalById[p.id] || 0,
      extrasTotal: extrasTotalById[p.id] || 0,
      rendimentoTotal: rendimentoTotalById[p.id] || 0,
      saldoFinal: finalSaldoById[p.id] || 0,
      retornoInvestimento: (finalSaldoById[p.id] || 0) - (Number(p.valorInicial ?? 0) + (aporteTotalById[p.id] || 0) + (extrasTotalById[p.id] || 0)),
    }));
  })();

  return {
    aporteTotal,
    totalGuardado,
    effectivePercentualCdi,
    virtualAportesRegularesEditados,
    combinedExtras,
    simResult,
    perPersonStats,
  };
}

function obterIdUsuario(): string | null {
  const cookieUsuario = Cookies.get("user");
  if (!cookieUsuario) return null;
  try {
    return JSON.parse(cookieUsuario).id ?? null;
  } catch {
    return null;
  }
}

function aplicarDados(
  dados: any,
  definidores: {
    setObjetivo: PlanContextType["setObjetivo"];
    setPessoas: PlanContextType["setPessoas"];
    setBancoEscolhido: PlanContextType["setBancoEscolhido"];
    setAportesExtras: PlanContextType["setAportesExtras"];
    setAportesRegularesEditados: PlanContextType["setAportesRegularesEditados"];
    setAportesRegularesEditadosPorPessoa: PlanContextType["setAportesRegularesEditadosPorPessoa"];
    setMesesConcluidos: PlanContextType["setMesesConcluidos"];
  }
) {
  if (!dados) return;

  if (dados.objetivo) {
    const d = dados.objetivo.dataInicio ? new Date(dados.objetivo.dataInicio) : new Date();
    definidores.setObjetivo({ ...dados.objetivo, dataInicio: isNaN(d.getTime()) ? new Date() : d });
  }
  if (dados.pessoas) definidores.setPessoas(dados.pessoas);
  if (dados.bancoEscolhido) definidores.setBancoEscolhido(dados.bancoEscolhido);
  if (dados.aportesExtras) {
    definidores.setAportesExtras(dados.aportesExtras.map((a: any) => ({
      ...a,
      data: typeof a.data === "string"
        ? a.data
        : a.data instanceof Date
          ? a.data.toISOString().slice(0, 10)
          : new Date(a.data).toISOString().slice(0, 10),
    })));
  }
  if (dados.aportesRegularesEditados) definidores.setAportesRegularesEditados(dados.aportesRegularesEditados);
  if (dados.aportesRegularesEditadosPorPessoa) definidores.setAportesRegularesEditadosPorPessoa(dados.aportesRegularesEditadosPorPessoa);
  if (dados.mesesConcluidos) definidores.setMesesConcluidos(dados.mesesConcluidos);
}

function salvarNoLocalStorage(dados: {
  objetivo: Partial<SimInput> | null;
  pessoas: Pessoa[];
  bancoEscolhido: Banco | null;
  aportesExtras: Aporte[];
  aportesRegularesEditados: Record<number, number>;
  aportesRegularesEditadosPorPessoa: Record<string, Record<number, number>>;
  mesesConcluidos: number[];
}) {
  try {
    localStorage.setItem(CHAVE_LOCAL, JSON.stringify(dados));
  } catch (error) {
    console.error("Erro ao salvar no localStorage:", error);
  }
}

function montarObjetivoDraft(objetivo: Partial<SimInput> | null): PlanoDraftPayload["objetivo"] {
  if (!objetivo) return null;
  return {
    valorImovel: Number(objetivo.valorImovel) || 0,
    percentualEntrada: Number(objetivo.percentualEntrada) || 0,
    percentualCustosExtras: Number(objetivo.percentualCustosExtras) || 0,
    valorJaGuardado: Number(objetivo.valorJaGuardado) || 0,
    taxaCdiAnual: Number(objetivo.taxaCdiAnual) || 10.5,
    percentualCdi: Number(objetivo.percentualCdi) || 100,
    prazoMaxMeses: Number(objetivo.prazoMaxMeses) || 0,
    dataInicio: objetivo.dataInicio ? new Date(objetivo.dataInicio).toISOString().slice(0, 10) : null,
    nomePlano: (objetivo as any).nomePlano || "Imóvel",
    tipoInvestimento: (objetivo as any).tipoInvestimento || "",
  };
}

export async function salvarNoBackend(
  dados: {
    objetivo: Partial<SimInput> | null;
    pessoas: Pessoa[];
    bancoEscolhido: Banco | null;
    aportesExtras: Aporte[];
    aportesRegularesEditados: Record<number, number>;
    aportesRegularesEditadosPorPessoa: Record<string, Record<number, number>>;
    mesesConcluidos: number[];
  },
  planoId: string | null
): Promise<string | null> {
  const usuarioId = obterIdUsuario();
  if (!usuarioId) {
    console.warn("Usuário não autenticado, salvando apenas localmente");
    return null;
  }

  const payload: PlanoDraftPayload = {
    usuarioId,
    objetivo: montarObjetivoDraft(dados.objetivo),
    pessoas: dados.pessoas || [],
    bancoEscolhido: dados.bancoEscolhido || null,
    aportesExtras: dados.aportesExtras || [],
    aportesRegularesEditados: dados.aportesRegularesEditados || {},
    aportesRegularesEditadosPorPessoa: dados.aportesRegularesEditadosPorPessoa || {},
    mesesConcluidos: dados.mesesConcluidos || [],
  };

  try {
    if (planoId) {
      try {
        // Tenta atualizar plano existente — PUT /api/plano/draft/{id}
        await api.put(`/plano/draft/${planoId}`, payload);
        return planoId;
      } catch (putError: any) {
        if (putError?.response?.status === 404) {
          // Plano não existe mais no banco (ex: banco foi resetado).
          // Limpa o ID inválido e cria um novo draft.
          console.warn(`Plano ${planoId} não encontrado no banco (404). Criando novo draft...`);
          Cookies.remove("imovplan_planoId");
          // Cai no bloco de criação abaixo
        } else {
          throw putError;
        }
      }
    }

    // Cria ou obtém draft para o usuário — POST /api/plano/draft-for-user?usuarioId=...
    const resposta = await api.post(`/plano/draft-for-user?usuarioId=${usuarioId}`, {});
    const novoId: string | undefined = resposta.data?.id;
    if (novoId) {
      Cookies.set("imovplan_planoId", novoId, { expires: 30 });
      // Agora salva os dados no draft recém-criado
      await api.put(`/plano/draft/${novoId}`, { ...payload });
      return novoId;
    }
    return null;
  } catch (error: any) {
    if (error?.response?.status === 500) {
      console.warn("Salvar no backend falhou com 500. Dados continuam salvos localmente.", error?.response?.data || error.message);
      return null;
    }
    console.error("Erro ao salvar no backend:", error);
    throw error;
  }
}

export function PlanProvider({ children }: { children: ReactNode }) {
  const [objetivo, setObjetivo] = useState<Partial<SimInput> | null>(null);
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [aportesExtras, setAportesExtras] = useState<Aporte[]>([]);
  const [bancoEscolhido, setBancoEscolhido] = useState<Banco | null>(null);
  const [cenario, setCenario] = useState<CenarioCompra>(
    (Cookies.get("imovplan_cenario") as CenarioCompra) || "entrada"
  );
  const [cenarioSimulacao, setCenarioSimulacao] = useState<CenarioSimulacao>("realista");
  const [aportesRegularesEditados, setAportesRegularesEditados] = useState<Record<number, number>>({});
  const [aportesRegularesEditadosPorPessoa, setAportesRegularesEditadosPorPessoa] = useState<Record<string, Record<number, number>>>({});
  const [mesesConcluidos, setMesesConcluidos] = useState<number[]>([]);

  // Estado para dados calculados centralizados
  const [dadosCalculados, setDadosCalculados] = useState<DadosCalculados>({
    aporteTotal: 0,
    totalGuardado: 0,
    effectivePercentualCdi: 100,
    virtualAportesRegularesEditados: {},
    combinedExtras: [],
    simResult: null,
    perPersonStats: [],
  });

  const [backendData, setBackendData] = useState<BackendSimulacaoResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [simSource, setSimSource] = useState<"backend" | "client">("client");
  const [loadingBackend, setLoadingBackend] = useState(false);

  const [planoId, setPlanoId] = useState<string | null>(() => Cookies.get("imovplan_planoId") || null);
  const ultimoCalculoRef = useRef<string>("");

  const definidores = {
    setObjetivo,
    setPessoas,
    setBancoEscolhido,
    setAportesExtras,
    setAportesRegularesEditados,
    setAportesRegularesEditadosPorPessoa,
    setMesesConcluidos
  };

  // Função para carregar o plano
  const carregarPlano = useCallback(async () => {
    const usuarioId = obterIdUsuario();

    if (!usuarioId) {
      // Carrega do localStorage se não tiver usuário
      const local = localStorage.getItem(CHAVE_LOCAL);
      if (local) {
        try {
          const dados = JSON.parse(local);
          aplicarDados(dados, definidores);
          ultimoCalculoRef.current = JSON.stringify({
            objetivo: dados.objetivo,
            pessoas: dados.pessoas,
            aportesExtras: dados.aportesExtras,
            aportesRegularesEditados: dados.aportesRegularesEditados,
            aportesRegularesEditadosPorPessoa: dados.aportesRegularesEditadosPorPessoa,
          });
          console.log("Dados carregados do localStorage");
        } catch (error) {
          console.error("Erro ao carregar dados do localStorage:", error);
        }
      }
      return;
    }

    try {
      // Tenta carregar do backend — rota correta: GET /api/plano/user/{usuarioId}
      const resposta = await api.get(`/plano/user/${usuarioId}`);
      if (resposta.status === 200 && resposta.data) {
        const draftData = resposta.data;
        // O backend retorna um PlanoDraftDto, precisamos mapear para o formato do contexto
        const dadosMapeados = {
          objetivo: draftData.objetivo ? {
            nomePlano: draftData.objetivo.nomePlano,
            valorImovel: draftData.objetivo.valorImovel,
            percentualEntrada: draftData.objetivo.percentualEntrada,
            percentualCustosExtras: draftData.objetivo.percentualCustosExtras,
            valorJaGuardado: draftData.objetivo.valorJaGuardado,
            taxaCdiAnual: draftData.objetivo.taxaCdiAnual,
            percentualCdi: draftData.objetivo.percentualCdi,
            prazoMaxMeses: draftData.objetivo.prazoMaxMeses,
            dataInicio: draftData.objetivo.dataInicio ? new Date(draftData.objetivo.dataInicio) : new Date(),
            tipoInvestimento: draftData.objetivo.tipoInvestimento,
          } : null,
          pessoas: (draftData.pessoas || []).map((p: any) => ({
            id: p.id,
            nome: p.nome,
            renda_mensal: p.renda_mensal,
            renda_complementar: p.renda_complementar,
            gastos_mensais: p.gastos_mensais,
            usar_gastos_detalhados: p.usar_gastos_detalhados,
            gastos_detalhados: p.gastos_detalhados || [],
            aporte_mensal: p.aporte_mensal,
            valorInicial: p.valorInicial,
            tipoInvestimento: p.tipoInvestimento,
          })),
          bancoEscolhido: draftData.bancoEscolhido || null,
          aportesExtras: (draftData.aportesExtras || []).map((a: any) => {
            const dataString = a.data
              ? typeof a.data === "string"
                ? a.data
                : a.data instanceof Date
                  ? a.data.toISOString().slice(0, 10)
                  : new Date(a.data).toISOString().slice(0, 10)
              : new Date().toISOString().slice(0, 10);
            return {
              data: dataString,
              valor: a.valor,
              origem: a.origem,
              pessoaId: a.pessoaId,
              pessoaNome: a.pessoaNome,
            };
          }),
          aportesRegularesEditados: draftData.aportesRegularesEditados || {},
          aportesRegularesEditadosPorPessoa: draftData.aportesRegularesEditadosPorPessoa || {},
          mesesConcluidos: draftData.mesesConcluidos || [],
        };
        aplicarDados(dadosMapeados, definidores);
        ultimoCalculoRef.current = JSON.stringify({
          objetivo: dadosMapeados.objetivo,
          pessoas: dadosMapeados.pessoas,
          aportesExtras: dadosMapeados.aportesExtras,
          aportesRegularesEditados: dadosMapeados.aportesRegularesEditados,
          aportesRegularesEditadosPorPessoa: dadosMapeados.aportesRegularesEditadosPorPessoa,
        });
        if (draftData.id) {
          setPlanoId(draftData.id);
          Cookies.set("imovplan_planoId", draftData.id, { expires: 30 });

          setLoadingBackend(true);
          try {
            const simData = await SimulacaoService.getUltimaSimulacao(draftData.id);
            if (simData) {
              setBackendData(simData);
              setSimSource("backend");
            } else {
              setSimSource("client");
            }
          } catch (simError) {
            console.error("Erro ao carregar última simulação do backend:", simError);
            setBackendError("Não foi possível carregar dados do servidor");
            setSimSource("client");
          } finally {
            setLoadingBackend(false);
          }
        }
        console.log("Dados carregados do backend");
        return;
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn("Plano não encontrado no backend (404). Limpando ID inválido e usando dados locais.");
        // Limpa o planoId inválido — próximo save criará um novo draft
        setPlanoId(null);
        Cookies.remove("imovplan_planoId");
      } else {
        console.error("Erro ao carregar plano do backend:", error);
      }

      // Tenta carregar do localStorage como fallback
      const local = localStorage.getItem(CHAVE_LOCAL);
      if (local) {
        try {
          const dados = JSON.parse(local);
          aplicarDados(dados, definidores);
          ultimoCalculoRef.current = JSON.stringify({
            objetivo: dados.objetivo,
            pessoas: dados.pessoas,
            aportesExtras: dados.aportesExtras,
            aportesRegularesEditados: dados.aportesRegularesEditados,
            aportesRegularesEditadosPorPessoa: dados.aportesRegularesEditadosPorPessoa,
          });
          console.log("Dados carregados do localStorage (fallback)");
        } catch (e) {
          console.error("Erro ao carregar dados do localStorage:", e);
        }
      }
    }
  }, []);

  // Função para salvar o plano (aceita um objetivo opcional para evitar bug de closure)
  const salvarPlano = useCallback(async (objetivoOverride?: Partial<SimInput> | null): Promise<string | null> => {
    const objetivoFinal = objetivoOverride !== undefined ? objetivoOverride : objetivo;
    const dadosLocais = {
      objetivo: objetivoFinal,
      pessoas,
      bancoEscolhido,
      aportesExtras,
      aportesRegularesEditados,
      aportesRegularesEditadosPorPessoa,
      mesesConcluidos,
    };

    // Sempre salva no localStorage como backup
    salvarNoLocalStorage(dadosLocais);
    console.log("Dados salvos no localStorage");

    // Se tiver usuário autenticado, salva no backend
    const usuarioId = obterIdUsuario();
    if (usuarioId) {
      try {
        const novoId = await salvarNoBackend(dadosLocais, planoId);
        if (novoId && !planoId) {
          setPlanoId(novoId);
          Cookies.set("imovplan_planoId", novoId, { expires: 30 });
        }
        console.log("Dados salvos no backend");
        return novoId || planoId;
      } catch (error) {
        // O localStorage já tem os dados, então não bloqueamos o fluxo
        console.warn("Backup salvo no localStorage, falha no backend:", error);
        return planoId;
      }
    }

    return planoId || "local-draft"; // Salvou localmente
  }, [
    objetivo,
    pessoas,
    bancoEscolhido,
    aportesExtras,
    aportesRegularesEditados,
    aportesRegularesEditadosPorPessoa,
    mesesConcluidos,
    planoId
  ]);

  // saveDraft: aceita um patch parcial e salva imediatamente (evita bug de closure nas páginas)
  const saveDraft = useCallback(async (patch?: {
    objetivo?: Partial<SimInput> | null;
    pessoas?: Pessoa[];
    mesesConcluidos?: number[];
    aportesExtras?: Aporte[];
    aportesRegularesEditados?: Record<number, number>;
    aportesRegularesEditadosPorPessoa?: Record<string, Record<number, number>>;
  }): Promise<string | null> => {
    const dadosFinal = {
      objetivo: patch?.objetivo !== undefined ? patch.objetivo : objetivo,
      pessoas: patch?.pessoas !== undefined ? patch.pessoas : pessoas,
      bancoEscolhido,
      aportesExtras: patch?.aportesExtras !== undefined ? patch.aportesExtras : aportesExtras,
      aportesRegularesEditados: patch?.aportesRegularesEditados !== undefined ? patch.aportesRegularesEditados : aportesRegularesEditados,
      aportesRegularesEditadosPorPessoa: patch?.aportesRegularesEditadosPorPessoa !== undefined ? patch.aportesRegularesEditadosPorPessoa : aportesRegularesEditadosPorPessoa,
      mesesConcluidos: patch?.mesesConcluidos !== undefined ? patch.mesesConcluidos : mesesConcluidos,
    };

    salvarNoLocalStorage(dadosFinal);

    const usuarioId = obterIdUsuario();
    if (usuarioId) {
      try {
        const novoId = await salvarNoBackend(dadosFinal, planoId);
        if (novoId && !planoId) {
          setPlanoId(novoId);
          Cookies.set("imovplan_planoId", novoId, { expires: 30 });
        }
        return novoId || planoId;
      } catch (error) {
        console.warn("saveDraft: falha no backend, dados salvos localmente", error);
        return planoId;
      }
    }
    return planoId || "local-draft";
  }, [
    objetivo, pessoas, bancoEscolhido, aportesExtras,
    aportesRegularesEditados, aportesRegularesEditadosPorPessoa,
    mesesConcluidos, planoId
  ]);

  // Função para recalcular dados financeiros
  const recalcular = useCallback(() => {
    const calculados = calcularDadosFinanceiros(
      objetivo,
      pessoas,
      aportesExtras,
      aportesRegularesEditados,
      aportesRegularesEditadosPorPessoa,
      cenarioSimulacao
    );
    setDadosCalculados(calculados);
  }, [objetivo, pessoas, aportesExtras, aportesRegularesEditados, aportesRegularesEditadosPorPessoa, cenarioSimulacao]);

  // Função para executar simulação e cálculo no backend
  const calcularBackend = useCallback(async (planoIdOverride?: string | null) => {
    const id = planoIdOverride !== undefined ? planoIdOverride : planoId;
    if (!id || id.startsWith("local-draft-")) {
      console.warn("calcularBackend: sem ID de plano válido");
      return;
    }

    const hashAtual = JSON.stringify({
      objetivo,
      pessoas,
      aportesExtras,
      aportesRegularesEditados,
      aportesRegularesEditadosPorPessoa,
    });

    if (ultimoCalculoRef.current === hashAtual && backendData) {
      console.log("calcularBackend: sem alterações, pulando chamada");
      return;
    }

    setCalculating(true);
    setBackendError(null);

    const totalSaved = pessoas.reduce((sum, p) => sum + Number(p.valorInicial ?? 0), 0);
    const effectiveCdi = totalSaved <= 0
      ? Number(objetivo?.percentualCdi ?? 100)
      : pessoas.reduce((sum, p) => {
        const tipoPercent = p.tipoInvestimento
          ? percentualCdiPorTipoInvestimento(p.tipoInvestimento)
          : Number(objetivo?.percentualCdi ?? 100);
        return sum + tipoPercent * (Number(p.valorInicial ?? 0) / totalSaved);
      }, 0);

    try {
      // Garantir que todos os dados do contexto (ex: prazos recém-alterados na tela)
      // estejam salvos no banco antes de mandar o backend calcular,
      // pois o backend lê o PrazoMaxMeses direto do banco.
      await saveDraft();

      const result = await SimulacaoService.calcularSimulacao(id, {
        objetivoId: id,
        taxaCDI: Number(objetivo?.taxaCdiAnual) || 10.5,
        percentualCdi: effectiveCdi,
        aportesMensais: pessoas.map(p => ({
          pessoaId: p.id || "",
          valor: Number(p.aporte_mensal) || 0
        })),
        aportesExtras: aportesExtras.map(a => ({
          pessoaId: a.pessoaId || "",
          valor: Number(a.valor) || 0,
          data: a.data || new Date().toISOString(),
          origem: a.origem || "Extra"
        })),
        aportesRegularesEditados: aportesRegularesEditados,
        aportesRegularesEditadosPorPessoa: aportesRegularesEditadosPorPessoa,
      });

      setBackendData(result);
      setSimSource("backend");
      setBackendError(null);
      ultimoCalculoRef.current = hashAtual;
    } catch (err: any) {
      console.error("Erro ao calcular simulação no backend:", err);
      setBackendError(err?.response?.data?.message || "Erro ao calcular simulação no servidor");
    } finally {
      setCalculating(false);
    }
  }, [planoId, objetivo, pessoas, aportesExtras, aportesRegularesEditados, aportesRegularesEditadosPorPessoa, backendData, saveDraft]);

  // Carrega o plano uma vez ao montar
  const inicializado = useRef(false);
  const readyForAutoSave = useRef(false);

  useEffect(() => {
    if (inicializado.current) return;
    inicializado.current = true;
    carregarPlano().finally(() => {
      setTimeout(() => {
        readyForAutoSave.current = true;
      }, 500);
    });
  }, [carregarPlano]);

  // Recalcula dados financeiros automaticamente quando dados base mudam (debounced 150ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      recalcular();
    }, 150);
    return () => clearTimeout(timer);
  }, [objetivo, pessoas, aportesExtras, aportesRegularesEditados, aportesRegularesEditadosPorPessoa, recalcular]);

  // Salva automaticamente quando os dados mudarem (debounced)
  useEffect(() => {
    if (!readyForAutoSave.current) return;

    const timer = setTimeout(() => {
      salvarPlano();
    }, 3000); // Espera 3 segundos após a última alteração

    return () => clearTimeout(timer);
  }, [
    objetivo,
    pessoas,
    bancoEscolhido,
    aportesExtras,
    aportesRegularesEditados,
    aportesRegularesEditadosPorPessoa,
    mesesConcluidos,
    salvarPlano
  ]);

  return (
    <PlanContext.Provider value={{
      objetivo,
      setObjetivo,
      pessoas,
      setPessoas,
      aportesExtras,
      setAportesExtras,
      planoId,
      bancoEscolhido,
      setBancoEscolhido,
      cenario,
      setCenario,
      cenarioSimulacao,
      setCenarioSimulacao,
      aportesRegularesEditados,
      setAportesRegularesEditados,
      aportesRegularesEditadosPorPessoa,
      setAportesRegularesEditadosPorPessoa,
      mesesConcluidos,
      setMesesConcluidos,
      salvarPlano,
      saveDraft,
      carregarPlano,
      dadosCalculados,
      recalcular,
      backendData,
      calculating,
      backendError,
      simSource,
      loadingBackend,
      calcularBackend,
    }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlanContext() {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error("usePlanContext deve ser usado dentro de um PlanProvider");
  }
  return context;
}