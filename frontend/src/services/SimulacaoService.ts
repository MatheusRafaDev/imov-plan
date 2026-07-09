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

export class SimulacaoService {
  static async salvarRegistroSimulacao(payload: any) {
    const response = await api.post("/simulacao", payload);
    return response.data;
  }

  /** GET /api/simulacao/{planoId}/ultima — Carrega última simulação do banco */
  static async getUltimaSimulacao(planoId: string): Promise<BackendSimulacaoResult | null> {
    try {
      const response = await api.get(`/simulacao/${planoId}/ultima`);
      return response.data;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /** POST /api/simulacao/{planoId}/calcular — Recalcula do zero e retorna */
  static async calcularSimulacao(planoId: string, payload: {
    objetivoId: string;
    taxaCDI: number;
    percentualCdi: number;
    aportesMensais: { pessoaId: string; valor: number }[];
    aportesExtras: { pessoaId: string; valor: number; data: string; origem: string }[];
    aportesRegularesEditados?: Record<number, number>;
    aportesRegularesEditadosPorPessoa?: Record<string, Record<number, number>>;
  }): Promise<BackendSimulacaoResult> {
    const response = await api.post(`/simulacao/${planoId}/calcular`, payload);
    return response.data;
  }
}