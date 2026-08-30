"use client";

import React, { useMemo, useState } from "react";
import { usePlanContext } from "@/context/PlanContext";
import { brl } from "@/lib/finance";
import { Check, Calendar } from "lucide-react";
import { MoneyInput } from "@/components/MoneyInput";

function Th({ children, right, className = "" }: { children?: React.ReactNode; right?: boolean; className?: string }) {
  return <th className={`px-2.5 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap ${right ? "text-right" : "text-left"} ${className}`}>{children}</th>;
}

function Td({ children, right, className = "", suppressHydrationWarning }: { children?: React.ReactNode; right?: boolean; className?: string; suppressHydrationWarning?: boolean }) {
  return <td suppressHydrationWarning={suppressHydrationWarning} className={`px-2.5 py-2.5 num text-xs sm:text-sm text-foreground whitespace-nowrap ${right ? "text-right" : "text-left"} ${className}`}>{children}</td>;
}

const InlineAporteEditor = ({ initialValue, planejado, onSave }: { initialValue: number; planejado: number; onSave: (val: number) => void }) => {
  const [val, setVal] = useState(initialValue);
  const diff = val - planejado;
  
  return (
    <div className="flex flex-col items-end gap-1">
      <MoneyInput
        variant="money"
        min={0}
        value={val}
        onChange={(v) => setVal(v === "" ? 0 : v)}
        onBlur={() => onSave(val)}
        className={`h-8 w-24 text-right text-xs bg-background border ${val !== planejado ? 'border-accent text-accent' : 'border-border'}`}
      />
      {diff !== 0 && (
        <span className={`text-[9px] font-bold ${diff > 0 ? "text-success" : "text-destructive"}`}>
          {diff > 0 ? "▲" : "▼"} {brl(Math.abs(diff))}
        </span>
      )}
    </div>
  );
};

