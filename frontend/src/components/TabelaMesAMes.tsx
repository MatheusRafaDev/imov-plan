"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import React from "react";
import { createPortal } from "react-dom";
import { usePlanLogic } from "@/hooks/usePlanLogic";;
import { brl, mesDaSimulacaoParaData, type CenarioSimulacao } from "@/lib/finance";
import { Check, ChevronDown, ChevronUp, MoreHorizontal, Edit2, Plus, Trash2, TrendingUp, TrendingDown, Minus, Loader2, Download } from "lucide-react";
import { MoneyInput } from "@/components/MoneyInput";
import { ScenarioComparison } from "@/app/app/resultado/components/ScenarioComparison";
import { toast } from "sonner";
import Link from "next/link";
import { RowActions } from "./TabelaMesAMes/RowActions";
import { ExtrasCell, type ContextExtra } from "./TabelaMesAMes/ExtrasCell";

type DisplayRow = {
  mes: number;
  data: string;
  aporteRegular: number;
  aportesExtras: number;
  rendimentoBruto: number;
  imposto: number;
  rendimentoLiquido: number;
  saldoAcumulado: number;
  atingiu: boolean;
  isExtra: boolean;
  aporteFinalPorPessoa: Record<string, number>;
};


function DisplayAporte({ value, planned, isEdited }: { value: number; planned: number; isEdited: boolean }) {
  const diff = value - planned;
  return (
    <div title={isEdited ? `Planejado: ${brl(planned)} → Real: ${brl(value)}` : undefined}
      className={`px-2 py-1 rounded border text-right transition-colors ${isEdited ? "border-accent text-accent bg-accent/5 font-semibold" : "border-transparent text-foreground"}`}
    >
      {brl(value)}
      {isEdited && (
        <span className={`ml-1 text-[9px] font-bold ${diff > 0 ? "text-success" : "text-destructive"}`}>
          {diff > 0 ? "▲" : "▼"}
        </span>
      )}
    </div>
  );
}


function Th({ children, right, className = "" }: { children?: React.ReactNode; right?: boolean; className?: string }) {
  return <th className={`px-2.5 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap ${right ? "text-right" : "text-left"} ${className}`}>{children}</th>;
}

function Td({ children, right, className = "", suppressHydrationWarning }: { children?: React.ReactNode; right?: boolean; className?: string; suppressHydrationWarning?: boolean }) {
  return <td suppressHydrationWarning={suppressHydrationWarning} className={`px-2.5 py-2.5 num text-xs sm:text-sm text-foreground whitespace-nowrap ${right ? "text-right" : "text-left"} ${className}`}>{children}</td>;
}

