"use client";

import React, { createContext, useState, useContext, ReactNode } from "react";
import type { SimInput, Aporte } from "@/lib/finance";

export type GastoDetalhado = {
  id: string;
  nome: string;
  valor: number;
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

  return (
    <PlanContext.Provider value={{ objetivo, setObjetivo, pessoas, setPessoas, aportesExtras, setAportesExtras }}>
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
