import api from "@/lib/api";

export class PlanoService {
  static async concluirPlano(id: string) {
    const response = await api.post(`/plano/${id}/concluir`);
    return response.data;
  }
}
