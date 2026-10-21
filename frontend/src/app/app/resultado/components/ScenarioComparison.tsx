"use client";

import { usePlanLogic } from "@/hooks/usePlanLogic";;
import { simular, CenarioSimulacao } from "@/lib/finance";
import { brl, percentualCdiPorTipoInvestimento } from "@/lib/finance";
import { Loader2 } from "lucide-react";
import { parseBackendDate } from "@/utils/dates";

export function ScenarioComparison() {
  const { objetivo, pessoas, aportesExtras, aportesRegularesEditados, cenarioSimulacao, setCenarioSimulacao, calculating } = usePlanLogic();

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
    respeitarPrazoMaximo: Number(objetivo.prazoMaxMeses) > 0,
    dataInicio: parseBackendDate(objetivo.dataInicio as string | Date | null | undefined) ?? new Date(),
    checkpoints: pessoas
      .filter((p) => p.valorAtual != null && p.dataValorAtual)
      .map((p) => ({
        valorInicial: Number(p.valorInicial) || 0,
        valorAtual: Number(p.valorAtual) || 0,
        dataValorAtual: p.dataValorAtual as string,
      })),
  };

  const results: Record<CenarioSimulacao, ReturnType<typeof simular>> = {
    pessimista: simular({ ...input, cenario: "pessimista", pularSugestoes: true }),
    realista: simular({ ...input, cenario: "realista", pularSugestoes: true }),
    otimista: simular({ ...input, cenario: "otimista", pularSugestoes: true })
  };

  const scenarios: { key: CenarioSimulacao; label: string; cdi: string }[] = [
    { key: "pessimista", label: "Pessimista", cdi: "CDI −2%" },
    { key: "realista",   label: "Realista",   cdi: "CDI atual" },
    { key: "otimista",   label: "Otimista",   cdi: "CDI +2%" },
  ];

  const chipBase = "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium transition-all duration-150 cursor-pointer whitespace-nowrap";

  const chipStyle = (key: CenarioSimulacao, isSelected: boolean) => {
    let base = chipBase;
    if (calculating && !isSelected) base += " opacity-50 cursor-not-allowed";
    
    if (!isSelected) return `${base} border-border/40 text-muted-foreground/60 hover:border-border hover:text-muted-foreground`;
    if (key === "pessimista") return `${base} border-destructive/40 bg-destructive/10 text-destructive font-medium`;
    if (key === "realista")   return `${base} border-accent/40 bg-accent/10 text-accent font-medium`;
    return                           `${base} border-success/40 bg-success/10 text-success font-semibold`;
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap mt-2">
      <span className="text-[10px] text-muted-foreground/40 font-medium">Cenário:</span>
      {scenarios.map(({ key, label, cdi }) => {
        const r = results[key];
        const isSelected = key === cenarioSimulacao;
        return (
          <button key={key} onClick={() => setCenarioSimulacao(key)} disabled={calculating} className={chipStyle(key, isSelected)}>
            {isSelected && !calculating && <span>✓</span>}
            {isSelected && calculating && <Loader2 className="w-3 h-3 animate-spin" />}
            <span>{label}</span>
            <span className="opacity-50">{cdi}</span>
            <span className="opacity-30">·</span>
            <span>{r.mesAtingiuMeta !== undefined ? `${r.mesAtingiuMeta}m` : "—"}</span>
            <span className="opacity-30">·</span>
            <span>{brl(r.lucroLiquido)}</span>
          </button>
        );
      })}
    </div>
  );
}
