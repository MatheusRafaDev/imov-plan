"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlanContext } from "@/context/PlanContext";
import { brl } from "@/lib/finance";
import { Check, Edit2, Hourglass, CopyCheck } from "lucide-react";
import { toast } from "sonner";

export const TabelaConciliacao = React.memo(function TabelaConciliacao() {
  const router = useRouter();
  const {
    pessoas,
    mesesConcluidos,
    backendData,
    aportesExtras,
    aportesRegularesEditadosPorPessoa,
    planos,
    planoId
  } = usePlanContext();

  const [saving, setSaving] = useState(false);
  const mesesConcluidosSet = useMemo(() => new Set(mesesConcluidos), [mesesConcluidos]);
  const sim = backendData;

  const aplicarATodos = async () => {
    const api = (await import("@/lib/api")).default;
    const toastId = toast.loading("Aplicando valores reais a todos os planos...");
    setSaving(true);
    
    try {
      const promises = planos.filter(p => p.id !== planoId).map(async (p) => {
        const res = await api.get(`/plano/draft/${p.id}`);
        const draft = res.data;
        if (draft) {
          draft.mesesConcluidos = mesesConcluidos;
          draft.aportesExtras = aportesExtras;

          // Map edits by name since IDs might differ across drafts
          const newEditsPorPessoa: Record<string, Record<number, number>> = {};
          if (draft.pessoas) {
            for (const draftPessoa of draft.pessoas) {
              const currentPessoa = pessoas.find(cp => cp.nome === draftPessoa.nome);
              if (currentPessoa && aportesRegularesEditadosPorPessoa[currentPessoa.id]) {
                newEditsPorPessoa[draftPessoa.id] = aportesRegularesEditadosPorPessoa[currentPessoa.id];
              }
            }
          }
          draft.aportesRegularesEditadosPorPessoa = newEditsPorPessoa;

          await api.put(`/plano/draft/${p.id}`, draft);
        }
      });
      await Promise.all(promises);
      toast.success("Valores reais aplicados a todos os planos!", { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error("Erro ao aplicar aos outros planos.", { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const displayRows = useMemo(() => {
    if (!sim || !sim.detalhesMensais) return [];
    
    // Calcula o limite de meses para exibir. Mostramos até o primeiro mês pendente, ignorando o mês 0.
    const detalhesSemZero = sim.detalhesMensais.filter(d => d.mes > 0);
    const primeiroPendenteIndex = detalhesSemZero.findIndex(d => !mesesConcluidosSet.has(d.mes));
    
    // Quantos meses exibir (se todos concluidos, mostra todos. Se houver pendentes, mostra até o primeiro pendente)
    const limit = primeiroPendenteIndex >= 0 ? primeiroPendenteIndex + 1 : detalhesSemZero.length;
    
    return detalhesSemZero.slice(0, limit).map(r => {
      const planejado = pessoas.reduce((s, p) => s + (Number(p.aporte_mensal) || 0), 0);
      const totalAporteMes = r.aporteMensal + r.aportesExtras;
      
      return {
        mes: r.mes,
        data: new Date(r.dataReferencia).toISOString(),
        totalPlanejado: planejado,
        totalRealizado: totalAporteMes,
        isConcluido: mesesConcluidosSet.has(r.mes),
        atingiu: sim.mesesParaAtingir === r.mes && sim.atingiuMeta,
      };
    }).reverse(); // Most recent at the top
  }, [sim, pessoas, mesesConcluidosSet]);

  if (!sim || !displayRows.length) return <div className="p-4 text-center text-muted-foreground flex flex-col items-center gap-4"><div className="w-8 h-8 border-4 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin"></div><p>Carregando dados do histórico...</p></div>;

  return (
    <div className="space-y-6 relative w-full max-w-screen-md mx-auto pb-10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-light">Histórico de Aportes</h2>
          <p className="text-sm text-muted-foreground mt-1">Acompanhe seus lançamentos mensais e compare o planejado com o realizado.</p>
        </div>
        {planos.length > 1 && (
          <button
            onClick={aplicarATodos}
            disabled={saving}
            className="shrink-0 bg-secondary border border-border text-foreground rounded-xl px-4 py-2 flex items-center shadow-soft text-sm font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50"
          >
            <CopyCheck className="w-4 h-4 mr-2" />
            Sincronizar Outros Planos
          </button>
        )}
      </div>

      <div className="space-y-4 relative">
        {displayRows.map((r, index) => {
          const isPending = !r.isConcluido;
          const diff = r.totalRealizado - r.totalPlanejado;

          return (
            <div 
              key={r.mes} 
              className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-2xl border transition-all relative z-10 ${isPending ? 'bg-background border-primary/40 shadow-glow-sm' : 'bg-card border-border/60 shadow-sm'} ${r.atingiu ? 'ring-1 ring-success/30 bg-success/5' : ''}`}
            >
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isPending ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success'}`}>
                  {isPending ? <Hourglass className="w-5 h-5 animate-pulse" /> : <Check className="w-6 h-6" />}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-lg">
                      {(() => { const d = new Date(r.data).toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).replace(" de ", " "); return d.charAt(0).toUpperCase() + d.slice(1); })()}
                    </h3>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground px-2 py-0.5 rounded-full bg-secondary/80">Mês {r.mes}</span>
                    {r.atingiu && (
                      <span className="text-[10px] uppercase font-bold text-success px-2 py-0.5 rounded-full bg-success/10 border border-success/20">Meta Atingida</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground/80 font-semibold mb-0.5">Planejado</span>
                      <span className="font-medium text-muted-foreground">{brl(r.totalPlanejado)}</span>
                    </div>
                    
                    {!isPending && (
                      <>
                        <div className="w-px h-6 bg-border/60 mx-1"></div>
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/80 font-semibold mb-0.5">Realizado</span>
                          <span className={`font-bold ${diff > 0 ? 'text-success' : diff < 0 ? 'text-destructive' : 'text-foreground'}`}>
                            {brl(r.totalRealizado)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5 sm:mt-0 w-full sm:w-auto flex justify-end">
                <button
                  onClick={() => router.push(`/app/lancar-aporte?mes=${r.mes}`)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 w-full justify-center sm:w-auto ${isPending ? 'bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5' : 'bg-secondary/50 text-foreground hover:bg-secondary border border-border/50'}`}
                >
                  <Edit2 className="w-4 h-4" />
                  {isPending ? "Lançar Mês" : "Editar"}
                </button>
              </div>
            </div>
          );
        })}

        <div className="absolute left-[44px] top-12 bottom-12 w-px bg-border -z-10 hidden sm:block"></div>
      </div>
    </div>
  );
});