export const TabelaConciliacao = React.memo(function TabelaConciliacao() {
  const {
    pessoas,
    aportesExtras,
    setAportesRegularesEditadosPorPessoa,
    saveDraft,
    mesesConcluidos,
    setMesesConcluidos,
    backendData,
  } = usePlanContext();

  const [saving, setSaving] = useState(false);
  const mesesConcluidosSet = useMemo(() => new Set(mesesConcluidos), [mesesConcluidos]);

  const toggleConcluido = async (mes: number) => {
    let next: number[] = [];
    setMesesConcluidos(prev => {
      if (prev.includes(mes)) next = prev.filter(m => m !== mes);
      else next = [...prev, mes];
      return next;
    });
    setSaving(true);
    await saveDraft({ mesesConcluidos: next });
    setSaving(false);
  };

  const updateAporte = async (pessoaId: string, mes: number, novoValor: number) => {
    const defaultP = Number(pessoas.find(p => p.id === pessoaId)?.aporte_mensal) || 0;
    
    let finalState;
    setAportesRegularesEditadosPorPessoa(prev => {
      let newState = { ...prev };
      const pEdits = { ...(newState[pessoaId] || {}) };
      
      const isAlreadySame = pEdits[mes] === novoValor || (pEdits[mes] === undefined && novoValor === defaultP);
      if (isAlreadySame) return prev; // no change, don't trigger save
      
      if (novoValor === defaultP) {
        delete pEdits[mes];
      } else {
        pEdits[mes] = novoValor;
      }
      newState[pessoaId] = pEdits;
      finalState = newState;
      return newState;
    });

    if (finalState) {
      setSaving(true);
      await saveDraft({ aportesRegularesEditadosPorPessoa: finalState });
      setSaving(false);
    }
  };

  const sim = backendData;

  const displayRows = useMemo(() => {
    if (!sim || !sim.detalhesMensais) return [];
    
    return sim.detalhesMensais.map(r => ({
      mes: r.mes,
      data: new Date(r.dataReferencia).toISOString(),
      aporteRegular: r.aporteMensal,
      aportesExtras: r.aportesExtras,
      atingiu: sim.mesesParaAtingir === r.mes && sim.atingiuMeta,
      aporteFinalPorPessoa: Object.fromEntries(
        (r.participantes || []).map(p => [p.participanteId, p.aporteMensal])
      )
    }));
  }, [sim]);

  if (!displayRows.length) return <div className="p-4 text-center text-muted-foreground">Carregando dados da simulação...</div>;

  return (
    <div className="space-y-4 relative w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-light">Conciliação de Aportes</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Marque os meses concluídos e ajuste os valores reais aportados mês a mês.</p>
        </div>
        {saving && (
          <span className="text-xs text-muted-foreground animate-pulse">Salvando...</span>
        )}
      </div>

      <div className="overflow-x-auto bg-card custom-scrollbar -mx-4 sm:-mx-6 md:-mx-8 lg:mx-0 lg:rounded-xl lg:shadow-sm border-y sm:border border-border/40">
        <table className="w-full text-sm font-sans border-collapse relative">
          <thead className="bg-card text-muted-foreground sticky top-0 z-10 backdrop-blur-sm border-b border-border/60">
            <tr>
              <Th className="w-px">Mês</Th>
              <Th>Data</Th>
              {pessoas.map(p => (
                <Th key={p.id} right>{p.nome.split(" ")[0]} (Real)</Th>
              ))}
              <Th right>Extras</Th>
              <Th right>Total do Mês</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/10">
            {displayRows.map((r) => {
              const isMesConcluido = mesesConcluidosSet.has(r.mes);
              const isZero = r.mes === 0;
              const totalAporteMes = r.aporteRegular + r.aportesExtras;

              return (
                <tr 
                  key={r.mes} 
                  className={`transition-colors hover:bg-secondary/10 bg-card ${isMesConcluido ? "opacity-75 bg-secondary/5" : ""} ${r.atingiu ? "bg-success/5" : ""}`}
                >
                  <Td className="font-medium whitespace-nowrap w-px">
                    <div className="flex items-center gap-2">
                      {!isZero && (
                        <button
                          onClick={() => toggleConcluido(r.mes)}
                          className={`shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            isMesConcluido 
                              ? 'bg-primary border-primary text-primary-foreground' 
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          {isMesConcluido && <Check className="w-3 h-3" />}
                        </button>
                      )}
                      <span>
                        {isZero ? "Início" : `Mês ${r.mes}`}
                        {r.atingiu && (
                          <span className="ml-2 hidden sm:inline-flex items-center bg-success/10 text-success text-[10px] uppercase font-bold px-1.5 py-0.5 rounded tracking-wide border border-success/20">
                            Meta ✓
                          </span>
                        )}
                      </span>
                    </div>
                  </Td>
                  <Td suppressHydrationWarning className="text-muted-foreground text-xs">
                    {(() => { const d = new Date(r.data).toLocaleDateString("pt-BR", { month: "short", year: "2-digit", timeZone: "UTC" }).replace(" de ", " "); return d.charAt(0).toUpperCase() + d.slice(1); })()}
                  </Td>
                  
                  {pessoas.map(p => {
                    const planejado = Number(p.aporte_mensal) || 0;
                    const real = isZero ? (Number(p.valorInicial) || 0) : r.aporteFinalPorPessoa[p.id] || 0;
                    return (
                      <Td key={p.id} right>
                        {isZero ? (
                          <span className="text-muted-foreground">{brl(real)}</span>
                        ) : (
                          <InlineAporteEditor 
                            initialValue={real}
                            planejado={planejado}
                            onSave={(novoValor) => updateAporte(p.id, r.mes, novoValor)}
                          />
                        )}
                      </Td>
                    );
                  })}

                  <Td right className="text-muted-foreground">
                    {r.aportesExtras > 0 ? `+${brl(r.aportesExtras)}` : "—"}
                  </Td>

                  <Td right className="font-medium text-foreground">
                    {brl(totalAporteMes)}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});
