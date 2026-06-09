"use client";

import React, { createContext, useState, useContext, ReactNode } from "react";
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

type PlanContextType = {
  objetivo: Partial<SimInput> | null;
  setObjetivo: React.Dispatch<React.SetStateAction<Partial<SimInput> | null>>;
  pessoas: Pessoa[];
  setPessoas: React.Dispatch<React.SetStateAction<Pessoa[]>>;
  aportesExtras: Aporte[];
  setAportesExtras: React.Dispatch<React.SetStateAction<Aporte[]>>;
  planoId: string | null;
  sessionId: string | null;
  saveDraft: (overrideData?: {
    objetivo?: Partial<SimInput> | null;
    pessoas?: Pessoa[];
    bancoEscolhido?: Banco | null;
    aportesExtras?: Aporte[];
    aportesRegularesEditados?: Record<number, number>;
    aportesRegularesEditadosPorPessoa?: Record<string, Record<number, number>>;
    mesesConcluidos?: number[];
  }) => Promise<boolean>;
  reloadDraft: () => Promise<void>;
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
};

const PlanContext = createContext<PlanContextType | undefined>(undefined);

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
  
  const [planoId, setPlanoId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    let existing = Cookies.get("imovplan_sessionId");
    if (!existing) {
      existing = Math.random().toString(36).substring(2, 15);
      Cookies.set("imovplan_sessionId", existing, { expires: 30 });
    }
    return existing;
  });

  const isInitializing = React.useRef(false);

  // Initialize Session and Draft
  React.useEffect(() => {
    if (isInitializing.current) return;
    isInitializing.current = true;

    // Check local storage for existing session/draft
    const localSessionId = sessionId;
    if (!localSessionId) return;
    
    // Draft can be local but we also sync to backend
    const initDraft = async () => {
      let localPlanoId = Cookies.get("imovplan_planoId");

      const userCookie = Cookies.get("user");
      let userId = null;
      if (userCookie) {
        try {
          userId = JSON.parse(userCookie).id;
        } catch (e) {}
      }

      try {
        if (userId) {
          const res = await api.get(`/plano/user/${userId}`);
          if (res.status === 200) {
            const data = res.data;
            if (data.objetivo) {
              const d = data.objetivo.dataInicio ? new Date(data.objetivo.dataInicio) : new Date();
              setObjetivo({ ...data.objetivo, dataInicio: isNaN(d.getTime()) ? new Date() : d });
            }
            if (data.pessoas) setPessoas(data.pessoas);
            if (data.bancoEscolhido) setBancoEscolhido(data.bancoEscolhido);
            if (data.aportesExtras) setAportesExtras(data.aportesExtras);
            if (data.aportesRegularesEditados) setAportesRegularesEditados(data.aportesRegularesEditados);
            if (data.aportesRegularesEditadosPorPessoa) setAportesRegularesEditadosPorPessoa(data.aportesRegularesEditadosPorPessoa);
            if (data.mesesConcluidos) setMesesConcluidos(data.mesesConcluidos);
            
            setPlanoId(data.id);
            Cookies.set("imovplan_planoId", data.id, { expires: 30 });
            if (data.sessionId) {
              Cookies.set("imovplan_sessionId", data.sessionId, { expires: 30 });
            }
            return;
          }
        }

        if (localPlanoId && !userId) {
          // Fetch existing draft from backend
          const res = await api.get(`/plano/draft/${localPlanoId}?sessionId=${localSessionId}`);
          if (res.status === 200) {
            const data = res.data;
            if (data.objetivo) {
              const d = data.objetivo.dataInicio ? new Date(data.objetivo.dataInicio) : new Date();
              setObjetivo({
                ...data.objetivo,
                dataInicio: isNaN(d.getTime()) ? new Date() : d
              });
            }
            if (data.pessoas) setPessoas(data.pessoas);
            if (data.bancoEscolhido) setBancoEscolhido(data.bancoEscolhido);
            if (data.aportesExtras) setAportesExtras(data.aportesExtras);
            if (data.aportesRegularesEditados) setAportesRegularesEditados(data.aportesRegularesEditados);
            if (data.aportesRegularesEditadosPorPessoa) setAportesRegularesEditadosPorPessoa(data.aportesRegularesEditadosPorPessoa);
            if (data.mesesConcluidos) setMesesConcluidos(data.mesesConcluidos);
            
            setPlanoId(localPlanoId);
            return;
          }
        }
        
        // Load fallback from localStorage ONLY if we are not logged in, to avoid carrying over old sessions to new accounts
        const savedDraft = localStorage.getItem("imovplan_draft");
        if (savedDraft && !userId) {
          const data = JSON.parse(savedDraft);
          if (data.objetivo) {
            const d = data.objetivo.dataInicio ? new Date(data.objetivo.dataInicio) : new Date();
            setObjetivo({
              ...data.objetivo,
              dataInicio: isNaN(d.getTime()) ? new Date() : d
            });
          }
          if (data.pessoas) setPessoas(data.pessoas);
          if (data.bancoEscolhido) setBancoEscolhido(data.bancoEscolhido);
          if (data.aportesExtras) setAportesExtras(data.aportesExtras);
          if (data.aportesRegularesEditados) setAportesRegularesEditados(data.aportesRegularesEditados);
          if (data.aportesRegularesEditadosPorPessoa) setAportesRegularesEditadosPorPessoa(data.aportesRegularesEditadosPorPessoa);
          if (data.mesesConcluidos) setMesesConcluidos(data.mesesConcluidos);
        }

        // Create new draft in backend ONLY IF we didn't just load a valid one
        try {
          const resBySession = await api.get(`/plano/draft?sessionId=${localSessionId}`);

          if (resBySession.status === 200 && !userId) {
            const existingDraft = resBySession.data;
            if (existingDraft.objetivo) {
              const d = existingDraft.objetivo.dataInicio ? new Date(existingDraft.objetivo.dataInicio) : new Date();
              setObjetivo({ ...existingDraft.objetivo, dataInicio: isNaN(d.getTime()) ? new Date() : d });
            }
            if (existingDraft.pessoas) setPessoas(existingDraft.pessoas);
            if (existingDraft.bancoEscolhido) setBancoEscolhido(existingDraft.bancoEscolhido);
            if (existingDraft.aportesExtras) setAportesExtras(existingDraft.aportesExtras);
            if (existingDraft.aportesRegularesEditados) setAportesRegularesEditados(existingDraft.aportesRegularesEditados);
            if (existingDraft.aportesRegularesEditadosPorPessoa) setAportesRegularesEditadosPorPessoa(existingDraft.aportesRegularesEditadosPorPessoa);
            if (existingDraft.mesesConcluidos) setMesesConcluidos(existingDraft.mesesConcluidos);
            setPlanoId(existingDraft.id);
            Cookies.set("imovplan_planoId", existingDraft.id, { expires: 30 });
            return;
          }
        } catch (e) {
          console.warn("Failed to check for existing draft by session, will try to create new one:", e);
        }

        try {
          const resPost = await api.post(`/plano/draft?sessionId=${localSessionId}`);
          if (resPost.status === 200) {
            const dataPost = resPost.data;
            setPlanoId(dataPost.id);
            Cookies.set("imovplan_planoId", dataPost.id, { expires: 30 });
            
            if (userId) {
              await api.post(`/plano/${dataPost.id}/link-user?usuarioId=${userId}`);
            } else if (savedDraft) {
               try {
                  await api.put(`/plano/draft/${dataPost.id}`, savedDraft);
               } catch (e) {
                  console.error("Falha ao sincronizar draft local para o novo id", e);
               }
            }
          } else {
            setPlanoId("local-draft-" + localSessionId);
          }
        } catch (e) {
          console.error("Failed to create draft:", e);
          setPlanoId("local-draft-" + localSessionId);
        }

      } catch (err) {
        console.error("Erro ao carregar rascunho do backend, usando local:", err);
        setPlanoId("local-draft-" + localSessionId);
      }
    };

    initDraft();
  }, []);

  const reloadDraft = async () => {
    const userCookie = Cookies.get("user");
    let userId = null;
    if (userCookie) {
      try {
        userId = JSON.parse(userCookie).id;
      } catch (e) {}
    }

    try {
      let data;
      if (userId) {
        // For logged-in users, load by userId
        const res = await api.get(`/plano/user/${userId}`);
        if (res.status === 200) {
          data = res.data;
        }
      } else if (planoId) {
        // For non-logged-in users, load by planoId and sessionId
        const res = await api.get(`/plano/draft/${planoId}?sessionId=${sessionId}`);
        if (res.status === 200) {
          data = res.data;
        }
      }

      if (data) {
        if (data.objetivo) {
          const d = data.objetivo.dataInicio ? new Date(data.objetivo.dataInicio) : new Date();
          setObjetivo({
            ...data.objetivo,
            dataInicio: isNaN(d.getTime()) ? new Date() : d
          });
        }
        if (data.pessoas) setPessoas(data.pessoas);
        if (data.bancoEscolhido) setBancoEscolhido(data.bancoEscolhido);
        if (data.aportesExtras) setAportesExtras(data.aportesExtras);
        if (data.aportesRegularesEditados) setAportesRegularesEditados(data.aportesRegularesEditados);
        if (data.aportesRegularesEditadosPorPessoa) setAportesRegularesEditadosPorPessoa(data.aportesRegularesEditadosPorPessoa);
        if (data.mesesConcluidos) setMesesConcluidos(data.mesesConcluidos);
        if (data.id) setPlanoId(data.id);
      }
    } catch (e) {
      console.error("Failed to reload draft", e);
    }
  };

  const saveDraft = async (overrideData?: {
    objetivo?: Partial<SimInput> | null;
    pessoas?: Pessoa[];
    bancoEscolhido?: Banco | null;
    aportesExtras?: Aporte[];
    aportesRegularesEditados?: Record<number, number>;
    aportesRegularesEditadosPorPessoa?: Record<string, Record<number, number>>;
    mesesConcluidos?: number[];
  }): Promise<boolean> => {
    if (!sessionId) {
      console.warn("saveDraft called before sessionId ready — ignoring.");
      return false;
    }

    try {
      const payloadObjetivo = overrideData && overrideData.objetivo !== undefined ? overrideData.objetivo : objetivo;
      const payloadPessoas = overrideData && overrideData.pessoas !== undefined ? overrideData.pessoas : pessoas;
      const payloadBanco = overrideData && overrideData.bancoEscolhido !== undefined ? overrideData.bancoEscolhido : bancoEscolhido;
      const payloadAportes = overrideData && overrideData.aportesExtras !== undefined ? overrideData.aportesExtras : aportesExtras;
      const payloadAportesRegulares = overrideData && overrideData.aportesRegularesEditados !== undefined ? overrideData.aportesRegularesEditados : aportesRegularesEditados;
      const payloadAportesRegularesPorPessoa = overrideData && overrideData.aportesRegularesEditadosPorPessoa !== undefined ? overrideData.aportesRegularesEditadosPorPessoa : aportesRegularesEditadosPorPessoa;
      const payloadMesesConcluidos = overrideData && overrideData.mesesConcluidos !== undefined ? overrideData.mesesConcluidos : mesesConcluidos;

      const draftToSave = {
        sessionId,
        objetivo: payloadObjetivo ? {
          ...payloadObjetivo,
          dataInicio: payloadObjetivo.dataInicio ? (payloadObjetivo.dataInicio instanceof Date ? payloadObjetivo.dataInicio.toISOString().slice(0,10) : new Date(payloadObjetivo.dataInicio).toISOString().slice(0,10)) : undefined
        } : null,
        pessoas: payloadPessoas,
        bancoEscolhido: payloadBanco,
        aportesExtras: payloadAportes,
        aportesRegularesEditados: payloadAportesRegulares,
        aportesRegularesEditadosPorPessoa: payloadAportesRegularesPorPessoa,
        mesesConcluidos: payloadMesesConcluidos
      };

      // Save local fallback
      localStorage.setItem("imovplan_draft", JSON.stringify(draftToSave));

      // Sync to backend with retry on server errors (5xx)
      if (planoId && !planoId.startsWith("local-draft-")) {
        const maxRetries = 3;
        const retryDelay = (attempt: number) => new Promise(res => setTimeout(res, attempt * 500));
        let attempt = 0;
        let success = false;
        while (attempt < maxRetries && !success) {
          try {
            const res = await api.put(`/plano/draft/${planoId}`, draftToSave);
            if (res.status === 200) {
              success = true;
            } else if (res.status >= 500) {
              console.warn(`Tentativa ${attempt + 1} falhou ao sincronizar draft (status ${res.status}). Retentando...`);
              await retryDelay(attempt + 1);
            } else {
              console.error(`Erro ao sincronizar draft com backend: ${res.status} ${res.statusText}`);
              break;
            }
          } catch (e) {
            console.error("Network error while syncing draft:", e);
            await retryDelay(attempt + 1);
          }
          attempt++;
        }
        if (!success) {
          console.error("Failed to sync draft after retries.");
        } else {
          // Refresh state from backend after successful save
          await reloadDraft();
        }
      }

      return true;
    } catch (err) {
      console.error("Failed to save draft:", err);
      return false;
    }
  };

  return (
    <PlanContext.Provider value={{
      objetivo, setObjetivo,
      pessoas, setPessoas,
      aportesExtras, setAportesExtras,
      planoId,
      sessionId,
      saveDraft,
      reloadDraft,
      bancoEscolhido, setBancoEscolhido,
      cenario, setCenario,
      aportesRegularesEditados, setAportesRegularesEditados,
      aportesRegularesEditadosPorPessoa, setAportesRegularesEditadosPorPessoa,
      mesesConcluidos, setMesesConcluidos,
    }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlanContext() {
  const context = useContext(PlanContext);
  if (!context) {
    throw new Error("usePlanContext must be used within a PlanProvider");
  }
  return context;
}
