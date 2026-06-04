"use client";

import React, { createContext, useState, useContext, ReactNode } from "react";
import type { SimInput, Aporte } from "@/lib/finance";
import Cookies from "js-cookie";

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
    mesesConcluidos?: number[];
  }) => Promise<boolean>;
  bancoEscolhido: Banco | null;
  setBancoEscolhido: React.Dispatch<React.SetStateAction<Banco | null>>;
  cenario: CenarioCompra;
  setCenario: React.Dispatch<React.SetStateAction<CenarioCompra>>;
  aportesRegularesEditados: Record<number, number>;
  setAportesRegularesEditados: React.Dispatch<React.SetStateAction<Record<number, number>>>;
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

      try {
        if (localPlanoId) {
          // Fetch existing draft from backend
          const res = await fetch(`http://localhost:5179/api/plano/draft/${localPlanoId}?sessionId=${localSessionId}`);
          if (res.ok) {
            const data = await res.json();
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
            if (data.mesesConcluidos) setMesesConcluidos(data.mesesConcluidos);
            
            setPlanoId(localPlanoId);
            return;
          }
        }
        
        // Load fallback from localStorage if backend fails or doesn't have it
        const savedDraft = localStorage.getItem("imovplan_draft");
        if (savedDraft) {
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
          if (data.mesesConcluidos) setMesesConcluidos(data.mesesConcluidos);
        }

        // Create new draft in backend ONLY IF we didn't just load a valid one
        const resPost = await fetch(`http://localhost:5179/api/plano/draft?sessionId=${localSessionId}`, { method: "POST" });
        if (resPost.ok) {
          const dataPost = await resPost.json();
          setPlanoId(dataPost.id);
          Cookies.set("imovplan_planoId", dataPost.id, { expires: 30 });
          
          // Force a sync to save the localStorage data to the new draft immediately
          if (savedDraft) {
             try {
                await fetch(`http://localhost:5179/api/plano/draft/${dataPost.id}`, {
                   method: "PUT",
                   headers: { "Content-Type": "application/json" },
                   body: savedDraft // already a JSON string
                });
             } catch (e) {
                console.error("Falha ao sincronizar draft local para o novo id", e);
             }
          }
        } else {
          setPlanoId("local-draft-" + localSessionId);
        }

      } catch (err) {
        console.error("Erro ao carregar rascunho do backend, usando local:", err);
        setPlanoId("local-draft-" + localSessionId);
      }
    };

    initDraft();
  }, []);

  const saveDraft = async (overrideData?: {
    objetivo?: Partial<SimInput> | null;
    pessoas?: Pessoa[];
    bancoEscolhido?: Banco | null;
    aportesExtras?: Aporte[];
    aportesRegularesEditados?: Record<number, number>;
    mesesConcluidos?: number[];
  }): Promise<boolean> => {
    if (!sessionId) {
      console.warn("saveDraft chamado antes do sessionId estar pronto — ignorando.");
      return false;
    }

    try {
      const payloadObjetivo = overrideData && overrideData.objetivo !== undefined ? overrideData.objetivo : objetivo;
      const payloadPessoas = overrideData && overrideData.pessoas !== undefined ? overrideData.pessoas : pessoas;
      const payloadBanco = overrideData && overrideData.bancoEscolhido !== undefined ? overrideData.bancoEscolhido : bancoEscolhido;
      const payloadAportes = overrideData && overrideData.aportesExtras !== undefined ? overrideData.aportesExtras : aportesExtras;
      const payloadAportesRegulares = overrideData && overrideData.aportesRegularesEditados !== undefined ? overrideData.aportesRegularesEditados : aportesRegularesEditados;
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
        mesesConcluidos: payloadMesesConcluidos
      };

      // Save local fallback
      localStorage.setItem("imovplan_draft", JSON.stringify(draftToSave));

      // Sync to backend if we have a valid planoId
      if (planoId && !planoId.startsWith("local-draft-")) {
        const res = await fetch(`http://localhost:5179/api/plano/draft/${planoId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draftToSave)
        });
        if (!res.ok) {
          console.error(`Erro ao sincronizar draft com backend: ${res.status} ${res.statusText}`);
        }
      }

      return true;
    } catch (err) {
      console.error("Falha ao salvar rascunho:", err);
      return false;
    }
  };

  return (
    <PlanContext.Provider value={{
      objetivo, setObjetivo,
      pessoas, setPessoas,
      aportesExtras, setAportesExtras,
      planoId, sessionId, saveDraft,
      bancoEscolhido, setBancoEscolhido,
      cenario, setCenario,
      aportesRegularesEditados, setAportesRegularesEditados,
      mesesConcluidos, setMesesConcluidos
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
