import api from "@/lib/api";

export class ConsultoriaService {
  static async analisar(payload: any) {
    const response = await api.post("/consultoria/analisar", payload);
    return response.data;
  }
}
