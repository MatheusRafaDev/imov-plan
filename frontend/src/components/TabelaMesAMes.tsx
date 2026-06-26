"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import React from "react";
import { createPortal } from "react-dom";
import { usePlanContext } from "@/context/PlanContext";
import { brl, simular } from "@/lib/finance";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

// ─── Editable Aporte Cell ────────────────────────────────────────────────────
function EditableAporte({ value, onSave, isEdited }: { value: number; onSave: (v: number) => void; isEdited: boolean }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value.toFixed(2));
  useEffect(() => { setVal(value.toFixed(2)); }, [value]);

  if (editing) {
    return (
      <input
        autoFocus
        type="number"
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={() => {
          setEditing(false);
          const num = parseFloat(val);
          if (!isNaN(num) && num >= 0) onSave(num);
          else setVal(value.toFixed(2));
        }}
        onKeyDown={e => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") { setVal(value.toFixed(2)); setEditing(false); }
        }}
        className="w-24 text-right bg-background border border-border rounded px-1.5 py-0.5 outline-none text-foreground text-xs font-medium"
      />
    );
  }

  return (
    <div
      onClick={() => setEditing(true)}
      className={`cursor-pointer hover:bg-accent/10 px-1.5 py-0.5 rounded transition-colors border border-transparent hover:border-accent/20 text-right ${isEdited ? "text-accent font-bold" : ""}`}
      title="Clique para editar"
    >
      {brl(value)}
    </div>
  );
}

// ─── Extras Cell (context aportes) ────────────────────────
type ContextExtra = { origem: string; valor: number; pessoaNome?: string };

