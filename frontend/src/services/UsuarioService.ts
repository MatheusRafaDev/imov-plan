import api from "@/lib/api";

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  dataNascimento: string | null;
  estadoCivil: string;
  rendaMensal: number;
  regimeTrabalho: string;
  saldoFgts: number;
  createdAt?: string;
};

export type UpdateProfilePayload = {
  name?: string;
  dataNascimento?: string;
  estadoCivil?: string;
  rendaMensal?: number;
  regimeTrabalho?: string;
  saldoFgts?: number;
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
}
