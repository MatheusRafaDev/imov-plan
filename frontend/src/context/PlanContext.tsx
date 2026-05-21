"use client";

import React, { createContext, useState, useContext, ReactNode } from "react";
import type { SimInput, Aporte } from "@/lib/finance";

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
  saveDraft: () => Promise<void>;
  bancoEscolhido: Banco | null;
  setBancoEscolhido: React.Dispatch<React.SetStateAction<Banco | null>>;
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
  
  const [planoId, setPlanoId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Initialize Session and Draft
  React.useEffect(() => {
    // Check local storage for existing session/draft
    let localSessionId = localStorage.getItem("imovplan_sessionId");
    let localPlanoId = localStorage.getItem("imovplan_planoId");

    if (!localSessionId) {
      localSessionId = Math.random().toString(36).substring(2, 15);
      localStorage.setItem("imovplan_sessionId", localSessionId);
    }
    setSessionId(localSessionId);

    const initDraft = async () => {
      try {
        if (localPlanoId) {
          // Fetch existing draft
          const res = await fetch(`http://localhost:5179/api/plano/draft/${localPlanoId}?sessionId=${localSessionId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.objetivo) setObjetivo(data.objetivo);
            if (data.pessoas) setPessoas(data.pessoas);
            setPlanoId(localPlanoId);
            return;
          }
        }
        
        // Create new draft if not found or no localPlanoId
        const res = await fetch(`http://localhost:5179/api/plano/draft?sessionId=${localSessionId}`, { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          setPlanoId(data.id);
          localStorage.setItem("imovplan_planoId", data.id);
        }
      } catch (err) {
        console.error("Erro ao gerenciar rascunho:", err);
      }
    };

    initDraft();
  }, []);

  const saveDraft = async () => {
    if (!planoId || !sessionId) return;
    try {
      await fetch(`http://localhost:5179/api/plano/draft/${planoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          objetivo,
          pessoas
        })
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
      bancoEscolhido, setBancoEscolhido
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
