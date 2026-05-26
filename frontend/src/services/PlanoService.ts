import api from "@/lib/api";

export class PlanoService {
  static async getDraft(id: string, sessionId: string) {
    const response = await api.get(`/plano/draft/${id}?sessionId=${sessionId}`);
    return response.data;
  }

  static async createDraft(sessionId: string) {
    const response = await api.post(`/plano/draft?sessionId=${sessionId}`);
    return response.data;
  }

  static async updateDraft(id: string, payload: any) {
    const response = await api.put(`/plano/draft/${id}`, payload);
    return response.data;
  }
}
