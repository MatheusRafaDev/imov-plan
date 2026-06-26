"use client";

import React, { createContext, useState, useContext, ReactNode, useCallback, useRef, useEffect } from "react";
import type { SimInput, Aporte } from "@/lib/finance";
import Cookies from "js-cookie";
import api from "@/lib/api";

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

// Shape exata que o backend PlanoController espera (PlanoDraftDto)
type PlanoDraftPayload = {
  sessionId: string | null;
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
  sessionId: string | null;
  bancoEscolhido: Banco | null;
  setBancoEscolhido: React.Dispatch<React.SetStateAction<Banco | null>>;
  cenario: CenarioCompra;
  setCenario: React.Dispatch<React.SetStateAction<CenarioCompra>>;
  aportesRegularesEditados: Record<number, number>;
  setAportesRegularesEditados: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  aportesRegularesEditadosPorPessoa: Record<string, Record<number, number>>;
  setAportesRegularesEditadosPorPessoa: React.Dispatch<React.SetStateAction<Record<string, Record<number, number>>>>;
  mesesConcluidos: number[];
  setMesesConcluidos: React.Dispatch<React.SetStateAction<number[]>>;
  salvarPlano: (objetivoOverride?: Partial<SimInput> | null) => Promise<boolean>;
  saveDraft: (patch?: {
    objetivo?: Partial<SimInput> | null;
    pessoas?: Pessoa[];
    mesesConcluidos?: number[];
    aportesRegularesEditados?: Record<number, number>;
    aportesRegularesEditadosPorPessoa?: Record<string, Record<number, number>>;
  }) => Promise<boolean>;
  carregarPlano: () => Promise<void>;
};

const PlanContext = createContext<PlanContextType | undefined>(undefined);

const CHAVE_LOCAL = "imovplan_dados";

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

async function salvarNoBackend(
  dados: {
    objetivo: Partial<SimInput> | null;
    pessoas: Pessoa[];
    bancoEscolhido: Banco | null;
    aportesExtras: Aporte[];
    aportesRegularesEditados: Record<number, number>;
    aportesRegularesEditadosPorPessoa: Record<string, Record<number, number>>;
    mesesConcluidos: number[];
  },
  planoId: string | null,
  sessionId: string | null
): Promise<string | null> {
  const usuarioId = obterIdUsuario();
  if (!usuarioId) {
    console.warn("Usuário não autenticado, salvando apenas localmente");
    return null;
  }

  const payload: PlanoDraftPayload = {
    sessionId,
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
  const [aportesRegularesEditados, setAportesRegularesEditados] = useState<Record<number, number>>({});
  const [aportesRegularesEditadosPorPessoa, setAportesRegularesEditadosPorPessoa] = useState<Record<string, Record<number, number>>>({});
  const [mesesConcluidos, setMesesConcluidos] = useState<number[]>([]);

  const [planoId, setPlanoId] = useState<string | null>(() => Cookies.get("imovplan_planoId") || null);
  const [sessionId, setSessionId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    let existente = Cookies.get("imovplan_sessionId");
    if (!existente) {
      existente = Math.random().toString(36).substring(2, 15);
      Cookies.set("imovplan_sessionId", existente, { expires: 30 });
    }
    return existente;
  });

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
        if (draftData.id) {
          setPlanoId(draftData.id);
          Cookies.set("imovplan_planoId", draftData.id, { expires: 30 });
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
          console.log("Dados carregados do localStorage (fallback)");
        } catch (e) {
          console.error("Erro ao carregar dados do localStorage:", e);
        }
      }
    }
  }, []);

  // Função para salvar o plano (aceita um objetivo opcional para evitar bug de closure)
  const salvarPlano = useCallback(async (objetivoOverride?: Partial<SimInput> | null): Promise<boolean> => {
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
        const novoId = await salvarNoBackend(dadosLocais, planoId, sessionId);
        if (novoId && !planoId) {
          setPlanoId(novoId);
          Cookies.set("imovplan_planoId", novoId, { expires: 30 });
        }
        console.log("Dados salvos no backend");
        return true;
      } catch (error) {
        // O localStorage já tem os dados, então não bloqueamos o fluxo
        console.warn("Backup salvo no localStorage, falha no backend:", error);
        return true;
      }
    }
    
    return true; // Salvou localmente
  }, [
    objetivo, 
    pessoas, 
    bancoEscolhido, 
    aportesExtras,
    aportesRegularesEditados, 
    aportesRegularesEditadosPorPessoa,
    mesesConcluidos, 
    planoId, 
    sessionId
  ]);

  // saveDraft: aceita um patch parcial e salva imediatamente (evita bug de closure nas páginas)
  const saveDraft = useCallback(async (patch?: {
    objetivo?: Partial<SimInput> | null;
    pessoas?: Pessoa[];
    mesesConcluidos?: number[];
    aportesRegularesEditados?: Record<number, number>;
    aportesRegularesEditadosPorPessoa?: Record<string, Record<number, number>>;
  }): Promise<boolean> => {
    const dadosFinal = {
      objetivo: patch?.objetivo !== undefined ? patch.objetivo : objetivo,
      pessoas: patch?.pessoas !== undefined ? patch.pessoas : pessoas,
      bancoEscolhido,
      aportesExtras,
      aportesRegularesEditados: patch?.aportesRegularesEditados !== undefined ? patch.aportesRegularesEditados : aportesRegularesEditados,
      aportesRegularesEditadosPorPessoa: patch?.aportesRegularesEditadosPorPessoa !== undefined ? patch.aportesRegularesEditadosPorPessoa : aportesRegularesEditadosPorPessoa,
      mesesConcluidos: patch?.mesesConcluidos !== undefined ? patch.mesesConcluidos : mesesConcluidos,
    };

    salvarNoLocalStorage(dadosFinal);

    const usuarioId = obterIdUsuario();
    if (usuarioId) {
      try {
        const novoId = await salvarNoBackend(dadosFinal, planoId, sessionId);
        if (novoId && !planoId) {
          setPlanoId(novoId);
          Cookies.set("imovplan_planoId", novoId, { expires: 30 });
        }
        return true;
      } catch (error) {
        console.warn("saveDraft: falha no backend, dados salvos localmente", error);
        return true;
      }
    }
    return true;
  }, [
    objetivo, pessoas, bancoEscolhido, aportesExtras,
    aportesRegularesEditados, aportesRegularesEditadosPorPessoa,
    mesesConcluidos, planoId, sessionId
  ]);

  // Carrega o plano uma vez ao montar
  const inicializado = useRef(false);
  useEffect(() => {
    if (inicializado.current) return;
    inicializado.current = true;
    carregarPlano();
  }, [carregarPlano]);

  // Salva automaticamente quando os dados mudarem (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inicializado.current) {
        salvarPlano();
      }
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
      sessionId,
      bancoEscolhido, 
      setBancoEscolhido,
      cenario, 
      setCenario,
      aportesRegularesEditados, 
      setAportesRegularesEditados,
      aportesRegularesEditadosPorPessoa, 
      setAportesRegularesEditadosPorPessoa,
      mesesConcluidos, 
      setMesesConcluidos,
      salvarPlano,
      saveDraft,
      carregarPlano,
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