function ExtrasCell({ contextItems, total }: {
  contextItems: ContextExtra[];
  total: number;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [portalPos, setPortalPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPortalPos({
        top: rect.bottom + window.scrollY,
        left: rect.left + rect.width - 288 + window.scrollX,
      });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const hasExtras = (contextItems ?? []).length > 0;
  const canOpen = hasExtras;

  return (
    <div ref={triggerRef}>
      <div
        onClick={() => { if (canOpen) setOpen(o => !o); }}
        className={`flex items-center justify-end gap-1 px-1.5 py-0.5 rounded transition-colors border border-transparent ${total > 0 ? "cursor-pointer hover:bg-accent/10 hover:border-accent/20 text-accent font-semibold" : "text-muted-foreground/40"}`}
        title={canOpen ? "Clique para ver detalhes" : undefined}
      >
        {total > 0 ? `+${brl(total)}` : "—"}
        {total > 0 && (open ? <ChevronUp className="h-3 w-3 shrink-0" /> : <ChevronDown className="h-3 w-3 shrink-0" />)}
      </div>

      {open && canOpen && typeof document !== "undefined" && createPortal(
        <div
          className="fixed z-50 w-72 bg-card border border-border rounded-xl shadow-xl p-3 space-y-3"
          style={{ top: `${portalPos.top + 4}px`, left: `${Math.max(8, portalPos.left)}px` }}
        >
          {hasExtras && (
            <div className="space-y-1">
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Extras do mês</p>
              {contextItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-[11px] gap-2 py-0.5">
                  <div className="flex flex-col min-w-0">
                    <span className="truncate text-foreground font-medium">{item.origem}</span>
                    <span className="text-[10px] text-muted-foreground">{item.pessoaNome || "Conjunto"}</span>
                  </div>
                  <span className="num text-accent shrink-0 font-semibold">+{brl(item.valor)}</span>
                </div>
              ))}
              <div className="flex justify-between text-[11px] font-semibold pt-1 border-t border-border/50">
                <span className="text-muted-foreground">Total extras</span>
                <span className="num text-accent">+{brl(total)}</span>
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return <th className={`px-3 py-2.5 text-[10px] font-medium uppercase tracking-wider whitespace-nowrap ${right ? "text-right" : "text-left"}`}>{children}</th>;
}

function Td({ children, right, className = "", suppressHydrationWarning }: { children: React.ReactNode; right?: boolean; className?: string; suppressHydrationWarning?: boolean }) {
  return <td suppressHydrationWarning={suppressHydrationWarning} className={`px-3 py-[5px] num ${right ? "text-right" : "text-left"} ${className}`}>{children}</td>;
}

export function TabelaMesAMes({ limitRows, showFinancials = true }: { limitRows?: number, showFinancials?: boolean }) {
  const { 
    objetivo, 
    pessoas, 
    aportesExtras, 
    aportesRegularesEditados, 
    setAportesRegularesEditados,
    aportesRegularesEditadosPorPessoa,
    setAportesRegularesEditadosPorPessoa,
    saveDraft, 
    mesesConcluidos, 
    setMesesConcluidos 
  } = usePlanContext();

  const mesesConcluidosSet = useMemo(() => new Set(mesesConcluidos), [mesesConcluidos]);

  const toggleConcluido = (mes: number) => {
    setMesesConcluidos(prev => {
      if (prev.includes(mes)) return prev.filter(m => m !== mes);
      return [...prev, mes];
    });
  };

  const aporteTotal = pessoas.reduce((s, p) => s + Number(p.aporte_mensal ?? 0), 0);
  const pessoasGuardadoSum = pessoas.reduce((s, p) => s + (p.valorInicial ?? 0), 0);
  const totalGuardado = pessoasGuardadoSum > 0 ? pessoasGuardadoSum : Number(objetivo?.valorJaGuardado ?? 0);
  const inicio = objetivo?.dataInicio ? new Date(objetivo.dataInicio + 'T12:00:00') : new Date();

  const combinedExtras = useMemo(() => aportesExtras.map(a => ({ ...a, valor: Number(a.valor) })), [aportesExtras]);

  // Create virtual map to pass to finance logic
  const virtualAportesRegularesEditados = useMemo(() => {
    const virtualMap: Record<number, number> = {};
    const prazoMax = objetivo?.prazoMaxMeses ?? 600;
    
    for (let mes = 1; mes <= prazoMax; mes++) {
      let isEditedInMonth = false;
      let totalForMonth = 0;
      
      pessoas.forEach(p => {
        const editedValue = aportesRegularesEditadosPorPessoa[p.id]?.[mes];
        if (editedValue !== undefined) {
          isEditedInMonth = true;
          totalForMonth += editedValue;
        } else {
          totalForMonth += Number(p.aporte_mensal) || 0;
        }
      });
      
      if (!isEditedInMonth && aportesRegularesEditados[mes] !== undefined) {
          virtualMap[mes] = aportesRegularesEditados[mes];
      } else if (isEditedInMonth) {
          virtualMap[mes] = totalForMonth;
      }
    }
    return virtualMap;
  }, [pessoas, aportesRegularesEditadosPorPessoa, aportesRegularesEditados, objetivo?.prazoMaxMeses]);

  const sim = useMemo(() => simular({
    valorImovel: Number(objetivo?.valorImovel ?? 0),
    percentualEntrada: Number(objetivo?.percentualEntrada ?? 0),
    percentualCustosExtras: Number(objetivo?.percentualCustosExtras ?? 0),
    valorJaGuardado: totalGuardado,
    taxaCdiAnual: Number(objetivo?.taxaCdiAnual ?? 0),
    percentualCdi: Number(objetivo?.percentualCdi ?? 100),
    aporteMensalTotal: aporteTotal,
    aportesRegularesEditados: virtualAportesRegularesEditados,
    dataInicio: objetivo?.dataInicio ?? new Date(),
    aportesExtras: combinedExtras,
    prazoMaxMeses: objetivo?.prazoMaxMeses ?? 600,
  }), [objetivo, combinedExtras, aporteTotal, totalGuardado, virtualAportesRegularesEditados]);

  const tableRows = useMemo(() => {
    const saldos = Object.fromEntries(pessoas.map(p => [p.nome, p.valorInicial ?? 0]));
    let saldoConjunto = 0;
    let rentabilidadeAcumulada = 0;
    let saldoAnterior = totalGuardado;

    return sim.rows.map(r => {
      const isExtra = r.aportesExtras > 0;
      const atingiu = sim.mesAtingiuMeta === r.mes;

      const extrasMes = combinedExtras.filter(a => {
        const d = new Date(a.data + 'T12:00:00');
        const mesOffset = (d.getFullYear() - inicio.getFullYear()) * 12 + (d.getMonth() - inicio.getMonth()) + 1;
        return mesOffset === r.mes;
      });

      const extrasPorPessoa: Record<string, number> = {};
      let extrasConjunto = 0;
      extrasMes.forEach(a => {
        if (a.pessoaNome) extrasPorPessoa[a.pessoaNome] = (extrasPorPessoa[a.pessoaNome] || 0) + Number(a.valor);
        else extrasConjunto += Number(a.valor);
      });

      const saldoTotalAnterior = saldoAnterior;
      const novosSaldos: Record<string, number> = {};
      const defaultAporte = r.mes === 0 ? 0 : aporteTotal;
      const isLegacyEdited = aportesRegularesEditados[r.mes] !== undefined;

      const aporteFinalPorPessoa: Record<string, number> = {};
      
      pessoas.forEach(p => {
        if (r.mes === 0) {
          aporteFinalPorPessoa[p.id] = 0;
        } else {
          const editedValue = aportesRegularesEditadosPorPessoa[p.id]?.[r.mes];
          if (editedValue !== undefined) {
            aporteFinalPorPessoa[p.id] = editedValue;
          } else if (isLegacyEdited && defaultAporte > 0) {
            aporteFinalPorPessoa[p.id] = ((Number(p.aporte_mensal) || 0) / defaultAporte) * (aportesRegularesEditados[r.mes] || 0);
          } else {
            aporteFinalPorPessoa[p.id] = Number(p.aporte_mensal) || 0;
          }
        }
      });

      pessoas.forEach(p => {
        const proporcao = saldoTotalAnterior > 0 ? (saldos[p.nome] || 0) / saldoTotalAnterior : 0;
        const rendimentoPessoa = proporcao * r.rendimentoLiquido;
        const aporteFinal = aporteFinalPorPessoa[p.id] || 0;
        const extra = extrasPorPessoa[p.nome] || 0;
        novosSaldos[p.nome] = (saldos[p.nome] || 0) + aporteFinal + extra + rendimentoPessoa;
      });

      const proporcaoConjunto = saldoTotalAnterior > 0 ? saldoConjunto / saldoTotalAnterior : 0;
      const rendimentoConjunto = proporcaoConjunto * r.rendimentoLiquido;
      const diffConjunto = isLegacyEdited && defaultAporte === 0 ? r.aporteRegular : 0;
      const novoSaldoConjunto = saldoConjunto + extrasConjunto + rendimentoConjunto + diffConjunto;

      pessoas.forEach(p => { saldos[p.nome] = novosSaldos[p.nome]; });
      saldoConjunto = novoSaldoConjunto;
      saldoAnterior = r.saldoAcumulado;

      return {
        ...r,
        atingiu,
        isExtra,
        aporteFinalPorPessoa,
        saldosIndividuais: novosSaldos,
        saldoConjunto: novoSaldoConjunto,
      };
    });
  }, [sim.rows, pessoas, combinedExtras, inicio, sim.mesAtingiuMeta, aporteTotal, totalGuardado, aportesRegularesEditadosPorPessoa, aportesRegularesEditados]);

  const displayRows = limitRows ? tableRows.slice(0, limitRows) : tableRows;

  return (
    <div>
      <div className="mb-3">
        <h2 className="font-display text-xl font-light">Tabela mês a mês</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Clique no mês para marcá-lo como concluído. Clique em Extras para detalhar lançamentos. Aporte é editável.</p>
      </div>

      <div className="overflow-x-auto max-h-[560px] border border-border/50 rounded-xl shadow-sm bg-card relative">
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-10 bg-secondary/95 backdrop-blur-sm text-muted-foreground shadow-sm">
            <tr>
              <Th>Mês</Th>
              <Th>Data</Th>
              {pessoas.map(p => (
                <Th key={p.id} right>Aporte {p.nome.split(" ")[0]}</Th>
              ))}
              <Th right>Extras</Th>
              <Th right>Total Mês</Th>
              {showFinancials && (
                <>
                  <Th right>Rend. Bruto</Th>
                  <Th right>IR</Th>
                  <Th right>Rend. Líquido</Th>
                  <Th right>Saldo Acumulado</Th>
                  <Th right>% Meta</Th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {displayRows.map(r => {
              const defaultAporte = r.mes === 0 ? 0 : aporteTotal;
              const isConcluido = mesesConcluidosSet.has(r.mes);
              const totalExtras = r.aportesExtras;
              const totalAporteMes = r.aporteRegular + totalExtras;
              const progressoMeta = sim.meta > 0 ? (r.saldoAcumulado / sim.meta) * 100 : 0;

              return (
                <tr
                  key={r.mes}
                  className={`transition-colors hover:bg-secondary/20 ${r.atingiu && showFinancials ? "bg-primary/10 shadow-[inset_3px_0_0_0_hsl(var(--primary))]" : ""} ${isConcluido && (!r.atingiu || !showFinancials) ? "bg-teal-500/5" : ""} ${r.isExtra && !r.atingiu && !isConcluido ? "bg-accent/5" : ""}`}
                >
                  <Td className="font-medium">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => toggleConcluido(r.mes)}
                        title={isConcluido ? "Desmarcar" : "Marcar como concluído"}
                        className={`w-6 h-6 rounded flex items-center justify-center border transition-colors shrink-0 ${isConcluido ? "bg-teal-600/20 border-teal-600/50 text-teal-600 dark:text-teal-400" : "border-border/50 hover:border-teal-500/50 hover:bg-teal-500/10"}`}
                      >
                        {isConcluido && <Check className="h-4 w-4" />}
                      </button>
                      <span className={isConcluido ? "text-teal-700 dark:text-teal-400" : "text-muted-foreground"}>{r.mes}</span>
                      {r.atingiu && <span className="px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[9px] uppercase font-bold tracking-wider">Meta</span>}
                    </div>
                  </Td>

                  <Td suppressHydrationWarning className="text-muted-foreground whitespace-nowrap">
                    {new Date(r.data).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
                  </Td>

                  {pessoas.map(p => {
                    const defaultPessoaAporte = r.mes === 0 ? 0 : (Number(p.aporte_mensal) || 0);
                    const currentValue = r.aporteFinalPorPessoa[p.id] || 0;
                    const isEdited = currentValue !== defaultPessoaAporte;

                    return (
                      <Td key={p.id} right>
                        {r.mes === 0 ? (
                          <div className="text-muted-foreground/40 text-right px-1.5 py-0.5">—</div>
                        ) : (
                          <EditableAporte
                            value={currentValue}
                            isEdited={isEdited}
                            onSave={v => {
                              setAportesRegularesEditadosPorPessoa(prev => {
                                const personEdits = { ...(prev[p.id] || {}) };
                                if (v === defaultPessoaAporte) {
                                  delete personEdits[r.mes];
                                } else {
                                  personEdits[r.mes] = v;
                                }
                                const newState = { ...prev, [p.id]: personEdits };
                                saveDraft({ aportesRegularesEditadosPorPessoa: newState });
                                return newState;
                              });
                              
                              // Clear legacy edit for this month if converting to per-person edit
                              if (aportesRegularesEditados[r.mes] !== undefined) {
                                setAportesRegularesEditados(prev => {
                                  const copy = { ...prev };
                                  delete copy[r.mes];
                                  return copy;
                                });
                              }
                            }}
                          />
                        )}
                      </Td>
                    );
                  })}

                  <Td right>
                    {(() => {
                      const ctxItems: ContextExtra[] = aportesExtras
                        .filter(a => {
                          const d = new Date(a.data + 'T12:00:00');
                          const mesOffset = (d.getFullYear() - inicio.getFullYear()) * 12 + (d.getMonth() - inicio.getMonth()) + 1;
                          return mesOffset === r.mes;
                        })
                        .map(a => ({ origem: a.origem, valor: Number(a.valor), pessoaNome: a.pessoaNome }));

                      return (
                        <ExtrasCell
                          contextItems={ctxItems}
                          total={totalExtras}
                        />
                      );
                    })()}
                  </Td>

                  <Td right className="font-medium text-foreground">
                    {brl(totalAporteMes)}
                  </Td>

                  {showFinancials && (
                    <>
                      <Td right className="text-muted-foreground">
                        {brl(r.rendimentoBruto)}
                      </Td>

                      <Td right className="text-muted-foreground/70">
                        {brl(r.imposto)}
                      </Td>

                      <Td right className="text-[#3B6D11] dark:text-[#80B551] font-medium">
                        {r.rendimentoLiquido > 0 ? `+${brl(r.rendimentoLiquido)}` : brl(r.rendimentoLiquido)}
                      </Td>

                      <Td right className="font-bold text-sm text-foreground">{brl(r.saldoAcumulado)}</Td>

                      <Td right className="font-medium">
                        <span className={progressoMeta >= 100 ? "text-primary" : "text-muted-foreground"}>
                          {progressoMeta.toFixed(1)}%
                        </span>
                      </Td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