export const TabelaMesAMes = React.memo(function TabelaMesAMes({ showFinancials = true, showCompletedToggle = true, showCenarioSelector = true }: { showFinancials?: boolean, showCompletedToggle?: boolean, showCenarioSelector?: boolean }) {
  const {
    objetivo,
    pessoas,
    aportesExtras,
    setAportesExtras,
    aportesRegularesEditados,
    setAportesRegularesEditados,
    aportesRegularesEditadosPorPessoa,
    setAportesRegularesEditadosPorPessoa,
    saveDraft,
    mesesConcluidos,
    setMesesConcluidos,
    backendData,
    cenarioSimulacao,
    setCenarioSimulacao,
    calculating,
  } = usePlanLogic();

  const mesesConcluidosSet = useMemo(() => new Set(mesesConcluidos), [mesesConcluidos]);

  const toggleConcluido = (mes: number) => {
    setMesesConcluidos(prev => {
      if (prev.includes(mes)) return prev.filter(m => m !== mes);
      return [...prev, mes];
    });
  };

  const aporteTotal = backendData?.aporteMensalTotal ?? 0;
  const totalGuardado = backendData?.valorJaGuardado ?? 0;
  const sim = backendData;

  const inicio = objetivo?.dataInicio
    ? (typeof objetivo.dataInicio === "string"
        ? new Date(objetivo.dataInicio + "T12:00:00")
        : new Date(objetivo.dataInicio))
    : new Date();

  const handleExportCSV = () => {
    if (!displayRows.length) return;

    const headers = [
      "Mes",
      "Data",
      ...pessoas.map(p => p.nome),
      "Extras",
      "Aporte Mes",
      ...(showFinancials ? ["Rendimento Bruto", "IR", "Rendimento Liquido", "Acumulado"] : [])
    ];

    const rows = displayRows.map(r => {
      const isZero = r.mes === 0;
      const dataFormatada = new Date(r.data).toLocaleDateString("pt-BR", { month: "short", year: "2-digit", timeZone: "UTC" }).replace(" de ", " ");
      const rowData = [
        isZero ? "Início" : `Mês ${r.mes}`,
        dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1),
        ...pessoas.map(p => {
          const planejado = Number(p.aporte_mensal) || 0;
          const real = isZero ? (Number(p.valorInicial) || 0) : r.aporteFinalPorPessoa[p.id] || 0;
          return real.toFixed(2);
        }),
        r.aportesExtras.toFixed(2),
        (r.aporteRegular + r.aportesExtras).toFixed(2),
        ...(showFinancials ? [
          r.rendimentoBruto.toFixed(2),
          r.imposto.toFixed(2),
          r.rendimentoLiquido.toFixed(2),
          r.saldoAcumulado.toFixed(2)
        ] : [])
      ];
      return rowData.join(";");
    });

    const csvContent = [headers.join(";"), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `imov-plan-simulacao-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const displayRows = useMemo(() => {
    if (!sim || !sim.detalhesMensais) return [];
    
    return sim.detalhesMensais.map(r => ({
      mes: r.mes,
      data: new Date(r.dataReferencia).toISOString(),
      aporteRegular: r.aporteMensal,
      aportesExtras: r.aportesExtras,
      rendimentoBruto: r.rendimentoBruto,
      imposto: r.imposto,
      rendimentoLiquido: r.rendimentoLiquido,
      saldoAcumulado: r.totalAcumulado,
      atingiu: sim.mesesParaAtingir === r.mes && sim.atingiuMeta,
      isExtra: r.aportesExtras > 0,
      aporteFinalPorPessoa: Object.fromEntries(
        (r.participantes || []).map(p => [p.participanteId, p.aporteMensal])
      )
    }));
  }, [sim]);

  const totals = useMemo(() => {
    if (!displayRows.length) return { rendBruto: 0, ir: 0, rendLiquido: 0, aporteRegular: 0, extras: 0, totalMes: 0, saldoFinal: 0, aportePorPessoa: {} as Record<string, number> };
    const rb = displayRows.reduce((a, b) => a + b.rendimentoBruto, 0);
    const ir = displayRows.reduce((a, b) => a + b.imposto, 0);
    const rl = displayRows.reduce((a, b) => a + b.rendimentoLiquido, 0);
    const ap = displayRows.reduce((a, b) => a + b.aporteRegular, 0);
    const ex = displayRows.reduce((a, b) => a + b.aportesExtras, 0);
    
    const aportePorPessoa: Record<string, number> = {};
    pessoas.forEach(p => aportePorPessoa[p.id] = 0);
    displayRows.forEach(r => {
      Object.entries(r.aporteFinalPorPessoa).forEach(([pid, val]) => {
        aportePorPessoa[pid] = (aportePorPessoa[pid] || 0) + val;
      });
    });

    return {
      rendBruto: rb,
      ir,
      rendLiquido: rl,
      aporteRegular: ap,
      extras: ex,
      totalMes: ap + ex,
      saldoFinal: displayRows[displayRows.length - 1].saldoAcumulado,
      aportePorPessoa
    };
  }, [displayRows, pessoas]);

  if (!displayRows.length) return null;

  return (
    <div className="space-y-4 relative w-full">
      {/* Container fixo para evitar reflows no pai */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-2xl">Mês a Mês</h3>
            <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded-full font-medium shadow-soft">
              {displayRows.length - 1} meses
            </span>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
            {showCenarioSelector && (
              <div className="bg-secondary/40 border border-border/50 rounded-xl p-1 flex shadow-soft relative overflow-hidden backdrop-blur-sm">
                {(["pessimista", "realista", "otimista"] as CenarioSimulacao[]).map((cen) => {
                  const active = cenarioSimulacao === cen;
                  return (
                    <button
                      key={cen}
                      onClick={() => setCenarioSimulacao(cen)}
                      disabled={calculating}
                      className={`
                        flex items-center justify-center gap-1.5 relative px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all duration-300
                        ${active ? "text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}
                        ${calculating && !active ? "opacity-50 cursor-not-allowed" : ""}
                      `}
                    >
                      {active && (
                        <div className="absolute inset-0 bg-primary rounded-lg -z-10 shadow-glow animate-fade-in" />
                      )}
                      <span>{cen === "realista" ? "base" : cen}</span>
                      {active && calculating && <Loader2 className="w-3 h-3 animate-spin" />}
                    </button>
                  );
                })}
              </div>
            )}
            

            <button
              onClick={handleExportCSV}
              title="Baixar planilha"
              className="bg-secondary/40 border border-border/50 rounded-xl p-2 flex items-center justify-center shadow-soft text-muted-foreground hover:text-foreground transition-colors hover:bg-secondary/60"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      
        {/* Usando block e min-w-full mas limitando o overflow num scroll container */}
                
        <div className={`overflow-x-auto bg-card custom-scrollbar -mx-4 sm:-mx-6 md:-mx-8 lg:mx-0 lg:rounded-xl lg:shadow-sm border-y sm:border border-border/40 transition-opacity duration-300 ${calculating ? "opacity-60 pointer-events-none" : "opacity-100"}`}>
        <table className="w-full text-sm font-sans border-collapse relative">
          <thead className="bg-card text-muted-foreground sticky top-0 z-10 backdrop-blur-sm border-b border-border/60">
            <tr>
              <Th className="w-px">Mês</Th>
              <Th>Data</Th>
              {pessoas.map(p => (
                <Th key={p.id} right>{p.nome.split(" ")[0]}</Th>
              ))}
              <Th right>Extras</Th>
              <Th right>Aporte Mês</Th>
              {showFinancials && (
                <>
                  <Th right>Rend. Bruto</Th>
                  <Th right>IR</Th>
                  <Th right>Rend. Líq.</Th>
                  <Th right>Acumulado</Th>
                </>
              )}
              <Th></Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/10">
            {displayRows.map((r) => {
              const rowExtras = aportesExtras.filter(e => e.data && e.data.startsWith(r.data.split("T")[0])).map((e, idx) => ({ ...e, index: idx }));
              
              const totalAporteMes = r.aporteRegular + r.aportesExtras;
              
              const isMesConcluido = mesesConcluidosSet.has(r.mes);
              const isZero = r.mes === 0;

              return (
                <tr 
                  key={r.mes} 
                  className={`
                    transition-colors hover:bg-secondary/10 bg-card
                    ${r.atingiu ? "bg-success/5" : ""} 
                    ${isMesConcluido ? "opacity-60 bg-secondary/5" : ""} 
                    ${isZero ? "" : ""}
                  `}
                >
                  <Td className="font-medium whitespace-nowrap w-px">
                    <div className="flex items-center gap-2">
                      {showCompletedToggle && !isZero && (
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
                    const wasEdited = isZero ? false : real !== planejado;
                    return (
                      <Td key={p.id} right>
                        {isZero ? (
                          <span className="text-muted-foreground">{brl(real)}</span>
                        ) : (
                          <DisplayAporte value={real} planned={planejado} isEdited={wasEdited} />
                        )}
                      </Td>
                    );
                  })}

                  <Td right className="relative">
                    {(() => {
                      if (isZero) return <span className="text-muted-foreground">{brl(0)}</span>;
                      
                      return (
                        <ExtrasCell
                          total={r.aportesExtras}
                          contextItems={rowExtras}
                          onEditExtra={(index, origem, valor) => {
                            setAportesExtras(prev => {
                              const next = [...prev];
                              next[index] = { ...next[index], origem, valor };
                              saveDraft({ aportesExtras: next });
                              return next;
                            });
                          }}
                          onDeleteExtra={(index) => {
                            setAportesExtras(prev => {
                              const next = prev.filter((_, i) => i !== index);
                              saveDraft({ aportesExtras: next });
                              return next;
                            });
                          }}
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

                      <Td right className="text-success font-medium">
                        {r.rendimentoLiquido > 0 ? `+${brl(r.rendimentoLiquido)}` : brl(r.rendimentoLiquido)}
                      </Td>

                      <Td right className="font-bold text-sm text-foreground">{brl(r.saldoAcumulado)}</Td>
                    </>
                  )}
                  
                  <Td right className="group">
                    {!isZero && (
                      <RowActions
                        mes={r.mes}
                        pessoas={pessoas.map(p => ({ id: p.id, nome: p.nome }))}
                        aportesPlanejados={Object.fromEntries(pessoas.map(p => [p.id, Number(p.aporte_mensal) || 0]))}
                        aportesReais={r.aporteFinalPorPessoa}
                        onSaveAportes={(novosValores) => {
                          setAportesRegularesEditadosPorPessoa(prev => {
                            let newState = { ...prev };
                            pessoas.forEach(p => {
                              const v = novosValores[p.id];
                              const defaultP = Number(p.aporte_mensal) || 0;
                              const pEdits = { ...(newState[p.id] || {}) };
                              if (v === defaultP) {
                                delete pEdits[r.mes];
                              } else {
                                pEdits[r.mes] = v;
                              }
                              newState[p.id] = pEdits;
                            });
                            saveDraft({ aportesRegularesEditadosPorPessoa: newState });
                            return newState;
                          });
                        }}
                        onAddExtra={(pessoaId, origem, valor) => {
                          const p = pessoaId ? pessoas.find(x => x.id === pessoaId) : null;
                          const newExtra = {
                            pessoaId: pessoaId || undefined,
                            pessoaNome: p ? p.nome.split(" ")[0] : undefined,
                            origem,
                            valor,
                            data: r.data.split("T")[0]
                          };
                          setAportesExtras(prev => [...prev, newExtra]);
                          saveDraft({ aportesExtras: [...aportesExtras, newExtra] });
                        }}
                      />
                    )}
                  </Td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-primary/5 border-t-2 border-primary/30 backdrop-blur-sm">
            <tr className="font-bold text-foreground">
              <Td className="bg-primary/5 whitespace-nowrap">Total Geral</Td>
              <Td className="bg-primary/5">{""}</Td>
              {pessoas.map(p => (
                <Td key={p.id} right className="bg-primary/5">{brl(totals.aportePorPessoa[p.id])}</Td>
              ))}
              <Td right className="bg-primary/5">{brl(totals.extras)}</Td>
              <Td right className="bg-primary/5">{brl(totals.totalMes)}</Td>
              {showFinancials && (
                <>
                  <Td right className="bg-primary/5 text-muted-foreground">{brl(totals.rendBruto)}</Td>
                  <Td right className="bg-primary/5 text-muted-foreground/70">{brl(totals.ir)}</Td>
                  <Td right className="bg-primary/5 text-success">
                    {totals.rendLiquido > 0 ? `+${brl(totals.rendLiquido)}` : brl(totals.rendLiquido)}
                  </Td>
                  <Td right className="bg-primary/5 py-2">
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-bold text-foreground text-[13px]">{brl(totals.saldoFinal)}</span>
                      <span className="text-[10px] text-foreground/70 font-medium px-1.5 py-0.5 rounded-sm bg-foreground/5" title="Total Aportes + Rendimento no período">
                        +{brl(totals.totalMes + totals.rendLiquido)} período
                      </span>
                    </div>
                  </Td>
                </>
              )}
              <Td className="bg-primary/5"></Td>
            </tr>
          </tfoot>
        </table>
        </div>
      </div>
    </div>
  );
});