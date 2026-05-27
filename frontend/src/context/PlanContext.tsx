"use client";

import React, { createContext, useState, useContext, ReactNode } from "react";
import type { SimInput, Aporte } from "@/lib/finance";
import { PlanoService } from "@/services/PlanoService";
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
  }) => Promise<void>;
  bancoEscolhido: Banco | null;
  setBancoEscolhido: React.Dispatch<React.SetStateAction<Banco | null>>;
  cenario: CenarioCompra;
  setCenario: React.Dispatch<React.SetStateAction<CenarioCompra>>;
};

const PlanContext = createContext<PlanContextType | undefined>(undefined);

export function PlanProvider({ children }: { children: ReactNode }) {
  const [objetivo, setObjetivo] = useState<Partial<SimInput> | null>({
    valorImovel: 500000,
    percentualEntrada: 20,
    percentualCustosExtras: 5,
    valorJaGuardado: 10000,
    taxaCdiAnual: 13.65,
    percentualCdi: 100,
    dataInicio: new Date(),
    prazoMaxMeses: 36,
  });
  
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [aportesExtras, setAportesExtras] = useState<Aporte[]>([]);
  const [bancoEscolhido, setBancoEscolhido] = useState<Banco | null>(null);
  const [cenario, setCenario] = useState<CenarioCompra>(
    (Cookies.get("imovplan_cenario") as CenarioCompra) || "entrada"
  );
  
  const [planoId, setPlanoId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Initialize Session and Draft
  React.useEffect(() => {
    // Check local storage for existing session/draft
    let localSessionId = Cookies.get("imovplan_sessionId");
    let localPlanoId = Cookies.get("imovplan_planoId");

    if (!localSessionId) {
      localSessionId = Math.random().toString(36).substring(2, 15);
      Cookies.set("imovplan_sessionId", localSessionId, { expires: 30 });
    }
    setSessionId(localSessionId);

    const initDraft = async () => {
      try {
        if (localPlanoId) {
          try {
            const data = await PlanoService.getDraft(localPlanoId, localSessionId);
            if (data) {
              if (data.objetivo) {
                setObjetivo({
                  ...data.objetivo,
                  dataInicio: data.objetivo.dataInicio ? new Date(data.objetivo.dataInicio) : new Date()
                });
              }
              if (data.pessoas) setPessoas(data.pessoas);
              if (data.bancoEscolhido) setBancoEscolhido(data.bancoEscolhido);
              if (data.aportesExtras) setAportesExtras(data.aportesExtras);
              setPlanoId(localPlanoId);
              return;
            }
          } catch (e) {
            console.log("Draft não encontrado, criando novo...");
          }
        }
        
        // Create new draft if not found or no localPlanoId
        const data = await PlanoService.createDraft(localSessionId);
        if (data && data.id) {
          setPlanoId(data.id);
          Cookies.set("imovplan_planoId", data.id, { expires: 30 });
        }
      } catch (err) {
        console.error("Erro ao gerenciar rascunho:", err);
      }
    };

    initDraft();
  }, []);

  const saveDraft = async (overrideData?: {
    objetivo?: Partial<SimInput> | null;
    pessoas?: Pessoa[];
    bancoEscolhido?: Banco | null;
    aportesExtras?: Aporte[];
  }) => {
    if (!planoId || !sessionId) return;
    try {
      const payloadObjetivo = overrideData && overrideData.objetivo !== undefined ? overrideData.objetivo : objetivo;
      const payloadPessoas = overrideData && overrideData.pessoas !== undefined ? overrideData.pessoas : pessoas;
      const payloadBanco = overrideData && overrideData.bancoEscolhido !== undefined ? overrideData.bancoEscolhido : bancoEscolhido;
      const payloadAportes = overrideData && overrideData.aportesExtras !== undefined ? overrideData.aportesExtras : aportesExtras;

      await PlanoService.updateDraft(planoId, {
        sessionId,
        objetivo: payloadObjetivo ? {
          ...payloadObjetivo,
          dataInicio: payloadObjetivo.dataInicio?.toISOString().slice(0, 10)
        } : null,
        pessoas: payloadPessoas,
        bancoEscolhido: payloadBanco,
        aportesExtras: payloadAportes
      });
    } catch (err) {
      console.error("Falha ao salvar rascunho:", err);
    }
  };

  return (
    <PlanContext.Provider value={{ 
      objetivo, setObjetivo, 
      pessoas, setPessoas, 
      aportesExtras, setAportesExtras,
      planoId, sessionId, saveDraft,
      bancoEscolhido, setBancoEscolhido,
      cenario, setCenario
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
