import api from "@/lib/api";

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  dataNascimento: string | null;
  createdAt?: string;
};

export type UpdateProfilePayload = {
  name?: string;
  dataNascimento?: string;
};

export class UsuarioService {
  static async getProfile(id: string): Promise<UserProfile> {
    const response = await api.get(`/usuario/${id}`);
    return response.data;
  }

  static async updateProfile(id: string, payload: UpdateProfilePayload): Promise<UserProfile> {
    const response = await api.put(`/usuario/${id}`, payload);
    return response.data;
  }

  static async deleteAccount(id: string): Promise<void> {
    await api.delete(`/usuario/${id}`);
  }

  static async changePassword(id: string, senhaAtual: string, novaSenha: string): Promise<void> {
    await api.patch(`/usuario/${id}/senha`, { senhaAtual, novaSenha });
  }
}
