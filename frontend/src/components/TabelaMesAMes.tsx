"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import React from "react";
import { createPortal } from "react-dom";
import { usePlanContext } from "@/context/PlanContext";
import { brl, simular, totalMesMaisRendimentoLiquido, mesDaSimulacaoParaData, type SimRow, type SimResult } from "@/lib/finance";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { MoneyInput } from "@/components/MoneyInput";

type EnrichedRow = SimRow & {
  atingiu: boolean;
  isExtra: boolean;
  aporteFinalPorPessoa: Record<string, number>;
  saldosIndividuais: Record<string, number>;
  saldoConjunto: number;
};

// ─── Editable Aporte Cell ────────────────────────────────────────────────────
function EditableAporte({
  value,
  planned,
  pessoaNome,
  mes,
  onSave,
  isEdited,
}: {
  value: number;
  planned: number;
  pessoaNome: string;
  mes: number;
  onSave: (v: number) => void;
  isEdited: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value.toFixed(2));
  const triggerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [portalPos, setPortalPos] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => { setDraft(value.toFixed(2)); }, [value]);

  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const popupWidth = 260;
      const left = Math.min(
        Math.max(8 + window.scrollX, rect.right - popupWidth + window.scrollX),
        window.innerWidth - popupWidth - 8 + window.scrollX
      );
      setPortalPos({ top: rect.bottom + window.scrollY + 4, left, width: popupWidth });
      setTimeout(() => inputRef.current?.select(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(event.target as Node) &&
        popupRef.current && !popupRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setDraft(value.toFixed(2));
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, value]);

  const realValue = parseFloat(draft);
  const diff = isNaN(realValue) ? 0 : realValue - planned;
  const diffValid = !isNaN(realValue) && realValue >= 0;

  const onSaveValue = () => {
    if (diffValid) {
      onSave(realValue);
      setOpen(false);
    }
  };

  const onRestore = () => {
    onSave(planned);
    setDraft(planned.toFixed(2));
    setOpen(false);
  };

  return (
    <div ref={triggerRef} className="relative text-right">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={isEdited ? `Planejado: ${brl(planned)} → Real: ${brl(value)}` : "Clique para editar o aporte real"}
        className={`w-full text-right px-2 py-1 rounded transition-colors border ${isEdited ? "border-accent text-accent bg-accent/5 font-semibold" : "border-transparent hover:border-accent/20 hover:bg-accent/5"}`}
      >
        {brl(value)}
        {isEdited && (
          <span className={`ml-1 text-[9px] font-bold ${diff > 0 ? "text-green-500" : "text-rose-500"}`}>
            {diff > 0 ? "▲" : "▼"}
          </span>
        )}
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <div
          ref={popupRef}
          className="fixed z-50 rounded-2xl border border-border/70 bg-card shadow-xl overflow-hidden"
          style={{ top: `${portalPos.top}px`, left: `${portalPos.left}px`, width: `${portalPos.width}px` }}
        >
          {/* Header */}
          <div className="bg-secondary/60 px-4 py-2.5 border-b border-border/50">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
              Aporte · {pessoaNome} · Mês {mes}
            </p>
          </div>

          <div className="p-4 space-y-3">
            {/* Planejado */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Planejado</span>
              <span className="num font-medium text-foreground">{brl(planned)}</span>
            </div>

            {/* Separador */}
            <div className="border-t border-border/40" />

            {/* Real — campo editável */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Real aportado</label>
              <MoneyInput
                ref={inputRef}
                variant="money"
                min={0}
                value={draft === "" ? 0 : Number(draft)}
                onChange={(v) => setDraft(v === "" ? "0" : v.toString())}
                onKeyDown={(e) => { if (e.key === "Enter") onSaveValue(); if (e.key === "Escape") { setOpen(false); setDraft(value.toFixed(2)); } }}
                className="h-10 text-sm bg-background border-border"
              />
            </div>

            {/* Diferença */}
            {diffValid && diff !== 0 && (
              <div className={`flex items-center justify-between text-xs rounded-lg px-3 py-2 ${diff > 0 ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-rose-500/10 text-rose-700 dark:text-rose-400"}`}>
                <span className="font-medium">{diff > 0 ? "▲ Aportou a mais" : "▼ Aportou a menos"}</span>
                <span className="num font-bold">{diff > 0 ? "+" : ""}{brl(Math.abs(diff))}</span>
              </div>
            )}
            {diffValid && diff === 0 && draft !== planned.toFixed(2) && (
              <div className="flex items-center justify-between text-xs rounded-lg px-3 py-2 bg-secondary/50 text-muted-foreground">
                <span>Igual ao planejado</span>
              </div>
            )}

            {/* Botões */}
            <div className="flex gap-2 pt-1">
              {isEdited && (
                <button
                  type="button"
                  onClick={onRestore}
                  className="flex-1 rounded-xl border border-border/60 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                >
                  Restaurar
                </button>
              )}
              <button
                type="button"
                onClick={() => { setOpen(false); setDraft(value.toFixed(2)); }}
                className="flex-1 rounded-xl border border-border/60 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-border transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={onSaveValue}
                disabled={!diffValid}
                className="flex-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
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
      const width = 288;
      const left = Math.min(
        Math.max(8 + window.scrollX, rect.left + rect.width - width + window.scrollX),
        window.innerWidth - width - 8 + window.scrollX
      );
      const top = Math.min(rect.bottom + window.scrollY, window.scrollY + window.innerHeight - 220);
      setPortalPos({
        top,
        left,
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

export function TabelaMesAMes({ limitRows, showFinancials = true, showCompletedToggle = true, percentualCdiOverride, externalSim }: { limitRows?: number, showFinancials?: boolean, showCompletedToggle?: boolean, percentualCdiOverride?: number, externalSim?: SimResult }) {
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
    setMesesConcluidos,
    dadosCalculados
  } = usePlanContext();

  const mesesConcluidosSet = useMemo(() => new Set(mesesConcluidos), [mesesConcluidos]);

  const toggleConcluido = (mes: number) => {
    setMesesConcluidos(prev => {
      if (prev.includes(mes)) return prev.filter(m => m !== mes);
      return [...prev, mes];
    });
  };

  // Usar dados calculados centralizados do contexto
  const { aporteTotal, totalGuardado, combinedExtras, virtualAportesRegularesEditados, simResult } = dadosCalculados;

  const inicio = objetivo?.dataInicio
    ? (typeof objetivo.dataInicio === "string"
        ? new Date(objetivo.dataInicio + "T12:00:00")
        : new Date(objetivo.dataInicio))
    : new Date();

  // Usa dados externos (backend) se fornecidos, senão usa simResult centralizado
  const sim = useMemo(() => {
    if (externalSim) return externalSim;
    return simResult;
  }, [externalSim, simResult]);

  const tableRows = useMemo((): EnrichedRow[] => {
    if (!sim) return [];

    const saldos = Object.fromEntries(pessoas.map(p => [p.nome, p.valorInicial ?? 0]));
    let saldoConjunto = 0;
    let saldoAnterior = totalGuardado;

    return sim.rows.map(r => {
      const isExtra = r.aportesExtras > 0;
      const atingiu = sim.mesAtingiuMeta === r.mes;

      const extrasMes = combinedExtras.filter(a => {
        const mesOffset = mesDaSimulacaoParaData(a.data, inicio);
        return mesOffset === r.mes;
      });

      const extrasPorPessoa: Record<string, number> = {};
      let extrasConjunto = 0;
      extrasMes.forEach(a => {
        if (a.pessoaId) extrasPorPessoa[a.pessoaId] = (extrasPorPessoa[a.pessoaId] || 0) + Number(a.valor);
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

      let saldoTotalComAportes = 0;
      pessoas.forEach(p => {
        const aporteFinal = aporteFinalPorPessoa[p.id] || 0;
        const extra = extrasPorPessoa[p.id] || 0;
        saldoTotalComAportes += (saldos[p.nome] || 0) + aporteFinal + extra;
      });

      pessoas.forEach(p => {
        const aporteFinal = aporteFinalPorPessoa[p.id] || 0;
        const extra = extrasPorPessoa[p.id] || 0;
        const saldoAtualizado = (saldos[p.nome] || 0) + aporteFinal + extra;

        const proporcao = saldoTotalComAportes > 0 ? saldoAtualizado / saldoTotalComAportes : 0;
        const rendimentoPessoa = proporcao * r.rendimentoLiquido;
        novosSaldos[p.nome] = saldoAtualizado + rendimentoPessoa;
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
  }, [sim?.rows, pessoas, combinedExtras, inicio, sim?.mesAtingiuMeta, aporteTotal, totalGuardado, aportesRegularesEditadosPorPessoa, aportesRegularesEditados]);

  const objectiveRowLimit = objetivo?.prazoMaxMeses && objetivo.prazoMaxMeses > 0 ? objetivo.prazoMaxMeses + 1 : undefined;
  const effectiveLimit = limitRows !== undefined
    ? objectiveRowLimit !== undefined
      ? Math.min(limitRows, objectiveRowLimit)
      : limitRows
    : objectiveRowLimit;

  // Filtrar por número de mês (evita bugs de fuso horário ao comparar datas)
  const rowsFilteredByMes = objectiveRowLimit !== undefined
    ? tableRows.filter(r => r.mes <= objectiveRowLimit - 1)
    : tableRows;

  const displayRows: EnrichedRow[] = effectiveLimit !== undefined ? rowsFilteredByMes.slice(0, effectiveLimit) : rowsFilteredByMes;

  const totals = useMemo(() => {
    let aportePorPessoa: Record<string, number> = {};
    pessoas.forEach(p => aportePorPessoa[p.id] = 0);
    let extras = 0;
    let totalMes = 0;
    let rendBruto = 0;
    let ir = 0;
    let rendLiquido = 0;
    let saldoFinal = 0;

    displayRows.forEach(r => {
      pessoas.forEach(p => {
        aportePorPessoa[p.id] += r.aporteFinalPorPessoa?.[p.id] || 0;
      });
      extras += r.aportesExtras;
      totalMes += r.aporteRegular + r.aportesExtras;
      rendBruto += r.rendimentoBruto;
      ir += r.imposto;
      rendLiquido += r.rendimentoLiquido;
      saldoFinal = r.saldoAcumulado;
    });

    return { aportePorPessoa, extras, totalMes, rendBruto, ir, rendLiquido, saldoFinal };
  }, [displayRows, pessoas]);

  return (
    <div>
      <div className="mb-3">
        <h2 className="font-display text-xl font-light">Tabela mês a mês</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Clique no mês para marcá-lo como concluído. Clique em Extras para detalhar lançamentos. Aporte é editável.</p>
      </div>

      <div className="overflow-x-auto border border-border/50 rounded-xl shadow-sm bg-card relative">
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
                  <Th right>Rend. Líq.</Th>
                  <Th right>Saldo</Th>
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
              const progressoMeta = sim && sim.meta > 0 ? (r.saldoAcumulado / sim.meta) * 100 : 0;

              return (
                <tr
                  key={r.mes}
                  className={`transition-colors hover:bg-secondary/20 ${r.atingiu && showFinancials ? "bg-primary/10 shadow-[inset_3px_0_0_0_hsl(var(--primary))]" : ""} ${isConcluido && (!r.atingiu || !showFinancials) ? "bg-teal-500/5" : ""} ${r.isExtra && !r.atingiu && !isConcluido ? "bg-accent/5" : ""}`}
                >
                  <Td className="font-medium">
                    <div className="flex items-center gap-1.5">
                      {r.mes === 0 ? (
                        // Mês 0 = início, sempre marcado como concluído sem opção de toggle
                        <div className="w-6 h-6 rounded flex items-center justify-center border shrink-0 bg-teal-600/20 border-teal-600/50 text-teal-600 dark:text-teal-400">
                          <Check className="h-4 w-4" />
                        </div>
                      ) : showCompletedToggle ? (
                        <button
                          onClick={() => toggleConcluido(r.mes)}
                          title={isConcluido ? "Desmarcar" : "Marcar como concluído"}
                          className={`w-6 h-6 rounded flex items-center justify-center border transition-colors shrink-0 ${isConcluido ? "bg-teal-600/20 border-teal-600/50 text-teal-600 dark:text-teal-400" : "border-border/50 hover:border-teal-500/50 hover:bg-teal-500/10"}`}
                        >
                          {isConcluido && <Check className="h-4 w-4" />}
                        </button>
                      ) : null}
                      <span className={r.mes === 0 || isConcluido ? "text-teal-700 dark:text-teal-400" : "text-muted-foreground"}>{r.mes}</span>
                      {r.atingiu && <span className="px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[9px] uppercase font-bold tracking-wider">Meta</span>}
                    </div>
                  </Td>

                  <Td suppressHydrationWarning className="text-muted-foreground whitespace-nowrap">
                    {new Date(r.data).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
                  </Td>

                  {pessoas.map(p => {
                    const defaultPessoaAporte = r.mes === 0 ? 0 : (Number(p.aporte_mensal) || 0);
                    const currentValue = r.aporteFinalPorPessoa?.[p.id] || 0;
                    const isEdited = currentValue !== defaultPessoaAporte;

                    return (
                      <Td key={p.id} right>
                        {r.mes === 0 ? (
                          <div className="text-muted-foreground/40 text-right px-1.5 py-0.5">—</div>
                        ) : (
                          <EditableAporte
                            value={currentValue}
                            planned={defaultPessoaAporte}
                            pessoaNome={p.nome.split(" ")[0]}
                            mes={r.mes}
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
                          const mesOffset = mesDaSimulacaoParaData(a.data, inicio);
                          return mesOffset === r.mes;
                        })
                        .map(a => ({ origem: a.origem, valor: Number(a.valor), pessoaNome: a.pessoaNome }));

                      const extrasTotal = ctxItems.reduce((sum, item) => sum + item.valor, 0);

                      return (
                        <ExtrasCell
                          contextItems={ctxItems}
                          total={extrasTotal}
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
          <tfoot className="bg-primary/10 border-t-2 border-primary/30">
            <tr className="font-bold text-foreground">
              <Td className="bg-primary/20">Total Geral</Td>
              <Td className="bg-primary/20">{""}</Td>
              {pessoas.map(p => (
                <Td key={p.id} right className="bg-primary/20">{brl(totals.aportePorPessoa[p.id])}</Td>
              ))}
              <Td right className="bg-primary/20">{brl(totals.extras)}</Td>
              <Td right className="bg-primary/20">{brl(totals.totalMes)}</Td>
              {showFinancials && (
                <>
                  <Td right className="bg-primary/20 text-muted-foreground">{brl(totals.rendBruto)}</Td>
                  <Td right className="bg-primary/20 text-muted-foreground/70">{brl(totals.ir)}</Td>
                  <Td right className="bg-primary/20 text-[#3B6D11] dark:text-[#80B551]">
                    {totals.rendLiquido > 0 ? `+${brl(totals.rendLiquido)}` : brl(totals.rendLiquido)}
                  </Td>
                  <Td right className="bg-primary/20">{""}</Td>
                  <Td right className="bg-primary/20">{""}</Td>
                </>
              )}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}