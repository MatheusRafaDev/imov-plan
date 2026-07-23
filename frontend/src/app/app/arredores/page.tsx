import MapaArredores from "@/components/MapaArredores";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Avaliar Região | Casal Planner",
    description: "Avalie os arredores do seu futuro imóvel",
};

export default function ArredoresPage() {
    return (
        <div className="h-[calc(100vh-4rem)] flex-1 overflow-hidden">
            <MapaArredores />
        </div>
    );
}
