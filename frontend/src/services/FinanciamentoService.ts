import api from "@/lib/api";

export class FinanciamentoService {
  static async simular(payload: any) {
    const response = await api.post("/financiamento/simular", payload);
    return response.data;
  }
}
