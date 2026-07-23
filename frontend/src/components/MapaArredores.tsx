"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, MapPin, ShoppingCart, Cross, BookOpen, Coffee, TreePine, Stethoscope, Navigation, Loader2 } from "lucide-react";
import type { PontoInteresse } from "@/types/mapa";
import { toast } from "sonner";
import api from "@/lib/api";

// Next.js dynamic import for Leaflet (must be client side only)
const DynamicMap = dynamic(() => import("@/components/DynamicMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-muted text-muted-foreground">Carregando mapa...</div>
});

const getIconForCategory = (categoria: string) => {
    switch (categoria.toLowerCase()) {
        case 'mercado': return <ShoppingCart className="h-5 w-5 text-blue-500" />;
        case 'farmacia': return <Cross className="h-5 w-5 text-red-500" />;
        case 'escola': return <BookOpen className="h-5 w-5 text-yellow-500" />;
        case 'padaria': return <Coffee className="h-5 w-5 text-orange-500" />;
        case 'parque': return <TreePine className="h-5 w-5 text-green-500" />;
        case 'hospital': return <Stethoscope className="h-5 w-5 text-red-600" />;
        default: return <MapPin className="h-5 w-5 text-gray-500" />;
    }
}

export default function MapaArredores() {
    const [endereco, setEndereco] = useState("");
    const [center, setCenter] = useState<[number, number]>([-23.5505, -46.6333]); // SP base
    const [pontos, setPontos] = useState<PontoInteresse[]>([]);
    const [loading, setLoading] = useState(false);
    const [raio] = useState(2000);
    const [sugestoes, setSugestoes] = useState<any[]>([]);
    const [mostrandoSugestoes, setMostrandoSugestoes] = useState(false);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (!endereco.trim() || endereco.length < 3) {
            setSugestoes([]);
            setMostrandoSugestoes(false);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            try {
                const res = await api.get(`/Location/search?q=${encodeURIComponent(endereco)}`);
                const data = res.data;
                setSugestoes(data);
                setMostrandoSugestoes(true);
            } catch (e) {
                console.error("Erro ao buscar sugestões", e);
            }
        }, 1000);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [endereco]);

    const selecionarSugestao = async (sugestao: any) => {
        setEndereco(sugestao.display_name);
        setMostrandoSugestoes(false);
        const lat = parseFloat(sugestao.lat);
        const lon = parseFloat(sugestao.lon);
        setCenter([lat, lon]);
        await buscarArredoresPorCoordenadas(lat, lon);
    };

    const handleMapClick = async (lat: number, lng: number) => {
        setCenter([lat, lng]);
        setEndereco("Buscando endereço...");
        
        try {
            // Reverse Geocoding
            const res = await api.get(`/Location/reverse?lat=${lat}&lon=${lng}`);
            const data = res.data;
            if (data && data.display_name) {
                setEndereco(data.display_name);
            } else {
                setEndereco(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
            }
        } catch (e) {
            setEndereco(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        }

        buscarArredoresPorCoordenadas(lat, lng);
    };

    const abortControllerRef = useRef<AbortController | null>(null);

    const buscarArredoresPorCoordenadas = async (lat: number, lon: number) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        setLoading(true);
        setPontos([]);
        try {
            const response = await api.get<PontoInteresse[]>('/Arredores/pontos-interesse', {
                params: { lat, lng: lon, raio },
                signal: abortControllerRef.current.signal
            });
            
            const data = response.data;
            setPontos(data);
            if (data.length === 0) {
                 toast.info("Nenhum local encontrado nos arredores.");
            } else {
                 toast.success(`${data.length} locais encontrados nos arredores.`);
            }
        } catch (error: any) {
            if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
                console.log("Requisição anterior cancelada.");
                return;
            }
            console.error(error);
            toast.error("Falha ao buscar os dados da região.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Dispara a busca inicial imediatamente usando o centro padrão
        buscarArredoresPorCoordenadas(center[0], center[1]);

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    setCenter([lat, lon]);
                    buscarArredoresPorCoordenadas(lat, lon);
                    toast.success("Localização encontrada!");
                },
                (error) => {
                    console.log("Geolocalização não permitida ou falhou.", error);
                }
            );
        }
    }, []);

    const buscarEnderecoEArredores = async () => {
        if (!endereco.trim()) {
            toast.error("Digite um endereço para buscar.");
            return;
        }

        setLoading(true);
        try {
            // 1. Geocoding via Nominatim
            const geocodeRes = await api.get(`/Location/search?q=${encodeURIComponent(endereco)}`);
            const geocodeData = geocodeRes.data;

            if (!geocodeData || geocodeData.length === 0) {
                toast.error("Endereço não encontrado.");
                setLoading(false);
                return;
            }

            const lat = parseFloat(geocodeData[0].lat);
            const lon = parseFloat(geocodeData[0].lon);
            setCenter([lat, lon]);

            await buscarArredoresPorCoordenadas(lat, lon);

        } catch (error) {
            console.error(error);
            toast.error("Falha ao buscar os dados da região.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)] md:h-full gap-4 p-4 overflow-hidden">
            {/* Sidebar with Search and Results */}
            <div className="order-2 md:order-1 w-full md:w-1/3 flex flex-col flex-1 md:h-full gap-4 overflow-hidden md:pr-2">
                <Card className="shadow-md border-border/50">
                    <div className="flex flex-col space-y-1.5 p-5 pb-3">
                        <h3 className="font-semibold leading-none tracking-tight text-xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Avaliar Região</h3>
                    </div>
                    <div className="p-5 pt-0 flex flex-col gap-3">
                            <div className="flex flex-col gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase">CEP (Opcional)</label>
                                    <Input 
                                        placeholder="00000-000" 
                                        maxLength={9}
                                        className="w-40"
                                        onChange={async (e) => {
                                            const val = e.target.value.replace(/\D/g, "");
                                            if (val.length === 8) {
                                                try {
                                                    const { ExternalDataService } = await import("@/services/ExternalDataService");
                                                    const data = await ExternalDataService.getAddressByCep(val);
                                                    if (data) {
                                                        const fullAddress = `${data.street}, ${data.neighborhood}, ${data.city} - ${data.state}`;
                                                        setEndereco(fullAddress);
                                                        setMostrandoSugestoes(false);
                                                    }
                                                } catch (err) {
                                                    toast.error("CEP não encontrado.");
                                                }
                                            }
                                        }}
                                    />
                                </div>
                                
                                <div className="flex flex-col relative w-full gap-2">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase">Endereço do Imóvel</label>
                                    <div className="flex gap-2">
                                        <Input 
                                            placeholder="Digite o endereço..." 
                                            value={endereco}
                                            onChange={(e) => setEndereco(e.target.value)}
                                            onFocus={() => sugestoes.length > 0 && setMostrandoSugestoes(true)}
                                            onBlur={() => setTimeout(() => setMostrandoSugestoes(false), 200)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    setMostrandoSugestoes(false);
                                                    buscarEnderecoEArredores();
                                                }
                                            }}
                                            className="flex-1"
                                        />
                                        <Button onClick={() => { setMostrandoSugestoes(false); buscarEnderecoEArredores(); }} disabled={loading}>
                                            <Search className="h-4 w-4" />
                                        </Button>
                                        <Button variant="outline" onClick={() => {
                                            if ("geolocation" in navigator) {
                                                navigator.geolocation.getCurrentPosition(
                                                    (pos) => {
                                                        setCenter([pos.coords.latitude, pos.coords.longitude]);
                                                        buscarArredoresPorCoordenadas(pos.coords.latitude, pos.coords.longitude);
                                                    },
                                                    (err) => {
                                                        toast.error("Permissão de localização negada pelo navegador.");
                                                    }
                                                );
                                            }
                                        }} title="Usar minha localização atual">
                                            <Navigation className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    {/* Autocomplete Dropdown */}
                                    {mostrandoSugestoes && sugestoes.length > 0 && (
                                        <div className="absolute top-[68px] left-0 right-24 bg-background border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                                            {sugestoes.map((sug, idx) => (
                                                <button
                                                    key={idx}
                                                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted focus:bg-muted focus:outline-none border-b last:border-0"
                                                    onMouseDown={() => selecionarSugestao(sug)} // onMouseDown fires before onBlur
                                                >
                                                    {sug.display_name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        <div className="text-sm text-muted-foreground mt-1">
                            Buscando num raio de {raio / 1000}km
                        </div>
                    </div>
                </Card>

                <div className="flex-1 overflow-y-auto flex flex-col gap-3 pb-2 md:pb-0 pr-1 custom-scrollbar">
                    {loading && (
                        <div className="animate-pulse flex flex-col gap-3">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="h-[76px] bg-muted/60 rounded-xl" />
                            ))}
                        </div>
                    )}

                    {!loading && pontos.length === 0 && (
                        <div className="text-center p-8 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                            <MapPin className="mx-auto h-8 w-8 mb-2 opacity-50" />
                            Nenhum resultado ainda. Busque um endereço para ver os arredores.
                        </div>
                    )}

                    {!loading && pontos.map(ponto => (
                        <Card key={ponto.idOsm} className="shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 group cursor-default bg-card/80 backdrop-blur-sm border-border/50 rounded-xl overflow-hidden">
                            <div className="p-3.5 flex items-center gap-3.5">
                                <div className="p-2.5 bg-muted group-hover:bg-primary/10 transition-colors rounded-xl shadow-sm">
                                    {getIconForCategory(ponto.categoria)}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <h4 className="font-semibold text-sm truncate group-hover:text-primary transition-colors" title={ponto.nome}>
                                        {ponto.nome}
                                    </h4>
                                    <div className="flex items-center mt-1">
                                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full">
                                            {ponto.categoria}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right whitespace-nowrap flex flex-col items-end justify-center">
                                    <div className="bg-primary/10 text-primary font-bold text-xs px-2.5 py-1 rounded-lg">
                                        {Math.round(ponto.distanciaMetros)}m
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Map Area */}
            <div className="order-1 md:order-2 w-full md:w-2/3 h-[40vh] md:h-full shrink-0 bg-muted rounded-lg overflow-hidden border shadow-sm relative z-0">
                <DynamicMap center={center} pontos={pontos} raio={raio} onMapClick={handleMapClick} />
                {loading && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <span className="text-sm font-medium text-foreground">Buscando arredores...</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
