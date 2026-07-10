"use client";

import { usePlanContext } from "@/context/PlanContext";
import { simular, CenarioSimulacao } from "@/lib/finance";
import { Card } from "@/components/ui/card";
import { brl, percentualCdiPorTipoInvestimento } from "@/lib/finance";

export function ScenarioComparison() {
  const { objetivo, pessoas, aportesExtras, aportesRegularesEditados, cenarioSimulacao, setCenarioSimulacao } = usePlanContext();

  if (!objetivo || !objetivo.valorImovel) return null;

  const totalSaved = pessoas.reduce((sum, p) => sum + Number(p.valorInicial ?? 0), 0);
  const effectiveCdi = totalSaved <= 0
    ? Number(objetivo?.percentualCdi ?? 100)
    : pessoas.reduce((sum, p) => {
      const tipoPercent = p.tipoInvestimento
        ? percentualCdiPorTipoInvestimento(p.tipoInvestimento)
        : Number(objetivo?.percentualCdi ?? 100);
      return sum + tipoPercent * (Number(p.valorInicial ?? 0) / totalSaved);
    }, 0);

  const input = {
    valorImovel: Number(objetivo.valorImovel) || 0,
    percentualEntrada: Number(objetivo.percentualEntrada) || 0,
    percentualCustosExtras: Number(objetivo.percentualCustosExtras) || 0,
    valorJaGuardado: totalSaved,
    aporteMensalTotal: pessoas.reduce((sum, p) => sum + Number(p.aporte_mensal || 0), 0),
    aportesRegularesEditados: aportesRegularesEditados,
    taxaCdiAnual: Number(objetivo.taxaCdiAnual) || 10.5,
    percentualCdi: effectiveCdi,
    aportesExtras: aportesExtras.map(a => ({
        ...a,
        valor: Number(a.valor) || 0,
        data: a.data || new Date().toISOString()
    })),
    prazoMaxMeses: Number(objetivo.prazoMaxMeses) || 600,
    dataInicio: objetivo.dataInicio ? new Date(objetivo.dataInicio) : new Date(),
  };

  const results: Record<CenarioSimulacao, ReturnType<typeof simular>> = {
    pessimista: simular({ ...input, cenario: "pessimista", pularSugestoes: true }),
    realista: simular({ ...input, cenario: "realista", pularSugestoes: true }),
    otimista: simular({ ...input, cenario: "otimista", pularSugestoes: true })
  };

  const renderCard = (cenario: CenarioSimulacao, label: string, desc: string) => {
    const r = results[cenario];
    const isSelected = cenario === cenarioSimulacao;

    return (
      <Card 
        key={cenario}
        onClick={() => setCenarioSimulacao(cenario)}
        className={`p-5 flex flex-col gap-3 relative overflow-hidden transition-all duration-300 cursor-pointer ${isSelected ? "border-accent ring-1 ring-accent/20 bg-accent/10 shadow-md scale-[1.02]" : "border-border/50 bg-secondary/10 hover:bg-secondary/20 hover:border-accent/40"}`}
      >
        {isSelected && (
          <div className="absolute top-0 right-0 bg-accent text-accent-foreground text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-bl-lg">
            Atual
          </div>
        )}
        <div>
          <h3 className="font-display font-medium text-lg">{label}</h3>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Tempo p/ Meta</p>
            <p className="font-semibold text-lg num">{r.mesAtingiuMeta !== undefined ? `${r.mesAtingiuMeta} meses` : "Não atinge"}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Lucro c/ Juros</p>
            <p className="font-semibold text-lg text-success num">{brl(r.lucroLiquido)}</p>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-4 pt-6 border-t border-border/40">
      <div>
        <h2 className="font-display text-2xl font-light mb-1">E se a economia mudar?</h2>
        <p className="text-sm text-muted-foreground">Veja como as variações da taxa Selic/CDI impactam seu plano. Clique em um cenário para aplicá-lo em todo o planejamento.</p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-4">
        {renderCard("pessimista", "Pessimista", "Rendimento CDI cai 2% a.a.")}
        {renderCard("realista", "Realista", "CDI atual mantido constante")}
        {renderCard("otimista", "Otimista", "Rendimento CDI sobe 2% a.a.")}
      </div>
    </div>
  );
}
