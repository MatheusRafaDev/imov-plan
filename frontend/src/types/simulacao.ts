// ─── Tipos Centralizados da Simulação ────────────────────────────────────────
// Todos os componentes da Etapa 4 devem usar esses tipos.
// O frontend NUNCA recalcula valores financeiros — apenas exibe o que a API retorna.

import type { BackendSimulacaoResult, BackendDetalheMensal, BackendEvolucaoMensalParticipante } from "@/services/SimulacaoService";

// Re-export for convenience
export type { BackendSimulacaoResult, BackendDetalheMensal, BackendEvolucaoMensalParticipante };

/** Dados agregados por participante, extraídos da última linha da API */
export interface ParticipanteSummary {
  participanteId: string;
  nome: string;
  valorInicial: number;       // snapshot no início
  aportadoTotal: number;      // soma de aportes regulares + extras (acumulado)
  rendimentoTotal: number;    // soma de rendimentos líquidos (acumulado)
  saldoFinal: number;         // saldo na última linha relevante
  percentualDoTotal: number;  // saldoFinal / totalAcumulado * 100
}

/** Sumário financeiro global extraído diretamente da API */
export interface SimulacaoSummary {
  totalNecessario: number;
  valorJaGuardado: number;
  totalInvestido: number;
  totalAcumulado: number;
  lucroLiquido: number;
  atingiuMeta: boolean;
  mesesParaAtingir: number;
  dataPrevistaAlvo: string;
  falta: number;
}

/** Dado de uma linha do gráfico */
export interface ChartDataPoint {
  mes: number;
  label: string;
  investido: number;
  saldo: number;
}
