import api from "@/lib/api";

export interface BackendSimulacaoResult {
  id: string;
  planejamentoId: string;
  geradoEm: string;
  origem: string;
  versao: number;
  valorImovel: number;
  totalNecessario: number;
  valorJaGuardado: number;
  aporteMensalTotal: number;
  taxaCdiAnual: number;
  percentualCdi: number;
  mesesParaAtingir: number;
  dataPrevistaAlvo: string;
  totalInvestido: number;
  totalRetirado?: number;
  totalAcumulado: number;
  lucroLiquido: number;
  atingiuMeta: boolean;
  falta: number;
  detalhesMensais: BackendDetalheMensal[];
  participantesSnapshot: BackendParticipanteSnapshot[];
}

export interface BackendEvolucaoMensalParticipante {
  participanteId: string;
  nome: string;
  aporteMensal: number;
  aportesExtras: number;
  rendimentoLiquido: number;
  saldo: number;
}

export interface BackendDetalheMensal {
  mes: number;
  dataReferencia: string;
  aporteMensal: number;
  aportesExtras: number;
  retiradas?: number;
  rendimentoBruto: number;
  imposto: number;
  rendimentoLiquido: number;
  totalAcumulado: number;
  participantes: BackendEvolucaoMensalParticipante[];
}

export interface BackendParticipanteSnapshot {
  participanteId: string;
  nome: string;
  aporteMensal: number;
  valorInicial: number;
  sobraMensal: number;
}

export interface SimulacaoRequestPayload {
  objetivoId: string;
  valorJaGuardado?: number;
  valorImovel?: number;
  percentualEntrada?: number;
  percentualCustosExtras?: number;
  prazoMaxMeses?: number;
  dataInicio?: string;
  aportesMensais: { pessoaId: string; pessoaNome?: string; valor: number; valorAtual?: number; dataValorAtual?: string }[];
  aportesExtras: { pessoaId: string; valor: number; data: string; origem: string }[];
  aportesRegularesEditados?: Record<number, number>;
  aportesRegularesEditadosPorPessoa?: Record<string, Record<number, number>>;
  taxaCDI: number;
  percentualCdi: number;
  cenario?: string;
}

export class SimulacaoService {
  static async salvarRegistroSimulacao(planoId: string, payload: SimulacaoRequestPayload): Promise<BackendSimulacaoResult> {
    return this.calcularSimulacao(planoId, payload);
  }

  /** GET /api/simulacao/{planoId}/ultima — Carrega última simulação do banco */
  static async getUltimaSimulacao(planoId: string): Promise<BackendSimulacaoResult | null> {
    try {
      const response = await api.get(`/simulacao/${planoId}/ultima`);
      return response.data || null;
    } catch (error: any) {
      const status = error?.response?.status;
      // 404/204: sem simulação salva para o plano ainda
      // 500: falha no backend ao recuperar simulação anterior; retorna null para permitir novo cálculo
      if (status === 404 || status === 204 || status === 500) {
        return null;
      }
      throw error;
    }
  }

  /** POST /api/simulacao/{planoId}/calcular — Recalcula do zero e retorna */
  static async calcularSimulacao(planoId: string, payload: SimulacaoRequestPayload): Promise<BackendSimulacaoResult> {
    const response = await api.post(`/simulacao/${planoId}/calcular`, payload);
    return response.data;
  }
}
