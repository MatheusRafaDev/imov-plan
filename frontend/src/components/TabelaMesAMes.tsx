"use client";

import { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import React from "react";
import { usePlanLogic } from "@/hooks/usePlanLogic";
import { usePlanStore } from "@/store/usePlanStore";
import { brl } from "@/lib/finance";
import { Check, Loader2, Download, Trash2, AlertTriangle, X, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RowActions } from "./TabelaMesAMes/RowActions";
import { ExtrasCell } from "./TabelaMesAMes/ExtrasCell";
import { EditMesModal, type ModalTab } from "./TabelaMesAMes/EditMesModal";
import { DetalheMesDiarioModal } from "./TabelaMesAMes/DetalheMesDiarioModal";

function DisplayAporte({ value, planned, isEdited }: { value: number; planned: number; isEdited: boolean }) {
  const diff = value - planned;
  return (
    <span 
      title={isEdited ? `Planejado: ${brl(planned)} → Real: ${brl(value)} · Duplo clique para editar` : "Duplo clique para editar"}
      className={`inline-block px-2 py-0.5 rounded text-right transition-colors cursor-pointer ${isEdited ? "border border-accent/30 text-accent bg-accent/5 font-medium" : "border border-transparent text-foreground hover:bg-secondary/40 font-normal"}`}
    >
      {brl(value)}
      {isEdited && (
        <span className={`ml-1 text-[9px] font-semibold ${diff > 0 ? "text-success" : "text-destructive"}`}>
          {diff > 0 ? "▲" : "▼"}
        </span>
      )}
    </span>
  );
}

function Th({ children, right, className = "" }: { children?: React.ReactNode; right?: boolean; className?: string }) {
  return <th className={`px-2.5 sm:px-3.5 py-2.5 sm:py-3 text-xs font-medium text-muted-foreground whitespace-nowrap select-none ${right ? "text-right" : "text-left"} ${className}`}>{children}</th>;
}

function Td({ 
  children, 
  right, 
  className = "", 
  suppressHydrationWarning,
  onDoubleClick,
  title,
  ...rest
}: React.TdHTMLAttributes<HTMLTableCellElement> & { 
  children?: React.ReactNode; 
  right?: boolean; 
  className?: string; 
  suppressHydrationWarning?: boolean; 
}) {
  return (
    <td 
      suppressHydrationWarning={suppressHydrationWarning} 
      onDoubleClick={onDoubleClick}
      title={title}
      className={`px-2.5 sm:px-3 py-2.5 sm:py-3 num text-xs sm:text-sm text-foreground whitespace-nowrap ${right ? "text-right" : "text-left"} ${className}`}
      {...rest}
    >
      {children}
    </td>
  );
}


export const TabelaMesAMes = React.memo(function TabelaMesAMes({ 
  showFinancials = true, 
  showCompletedToggle = true,
  allowDailyDetail = false,
}: { 
  showFinancials?: boolean; 
  showCompletedToggle?: boolean; 
  showCenarioSelector?: boolean;
  allowDailyDetail?: boolean;
}) {
  const {
    pessoas,
    aportesExtras,
    aportesRegularesEditadosPorPessoa,
    setAportesExtras,
    setAportesRegularesEditadosPorPessoa,
    salvarPlano,
    saveDraft,
    calcularBackend,
    mesesConcluidos,
    setMesesConcluidos,
    backendData,
    calculating,
  } = usePlanLogic();

  const diaDoAporte = usePlanStore(state => state.diaDoAporte);
  const diasDoAportePorMes = usePlanStore(state => state.diasDoAportePorMes);
  const setDiaDoAporte = usePlanStore(state => state.setDiaDoAporte);
  const setDiaDoAporteMes = usePlanStore(state => state.setDiaDoAporteMes);
  const setPessoas = usePlanStore(state => state.setPessoas);
  const objetivo = usePlanStore(state => state.objetivo);
  const taxaCdiAnual = Number(objetivo?.taxaCdiAnual ?? 10.5);
  const tipoInvestimento = objetivo?.tipoInvestimento || "cdb_100";

  const [editingMes, setEditingMes] = useState<number | null>(null);
  const [mesDetalheDiario, setMesDetalheDiario] = useState<number | null>(null);
  const [modalInitialTab, setModalInitialTab] = useState<ModalTab>("aportes");
  const [modalFocusPessoaId, setModalFocusPessoaId] = useState<string | null>(null);
  const [extraParaExcluir, setExtraParaExcluir] = useState<{ index: number; origem: string; valor: number; pessoaNome?: string; data?: string } | null>(null);
  const [excluindoExtra, setExcluindoExtra] = useState(false);

  const handleSalvarDiaAporte = (novoDia: number, aplicarParaTodos: boolean) => {
    if (mesDetalheDiario == null) return;
    if (aplicarParaTodos) {
      setDiaDoAporte(novoDia);
      saveDraft({ diaDoAporte: novoDia } as any);
      toast.success(`Dia ${novoDia} definido como padrão para os aportes.`);
    } else {
      setDiaDoAporteMes(mesDetalheDiario, novoDia);
      const nextMap = { ...(diasDoAportePorMes || {}), [mesDetalheDiario]: novoDia };
      saveDraft({ diasDoAportePorMes: nextMap } as any);
      toast.success(`Aporte do Mês ${mesDetalheDiario} configurado para o dia ${novoDia}.`);
    }
  };

  const handleSalvarDiaAportePessoa = (pessoaId: string, novoDia: number) => {
    const novasPessoas = pessoas.map(p => p.id === pessoaId ? { ...p, diaAporte: novoDia } : p);
    setPessoas(novasPessoas);
    salvarPlano({ pessoas: novasPessoas });
    const nomePessoa = pessoas.find(p => p.id === pessoaId)?.nome || "Participante";
    toast.success(`Aporte de ${nomePessoa.split(" ")[0]} configurado para o dia ${novoDia}.`);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && extraParaExcluir && !excluindoExtra) {
        setExtraParaExcluir(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [extraParaExcluir, excluindoExtra]);

  const openModal = (mes: number, tab: ModalTab = "aportes", pessoaId: string | null = null) => {
    setEditingMes(mes);
    setModalInitialTab(tab);
    setModalFocusPessoaId(pessoaId);
  };

  const mesesConcluidosSet = useMemo(() => new Set(mesesConcluidos), [mesesConcluidos]);

  const toggleConcluido = (mes: number) => {
    setMesesConcluidos(prev => {
      if (prev.includes(mes)) return prev.filter(m => m !== mes);
      return [...prev, mes];
    });
  };

  const sim = backendData;

  const handleExportCSV = () => {
    if (!displayRows.length) return;

    const headers = [
      "Mes",
      "Data",
      ...pessoas.map(p => p.nome),
      "Extras",
      "Aporte Mes",
      ...(showFinancials ? [
        "Rendimento Liquido", 
        ...pessoas.map(p => `Acum. ${p.nome.split(" ")[0]}`),
        "Acumulado"
      ] : [])
    ];

    const rows = displayRows.map(r => {
      const isZero = r.mes === 0;
      const dataFormatada = new Date(r.data).toLocaleDateString("pt-BR", { month: "short", year: "2-digit", timeZone: "UTC" }).replace(" de ", " ");
      const rowData = [
        isZero ? "Início" : `Mês ${r.mes}`,
        dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1),
        ...pessoas.map(p => {
          const real = isZero ? (r.saldoPorPessoa[p.id] ?? Number(p.valorInicial) ?? 0) : r.aporteFinalPorPessoa[p.id] || 0;
          return real.toFixed(2);
        }),
        r.aportesExtras.toFixed(2),
        (r.aporteRegular + r.aportesExtras).toFixed(2),
        ...(showFinancials ? [
          r.rendimentoLiquido.toFixed(2),
          ...pessoas.map(p => (r.saldoPorPessoa[p.id] || 0).toFixed(2)),
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

  const displayRows = (() => {
    if (!sim || !sim.detalhesMensais) return [];
    
    return sim.detalhesMensais.map(r => ({
      mes: r.mes,
      data: new Date(r.dataReferencia).toISOString(),
      aporteRegular: r.aporteMensal,
      aportesExtras: r.aportesExtras,
      rendimentoLiquido: r.rendimentoLiquido,
      saldoAcumulado: r.totalAcumulado,
      atingiu: sim.mesesParaAtingir === r.mes && sim.atingiuMeta,
      isExtra: Math.abs(r.aportesExtras) > 0.001,
      aporteFinalPorPessoa: Object.fromEntries(
        (r.participantes || []).map(p => [p.participanteId, p.aporteMensal])
      ),
      saldoPorPessoa: Object.fromEntries(
        (r.participantes || []).map(p => [p.participanteId, p.saldo])
      )
    }));
  })();

  const totals = (() => {
    if (!displayRows.length) return { rendLiquido: 0, aporteRegular: 0, extras: 0, totalMes: 0, saldoFinal: 0, aportePorPessoa: {} as Record<string, number> };
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
      rendLiquido: rl,
      aporteRegular: ap,
      extras: ex,
      totalMes: ap + ex,
      saldoFinal: displayRows[displayRows.length - 1].saldoAcumulado,
      aportePorPessoa
    };
  })();

  const selectedRow = editingMes !== null ? displayRows.find(r => r.mes === editingMes) || null : null;

  const selectedRowExtras = selectedRow && aportesExtras
    ? (aportesExtras || [])
        .map((e, idx) => ({ ...e, index: idx }))
        .filter(e => e?.data && selectedRow?.data && e.data.startsWith(selectedRow.data.split("T")[0]))
    : [];

  const handleSaveAportes = async (novosValores: Record<string, number>) => {
    if (editingMes === null) return;
    const newEdits: Record<string, Record<number, number>> = { ...aportesRegularesEditadosPorPessoa };
    pessoas.forEach(p => {
      const v = novosValores[p.id];
      const defaultP = Number(p.aporte_mensal) || 0;
      const pEdits = { ...(newEdits[p.id] || {}) };
      if (v === defaultP) { delete pEdits[editingMes]; } else { pEdits[editingMes] = v; }
      newEdits[p.id] = pEdits;
    });
    setAportesRegularesEditadosPorPessoa(() => newEdits);
    const savedId = await salvarPlano({ aportesRegularesEditadosPorPessoa: newEdits });
    if (savedId) await calcularBackend(savedId);
  };

  const handleAddExtra = async (pessoaId: string | null, origem: string, valor: number) => {
    if (!selectedRow) return;
    const p = pessoaId ? pessoas.find(x => x.id === pessoaId) : null;
    const newExtra = {
      pessoaId: pessoaId || undefined,
      pessoaNome: p ? p.nome.split(" ")[0] : undefined,
      origem,
      valor,
      data: selectedRow.data.split("T")[0]
    };
    const updatedExtras = [...aportesExtras, newExtra];
    setAportesExtras(() => updatedExtras);
    const savedId = await salvarPlano({ aportesExtras: updatedExtras });
    if (savedId) await calcularBackend(savedId);
  };

  const handleEditExtra = async (index: number, origem: string, valor: number, pessoaId?: string) => {
    const next = [...aportesExtras];
    const p = pessoaId ? pessoas.find(x => x.id === pessoaId) : (next[index]?.pessoaId ? pessoas.find(x => x.id === next[index].pessoaId) : null);
    next[index] = {
      ...next[index],
      origem,
      valor,
      pessoaId: pessoaId !== undefined ? (pessoaId || undefined) : next[index]?.pessoaId,
      pessoaNome: p ? p.nome.split(" ")[0] : (pessoaId === "" ? undefined : next[index]?.pessoaNome)
    };
    setAportesExtras(() => next);
    saveDraft({ aportesExtras: next });
    const savedId = await salvarPlano({ aportesExtras: next });
    if (savedId) await calcularBackend(savedId);
  };

  const handleDeleteExtra = (index: number) => {
    const extra = aportesExtras[index];
    if (!extra) return;
    setExtraParaExcluir({
      index,
      origem: extra.origem || "Aporte Extra",
      valor: extra.valor || 0,
      pessoaNome: extra.pessoaNome,
      data: extra.data
    });
  };

  const confirmarExclusaoExtra = async () => {
    if (!extraParaExcluir) return;
    const indexToDelete = extraParaExcluir.index;
    setExcluindoExtra(true);
    try {
      const next = aportesExtras.filter((_, i) => i !== indexToDelete);
      setAportesExtras(() => next);
      usePlanStore.getState().hydrate({ aportesExtras: next });
      saveDraft({ aportesExtras: next });
      const savedId = await salvarPlano({ aportesExtras: next });
      const idToUse = savedId || usePlanStore.getState().planoId;
      if (idToUse) {
        await calcularBackend(idToUse, { aportesExtras: next });
      }
      toast.success("Aporte extra excluído e planejamento recalculado!");
      setExtraParaExcluir(null);
    } catch (err) {
      console.error("Erro ao excluir aporte extra:", err);
      toast.error("Não foi possível excluir o aporte extra.");
    } finally {
      setExcluindoExtra(false);
    }
  };

  const handleSaveAcumulado = async (novosSaldos: Record<string, number>) => {
    if (!selectedRow) return;
    const mesDataPrefix = selectedRow.data.split("T")[0];

    // Remove ajustes anteriores deste mês para que um novo valor de acumulado
    // substitua o ajuste anterior em vez de duplicar ou acumular.
    const outrosExtras = (aportesExtras || []).filter(e => {
      const isMesAtual = e.data && e.data.startsWith(mesDataPrefix);
      const isAjuste = e.origem && (e.origem.startsWith("Ajuste") || e.origem.toLowerCase().includes("ajuste"));
      return !(isMesAtual && isAjuste);
    });

    const novosLancamentosExtras: any[] = [];

    pessoas.forEach(p => {
      // Verifica se já havia um ajuste de saldo anterior para este participante neste mês
      const ajusteExistente = (aportesExtras || []).find(e => 
        e.data && e.data.startsWith(mesDataPrefix) && 
        e.pessoaId === p.id && 
        e.origem && (e.origem.startsWith("Ajuste") || e.origem.toLowerCase().includes("ajuste"))
      );
      const valorAjusteAntigo = ajusteExistente ? Number(ajusteExistente.valor || 0) : 0;

      // Saldo projetado base antes do ajuste anterior deste mês
      const current = selectedRow.saldoPorPessoa[p.id] || 0;
      const saldoBaseSemAjuste = current - valorAjusteAntigo;

      const newValue = novosSaldos[p.id] !== undefined ? novosSaldos[p.id] : current;
      const diff = newValue - saldoBaseSemAjuste;

      if (Math.abs(diff) > 0.01) {
        novosLancamentosExtras.push({
          pessoaId: p.id,
          pessoaNome: p.nome.split(" ")[0],
          origem: "Ajuste de Saldo",
          valor: diff,
          data: mesDataPrefix
        });
      }
    });

    const updatedExtras = [...outrosExtras, ...novosLancamentosExtras];
    setAportesExtras(() => updatedExtras);
    const savedId = await salvarPlano({ aportesExtras: updatedExtras });
    if (savedId) await calcularBackend(savedId);
  };

  if (!displayRows.length) return null;

  return (
    <div className="space-y-4 relative w-full">
      {/* Container fixo para evitar reflows no pai */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-semibold text-xl sm:text-2xl tracking-tight text-foreground">Mês a Mês</h3>
            <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded-full font-medium shadow-soft">
              {displayRows.length - 1} meses
            </span>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="text-xs h-8 gap-1.5 border-border/80 hover:bg-secondary/50 text-foreground cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-accent" />
              Exportar CSV
            </Button>
          </div>
        </div>
      
        {/* Usando block e min-w-full mas limitando o overflow num scroll container estável */}
                
        <div className={`overflow-x-auto bg-card rounded-2xl shadow-soft border border-border/50 transition-opacity duration-300 custom-scrollbar ${calculating ? "opacity-60 pointer-events-none" : "opacity-100"}`}>
          <table className="w-full text-sm font-sans border-collapse relative">
            <thead className="bg-card text-muted-foreground border-b border-border/60">
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
                    <Th right>Rend. Líq.</Th>
                    {pessoas.map(p => (
                      <Th key={`acc-${p.id}`} right>Acum. {p.nome.split(" ")[0]}</Th>
                    ))}
                    <Th right>Acumulado</Th>
                  </>
                )}
                <Th className="w-10"></Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/10">
              {displayRows.map((r) => {
                const isMesConcluido = r.mes != null ? mesesConcluidosSet.has(r.mes) : false;
                const isZero = r.mes === 0;
                const rowExtras = (aportesExtras || [])
                  .filter(e => e?.data && r?.data && e.data.startsWith(r.data.split("T")[0]))
                  .map((e, idx) => ({ ...e, index: idx }));
                const totalAporteMes = (r.aporteRegular || 0) + (r.aportesExtras || 0);

                return (
                  <tr
                    key={r.mes}
                    onDoubleClick={(event) => {
                      const target = event.target as HTMLElement;
                      if (isZero || target.closest("button, input, select, textarea, a, [role='button']")) return;
                      openModal(r.mes, "aportes");
                    }}
                    className={`
                      transition-colors hover:bg-secondary/10 bg-card ${isZero ? "" : "cursor-pointer"}
                      ${r.atingiu ? "bg-success/5" : ""} 
                      ${isMesConcluido ? "opacity-60 bg-secondary/5" : ""} 
                    `}
                  >
                    <Td className="font-medium whitespace-nowrap w-px">
                      <span className="inline-flex items-center gap-2">
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
                            <span className="ml-2 hidden sm:inline-flex items-center bg-success/10 text-success text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded tracking-wide border border-success/20">
                              Meta ✓
                            </span>
                          )}
                        </span>
                        {!isZero && allowDailyDetail && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMesDetalheDiario(r.mes);
                            }}
                            className="p-1 rounded-md text-muted-foreground/50 hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer"
                            title={`Ver dia a dia do Mês ${r.mes}`}
                          >
                            <CalendarDays className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </span>
                    </Td>
                    <Td suppressHydrationWarning className="text-muted-foreground text-xs font-normal">
                      {(() => {
                        const d = new Date(r.data);
                        const m = d.toLocaleDateString("pt-BR", { month: "short", timeZone: "UTC" }).replace(".", "");
                        const y = d.toLocaleDateString("pt-BR", { year: "2-digit", timeZone: "UTC" });
                        return `${m.charAt(0).toUpperCase() + m.slice(1)}/${y}`;
                      })()}
                    </Td>
                    
                    {pessoas.map(p => {
                      const planejado = Number(p.aporte_mensal) || 0;
                      const real = isZero ? (r.saldoPorPessoa[p.id] ?? Number(p.valorInicial) ?? 0) : r.aporteFinalPorPessoa[p.id] || 0;
                      const wasEdited = isZero ? false : real !== planejado;
                      return (
                        <Td 
                          key={p.id} 
                          right
                          onDoubleClick={(e) => {
                            if (isZero) return;
                            e.stopPropagation();
                            openModal(r.mes, "aportes", p.id);
                          }}
                          className={isZero ? "" : "cursor-pointer"}
                        >
                          {isZero ? (
                            <span className="text-muted-foreground">{brl(real)}</span>
                          ) : (
                            <DisplayAporte value={real} planned={planejado} isEdited={wasEdited} />
                          )}
                        </Td>
                      );
                    })}

                    <Td 
                      right 
                      className={`relative ${isZero ? "" : "cursor-pointer"}`}
                      onDoubleClick={(e) => {
                        if (isZero) return;
                        e.stopPropagation();
                        openModal(r.mes, "extras");
                      }}
                    >
                      {(() => {
                        if (isZero) return <span className="text-muted-foreground">{brl(0)}</span>;
                        
                        return (
                          <ExtrasCell
                            total={r.aportesExtras}
                            contextItems={rowExtras}
                            onDoubleClick={() => openModal(r.mes, "extras")}
                            onEditExtra={(index, origem, valor) => handleEditExtra(index, origem, valor)}
                            onDeleteExtra={(index) => handleDeleteExtra(index)}
                          />
                        );
                      })()}
                    </Td>

                    <Td right className="font-medium text-foreground">
                      {brl(totalAporteMes)}
                    </Td>

                    {showFinancials && (
                      <>
                        <Td right className="text-success font-medium">
                          {r.rendimentoLiquido > 0 ? `+${brl(r.rendimentoLiquido)}` : brl(r.rendimentoLiquido)}
                        </Td>

                        {pessoas.map(p => (
                          <Td 
                            key={`s-${p.id}`} 
                            right 
                            onDoubleClick={(e) => {
                              if (isZero) return;
                              e.stopPropagation();
                              openModal(r.mes, "acumulado", p.id);
                            }}
                            className={`font-normal text-sm text-muted-foreground ${isZero ? "" : "cursor-pointer"}`}
                            title={isZero ? undefined : `Duplo clique para calibrar saldo acumulado de ${p.nome}`}
                          >
                            {brl(r.saldoPorPessoa[p.id] || 0)}
                          </Td>
                        ))}

                        <Td 
                          right 
                          onDoubleClick={(e) => {
                            if (isZero) return;
                            e.stopPropagation();
                            openModal(r.mes, "acumulado");
                          }}
                          className={`font-medium text-sm text-foreground ${isZero ? "" : "cursor-pointer"}`}
                          title={isZero ? undefined : "Duplo clique para calibrar saldo acumulado"}
                        >
                          {brl(r.saldoAcumulado)}
                        </Td>
                      </>
                    )}
                    
                    <Td right className="group">
                      {!isZero && (
                        <RowActions 
                          onOpenModal={(tab) => openModal(r.mes, tab)} 
                          onOpenDetalheDiario={allowDailyDetail ? () => setMesDetalheDiario(r.mes) : undefined}
                        />
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gradient-ink text-primary-foreground shadow-elevated">
              <tr className="font-medium relative">
                <td className="px-2.5 sm:px-3 py-3 sm:py-4 num text-xs sm:text-sm whitespace-nowrap text-left border-none font-semibold">Total Geral</td>
                <td className="px-2.5 sm:px-3 py-3 sm:py-4 num text-xs sm:text-sm border-none">{""}</td>
                {pessoas.map(p => (
                  <td key={p.id} className="px-2.5 sm:px-3 py-3 sm:py-4 num text-xs sm:text-sm whitespace-nowrap text-right border-none">{brl(totals.aportePorPessoa[p.id])}</td>
                ))}
                <td className="px-2.5 sm:px-3 py-3 sm:py-4 num text-xs sm:text-sm whitespace-nowrap text-right border-none">{brl(totals.extras)}</td>
                <td className="px-2.5 sm:px-3 py-3 sm:py-4 num text-xs sm:text-sm whitespace-nowrap text-right border-none font-semibold">{brl(totals.totalMes)}</td>
                {showFinancials && (
                  <>
                    <td className="px-3 py-4 num text-sm whitespace-nowrap text-right border-none text-success">
                      {totals.rendLiquido > 0 ? `+${brl(totals.rendLiquido)}` : brl(totals.rendLiquido)}
                    </td>
                    {pessoas.map(p => (
                      <td key={`foot-acc-${p.id}`} className="px-3 py-4 num text-sm whitespace-nowrap text-right border-none font-medium">
                        {brl(displayRows[displayRows.length - 1].saldoPorPessoa[p.id] || 0)}
                      </td>
                    ))}
                    <td className="px-3 py-3 num whitespace-nowrap text-right border-none">
                      <span className="inline-flex flex-col items-end gap-1">
                        <span className="font-semibold text-lg sm:text-xl text-primary-foreground tracking-tight">{brl(totals.saldoFinal)}</span>
                        <span className="text-[10px] text-primary-foreground/80 font-medium px-2 py-0.5 rounded-sm bg-primary-foreground/10" title="Total Aportes + Rendimento no período">
                          +{brl(totals.totalMes + totals.rendLiquido)} período
                        </span>
                      </span>
                    </td>
                  </>
                )}
                <td className="px-3 py-4 border-none"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {selectedRow && (
        <EditMesModal
          key={`${selectedRow.mes}-${modalInitialTab}`}
          isOpen={editingMes !== null}
          onClose={() => setEditingMes(null)}
          mes={selectedRow.mes}
          data={selectedRow.data}
          atingiuMeta={selectedRow.atingiu}
          isMesConcluido={mesesConcluidosSet.has(selectedRow.mes)}
          pessoas={pessoas.map(p => ({ id: p.id, nome: p.nome, aporte_mensal: Number(p.aporte_mensal) || 0 }))}
          aportesPlanejados={Object.fromEntries(pessoas.map(p => [p.id, Number(p.aporte_mensal) || 0]))}
          aportesReais={selectedRow.aporteFinalPorPessoa}
          saldosAcumulados={selectedRow.saldoPorPessoa}
          saldoAcumuladoTotal={selectedRow.saldoAcumulado}
          rendimentoLiquido={selectedRow.rendimentoLiquido}
          extrasDoMes={selectedRowExtras}
          initialTab={modalInitialTab}
          focusPessoaId={modalFocusPessoaId}
          showFinancials={showFinancials}
          onOpenDetalheDiario={allowDailyDetail ? () => setMesDetalheDiario(selectedRow.mes) : undefined}
          onSaveAportes={handleSaveAportes}
          onAddExtra={handleAddExtra}
          onEditExtra={handleEditExtra}
          onDeleteExtra={handleDeleteExtra}
          onSaveAcumulado={handleSaveAcumulado}
        />
      )}

      {/* Modal de Evolução Diária do Mês */}
      {allowDailyDetail && mesDetalheDiario != null && (() => {
        const row = displayRows.find(x => x.mes === mesDetalheDiario);
        if (!row) return null;
        const prevRow = displayRows.find(x => x.mes === mesDetalheDiario - 1);
        const saldoInicialMes = prevRow ? prevRow.saldoAcumulado : (Number(sim?.valorJaGuardado) || 0);
        const rowExtras = (aportesExtras || []).filter(e => e?.data && row?.data && e.data.startsWith(row.data.split("T")[0]));
        const diaAporteConfig = diasDoAportePorMes[mesDetalheDiario] ?? diaDoAporte ?? 5;
        const participantesDoMes = pessoas.map(p => ({
          id: p.id,
          nome: p.nome,
          aporte_mensal: row.aporteFinalPorPessoa[p.id] ?? p.aporte_mensal,
          diaAporte: p.diaAporte ?? diaAporteConfig,
        }));

        return (
          <DetalheMesDiarioModal
            isOpen={true}
            onClose={() => setMesDetalheDiario(null)}
            mes={row.mes}
            dataReferencia={row.data}
            saldoInicialMes={saldoInicialMes}
            aporteRegular={row.aporteRegular}
            aportesExtras={rowExtras}
            taxaCdiAnual={taxaCdiAnual}
            tipoInvestimento={tipoInvestimento}
            diaAporteInicial={diaAporteConfig}
            pessoas={participantesDoMes}
            onSalvarDiaAporte={handleSalvarDiaAporte}
            onSalvarDiaAportePessoa={handleSalvarDiaAportePessoa}
          />
        );
      })()}

      {/* Modal de Confirmação de Exclusão de Aporte Extra */}
      {extraParaExcluir && typeof document !== "undefined" && createPortal(
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div 
            className="relative w-full max-w-md rounded-2xl border border-border/70 bg-white dark:bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-card-foreground overflow-hidden font-sans"
          >
            {/* Linha decorativa de topo */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-destructive" />

            {/* Botão Fechar */}
            <button
              type="button"
              onClick={() => !excluindoExtra && setExtraParaExcluir(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
              title="Fechar"
              disabled={excluindoExtra}
            >
              <X className="h-4 w-4" />
            </button>

            {/* Ícone e Título */}
            <div className="flex items-start gap-4 pt-1">
              <div className="h-12 w-12 shrink-0 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center shadow-xs">
                <Trash2 className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0 pr-6">
                <h3 className="font-display text-xl font-semibold text-foreground tracking-tight">
                  Excluir aporte extra?
                </h3>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  Tem certeza que deseja excluir o aporte de <strong className="text-foreground font-semibold">{brl(extraParaExcluir.valor)}</strong> ({extraParaExcluir.origem}{extraParaExcluir.pessoaNome ? ` · ${extraParaExcluir.pessoaNome}` : ""})?
                </p>
              </div>
            </div>

            {/* Alerta de consequência */}
            <div className="mt-4 p-3 rounded-xl bg-destructive/5 border border-destructive/15 text-xs text-destructive/90 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-destructive" />
              <span className="leading-relaxed">
                O saldo acumulado e as projeções do planejamento serão recalculados automaticamente.
              </span>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-3 mt-6">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1 h-11 rounded-xl font-medium border-border/70 hover:bg-secondary/80" 
                onClick={() => setExtraParaExcluir(null)} 
                disabled={excluindoExtra}
              >
                Cancelar
              </Button>
              <Button 
                type="button" 
                variant="destructive" 
                className="flex-1 h-11 rounded-xl font-medium shadow-sm hover:opacity-95 flex items-center justify-center gap-2" 
                onClick={confirmarExclusaoExtra} 
                disabled={excluindoExtra}
              >
                {excluindoExtra ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin-smooth" />
                    <span>Recalculando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>Sim, excluir</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
});
