import api from "@/lib/api";

export class SimulacaoService {
  static async salvarRegistroSimulacao(payload: any) {
    const response = await api.post("/simulacao", payload);
    return response.data;
  }
}
