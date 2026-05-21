"use client";

import { useRouter } from "next/navigation";
import { usePlanContext } from "@/context/PlanContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Landmark, ArrowRight, Building, CheckCircle2 } from "lucide-react";

const bancosMock = [
  { id: "caixa", nome: "Caixa Econômica", taxa: 8.16, cor: "bg-blue-600/10 text-blue-500", border: "border-blue-500/30", destaque: "Melhor para Minha Casa Minha Vida" },
  { id: "itau", nome: "Itaú", taxa: 10.4, cor: "bg-orange-500/10 text-orange-500", border: "border-orange-500/30", destaque: "Melhor para Alta Renda (SBPE)" },
  { id: "santander", nome: "Santander", taxa: 10.9, cor: "bg-red-600/10 text-red-500", border: "border-red-500/30", destaque: "Bom para Portabilidade" },
  { id: "bradesco", nome: "Bradesco", taxa: 10.5, cor: "bg-red-700/10 text-red-600", border: "border-red-600/30", destaque: "" },
  { id: "bb", nome: "Banco do Brasil", taxa: 9.5, cor: "bg-yellow-500/10 text-yellow-600", border: "border-yellow-500/30", destaque: "Taxas Competitivas SBPE" }
];

export default function BancosPage() {
  const { bancoEscolhido, setBancoEscolhido } = usePlanContext();
  const router = useRouter();

  const prosseguir = () => {
    if (bancoEscolhido) {
      router.push("/app/financiamento");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
      <div>
        <p className="text-xs uppercase tracking-widest text-accent font-medium mb-2">Etapa 4 de 6</p>
        <h1 className="font-display text-4xl md:text-5xl mb-2 flex items-center gap-3">
          Escolha o Banco <Landmark className="h-8 w-8 text-accent" />
        </h1>
        <p className="text-muted-foreground">
          Baseado na consultoria da IA, escolha o banco que melhor atende o seu perfil. 
          Usaremos a taxa média atual desse banco para a simulação financeira exata.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bancosMock.map((banco) => {
          const selecionado = bancoEscolhido?.id === banco.id;
          
          return (
            <Card 
              key={banco.id} 
              className={`p-6 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-elevated relative overflow-hidden ${
                selecionado ? "ring-2 ring-accent border-accent shadow-glow" : "border-border shadow-soft"
              } ${banco.border}`}
              onClick={() => setBancoEscolhido({ id: banco.id, nome: banco.nome, taxa: banco.taxa })}
            >
              {selecionado && (
                <div className="absolute top-4 right-4 text-accent">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
              )}
              
              <div className={`h-12 w-12 rounded-xl grid place-items-center mb-4 ${banco.cor}`}>
                <Building className="h-6 w-6" />
              </div>
              
              <h3 className="font-display text-xl mb-1">{banco.nome}</h3>
              <p className="font-display text-3xl num text-foreground mb-4">
                {banco.taxa.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}% <span className="text-sm text-muted-foreground font-sans">a.a.</span>
              </p>
              
              {banco.destaque ? (
                <div className="inline-block bg-secondary px-3 py-1 rounded-full text-xs font-medium text-muted-foreground">
                  {banco.destaque}
                </div>
              ) : (
                <div className="h-6" /> // spacer
              )}
            </Card>
          );
        })}
      </div>

      <div className="flex justify-between items-center pt-8 border-t">
        <Button variant="ghost" onClick={() => router.push("/app/consultoria")}>
          Voltar para Consultoria
        </Button>
        <Button 
          size="lg" 
          className="bg-gradient-warm text-accent-foreground hover:opacity-90 shadow-glow"
          onClick={prosseguir}
          disabled={!bancoEscolhido}
        >
          Ir para Simulação <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
