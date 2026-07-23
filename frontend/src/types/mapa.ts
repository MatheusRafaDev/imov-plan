export interface PontoInteresse {
    idOsm: string;
    nome: string;
    categoria: string;
    latitude: number;
    longitude: number;
    distanciaMetros: number;
    tags: Record<string, string>;
}
