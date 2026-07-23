import api from "@/lib/api";

export interface FinancialRates {
    selic: number;
    cdi: number;
    ipca: number;
}

export interface AddressData {
    cep: string;
    street: string;
    neighborhood: string;
    city: string;
    state: string;
}

export const ExternalDataService = {
    async getCurrentRates(): Promise<FinancialRates> {
        const response = await api.get<FinancialRates>('/rates/current');
        return response.data;
    },

    async getAddressByCep(cep: string): Promise<AddressData> {
        const response = await api.get<AddressData>(`/location/cep/${cep}`);
        return response.data;
    }
};
