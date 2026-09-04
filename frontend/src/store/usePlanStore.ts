import { create } from 'zustand';
import type { SimInput, Aporte, CenarioSimulacao } from '@/lib/finance';
import type { Pessoa, Banco } from '@/context/PlanContext';

export type CenarioCompra = "entrada" | "pronto" | "planta";

interface PlanState {
  objetivo: Partial<SimInput> | null;
  pessoas: Pessoa[];
  aportesExtras: Aporte[];
  bancoEscolhido: Banco | null;
  cenario: CenarioCompra;
  cenarioSimulacao: CenarioSimulacao;
  aportesRegularesEditados: Record<number, number>;
  aportesRegularesEditadosPorPessoa: Record<string, Record<number, number>>;
  mesesConcluidos: number[];

  // Setters
  setObjetivo: (objetivo: Partial<SimInput> | null | ((prev: Partial<SimInput> | null) => Partial<SimInput> | null)) => void;
  setPessoas: (pessoas: Pessoa[] | ((prev: Pessoa[]) => Pessoa[])) => void;
  setAportesExtras: (aportes: Aporte[] | ((prev: Aporte[]) => Aporte[])) => void;
  setBancoEscolhido: (banco: Banco | null | ((prev: Banco | null) => Banco | null)) => void;
  setCenario: (cenario: CenarioCompra | ((prev: CenarioCompra) => CenarioCompra)) => void;
  setCenarioSimulacao: (cenario: CenarioSimulacao | ((prev: CenarioSimulacao) => CenarioSimulacao)) => void;
  setAportesRegularesEditados: (aportes: Record<number, number> | ((prev: Record<number, number>) => Record<number, number>)) => void;
  setAportesRegularesEditadosPorPessoa: (aportes: Record<string, Record<number, number>> | ((prev: Record<string, Record<number, number>>) => Record<string, Record<number, number>>)) => void;
  setMesesConcluidos: (meses: number[] | ((prev: number[]) => number[])) => void;

  // Bulk set (useful when hydrating from API)
  hydrate: (data: Partial<PlanState>) => void;
  
  // Reset state
  reset: () => void;
}

const initialState = {
  objetivo: null,
  pessoas: [],
  aportesExtras: [],
  bancoEscolhido: null,
  cenario: "entrada" as CenarioCompra,
  cenarioSimulacao: "otimista" as CenarioSimulacao,
  aportesRegularesEditados: {},
  aportesRegularesEditadosPorPessoa: {},
  mesesConcluidos: [],
};

export const usePlanStore = create<PlanState>()((set) => ({
  ...initialState,

  setObjetivo: (update) => set((state) => ({
    objetivo: typeof update === 'function' ? update(state.objetivo) : update
  })),
  setPessoas: (update) => set((state) => ({
    pessoas: typeof update === 'function' ? update(state.pessoas) : update
  })),
  setAportesExtras: (update) => set((state) => ({
    aportesExtras: typeof update === 'function' ? update(state.aportesExtras) : update
  })),
  setBancoEscolhido: (update) => set((state) => ({
    bancoEscolhido: typeof update === 'function' ? update(state.bancoEscolhido) : update
  })),
  setCenario: (update) => set((state) => ({
    cenario: typeof update === 'function' ? update(state.cenario) : update
  })),
  setCenarioSimulacao: (update) => set((state) => ({
    cenarioSimulacao: typeof update === 'function' ? update(state.cenarioSimulacao) : update
  })),
  setAportesRegularesEditados: (update) => set((state) => ({
    aportesRegularesEditados: typeof update === 'function' ? update(state.aportesRegularesEditados) : update
  })),
  setAportesRegularesEditadosPorPessoa: (update) => set((state) => ({
    aportesRegularesEditadosPorPessoa: typeof update === 'function' ? update(state.aportesRegularesEditadosPorPessoa) : update
  })),
  setMesesConcluidos: (update) => set((state) => ({
    mesesConcluidos: typeof update === 'function' ? update(state.mesesConcluidos) : update
  })),

  hydrate: (data) => set((state) => ({ ...state, ...data })),
  
  reset: () => set(initialState),
}));
