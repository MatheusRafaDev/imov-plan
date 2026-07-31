"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import React from "react";
import { createPortal } from "react-dom";
import { usePlanContext } from "@/context/PlanContext";
import { brl, mesDaSimulacaoParaData, type CenarioSimulacao } from "@/lib/finance";
import { Check, ChevronDown, ChevronUp, MoreHorizontal, Edit2, Plus, Trash2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { MoneyInput } from "@/components/MoneyInput";
import { ScenarioComparison } from "@/app/app/resultado/components/ScenarioComparison";

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

function RowActions({
  mes,
  pessoas,
  aportesPlanejados,
  aportesReais,
  onSaveAportes,
  onAddExtra,
}: {
  mes: number;
  pessoas: { id: string; nome: string }[];
  aportesPlanejados: Record<string, number>;
  aportesReais: Record<string, number>;
  onSaveAportes: (novosValores: Record<string, number>) => void;
  onAddExtra: (pessoaId: string | null, origem: string, valor: number) => void;
}) {
  const [openMenu, setOpenMenu] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openExtra, setOpenExtra] = useState(false);

  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const editPopupRef = useRef<HTMLDivElement>(null);
  const extraPopupRef = useRef<HTMLDivElement>(null);

  const [portalPos, setPortalPos] = useState({ top: 0, left: 0, width: 0 });

  // Estado Modal Edit
  const [editDraft, setEditDraft] = useState<Record<string, string>>({});
  const [prevOpenEdit, setPrevOpenEdit] = useState(openEdit);

  if (openEdit !== prevOpenEdit) {
    setPrevOpenEdit(openEdit);
    if (openEdit) {
      const initial: Record<string, string> = {};
      pessoas.forEach(p => initial[p.id] = (aportesReais[p.id] || 0).toFixed(2));
      setEditDraft(initial);
    }
  }

  // Estado Modal Extra
  const [extraPessoa, setExtraPessoa] = useState<string>("conjunto");
  const [extraOrigemMode, setExtraOrigemMode] = useState<"predefined" | "custom">("predefined");
  const [extraOrigemPredefined, setExtraOrigemPredefined] = useState("13º Salário");
  const [extraOrigemCustom, setExtraOrigemCustom] = useState("");
  const [extraValor, setExtraValor] = useState("0");

  const updatePos = (width: number) => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const left = rect.left - width - 12;
      const finalLeft = left < 8 ? rect.right + 12 : left;
      // Garante que o top não ultrapasse a tela
      const rawTop = rect.top;
      const top = Math.max(8, Math.min(rawTop, window.innerHeight - 420));
      setPortalPos({ top, left: Math.min(finalLeft, window.innerWidth - width - 8), width });
    }
  };

  useEffect(() => {
    if (openEdit) updatePos(300);
    else if (openExtra) updatePos(280);
    else if (openMenu) updatePos(220);
  }, [openMenu, openEdit, openExtra]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current && triggerRef.current.contains(target)) return;
      if (openMenu && menuRef.current && !menuRef.current.contains(target)) setOpenMenu(false);
      if (openEdit && editPopupRef.current && !editPopupRef.current.contains(target)) setOpenEdit(false);
      if (openExtra && extraPopupRef.current && !extraPopupRef.current.contains(target)) setOpenExtra(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenu, openEdit, openExtra]);

  return (
    <div ref={triggerRef} className="relative flex items-center justify-center">
      <button
        type="button"
        onClick={() => setOpenMenu(o => !o)}
        className={`w-7 h-7 flex items-center justify-center rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors ${openMenu || openEdit || openExtra ? "opacity-100 bg-secondary" : "opacity-40 hover:opacity-100 focus:opacity-100"}`}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {openMenu && typeof document !== "undefined" && createPortal(
        <div ref={menuRef} className="fixed z-50 rounded-xl border border-border/70 bg-card shadow-xl overflow-hidden py-1" style={{ top: `${portalPos.top}px`, left: `${portalPos.left}px`, width: `${portalPos.width}px` }}>
          <button onClick={() => { setOpenMenu(false); setOpenEdit(true); }} className="w-full text-left px-4 py-2.5 text-xs text-foreground hover:bg-secondary/70 flex items-center gap-2">
            <Edit2 className="h-3.5 w-3.5 text-muted-foreground" /> Editar Aportes do Mês
          </button>
          <button onClick={() => { setOpenMenu(false); setOpenExtra(true); }} className="w-full text-left px-4 py-2.5 text-xs text-foreground hover:bg-secondary/70 flex items-center gap-2">
            <Plus className="h-3.5 w-3.5 text-muted-foreground" /> Adicionar Aporte Extra
          </button>
        </div>,
        document.body
      )}

      {openEdit && typeof document !== "undefined" && createPortal(
        <div ref={editPopupRef} className="fixed z-50 rounded-2xl border border-border/70 bg-card shadow-xl overflow-hidden" style={{ top: `${portalPos.top}px`, left: `${portalPos.left}px`, width: `${portalPos.width}px` }}>
          <div className="bg-secondary/60 px-4 py-3 border-b border-border/50">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Editar Aportes · Mês {mes}</p>
          </div>
          <div className="p-4 space-y-4">
            {pessoas.map(p => {
              const planejado = aportesPlanejados[p.id] || 0;
              const val = editDraft[p.id] === "" ? 0 : Number(editDraft[p.id]);
              const diff = val - planejado;
              return (
                <div key={p.id} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">{p.nome.split(" ")[0]}</span>
                    <span className="text-muted-foreground">Planejado: {brl(planejado)}</span>
                  </div>
                  <MoneyInput
                    variant="money"
                    min={0}
                    value={val}
                    onChange={(v) => setEditDraft(prev => ({ ...prev, [p.id]: v === "" ? "0" : v.toString() }))}
                    className="h-9 text-sm bg-background border-border"
                  />
                  {diff !== 0 && (
                    <div className={`text-[10px] font-semibold text-right ${diff > 0 ? "text-success" : "text-destructive"}`}>
                      {diff > 0 ? `▲ +${brl(diff)}` : `▼ -${brl(Math.abs(diff))}`}
                    </div>
                  )}
                </div>
              );
            })}
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setOpenEdit(false)} className="flex-1 rounded-xl border border-border/60 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
              <button type="button" onClick={() => {
                const results: Record<string, number> = {};
                pessoas.forEach(p => results[p.id] = Number(editDraft[p.id] || 0));
                onSaveAportes(results);
                setOpenEdit(false);
              }} className="flex-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors">Salvar</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {openExtra && typeof document !== "undefined" && createPortal(
        <div ref={extraPopupRef} className="fixed z-50 rounded-b-xl border border-t-0 border-border/70 bg-card shadow-xl overflow-hidden" style={{ top: `${portalPos.top}px`, left: `${portalPos.left}px`, width: `${portalPos.width}px`, maxHeight: 'calc(100vh - 16px)' }}>
          <div className="bg-secondary/60 px-3 py-2 border-b border-border/50">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Extra · Mês {mes}</p>
          </div>
          <div className="p-3 space-y-2.5 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 60px)' }}>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">Pessoa</label>
                <select value={extraPessoa} onChange={e => setExtraPessoa(e.target.value)} className="w-full h-8 px-2 rounded-md border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary/20">
                  <option value="conjunto">Conjunto</option>
                  {pessoas.map(p => (
                    <option key={p.id} value={p.id}>{p.nome.split(" ")[0]}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">Origem</label>
                {extraOrigemMode === "predefined" ? (
                  <select 
                    value={extraOrigemPredefined} 
                    onChange={e => {
                      if (e.target.value === "Outro") setExtraOrigemMode("custom");
                      else setExtraOrigemPredefined(e.target.value);
                    }} 
                    className="w-full h-8 px-2 rounded-md border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary/20"
                  >
                    <option value="13º Salário">13º Salário</option>
                    <option value="Férias">Férias</option>
                    <option value="Bônus">Bônus</option>
                    <option value="PLR">PLR</option>
                    <option value="Renda Extra">Renda Extra</option>
                    <option value="Venda de Bem">Venda de Bem</option>
                    <option value="Restituição IR">Restituição IR</option>
                    <option value="Outro">Outro...</option>
                  </select>
                ) : (
                  <div className="flex gap-1">
                    <input autoFocus type="text" value={extraOrigemCustom} onChange={e => setExtraOrigemCustom(e.target.value)} placeholder="Digite..." className="w-full h-8 px-2 rounded-md border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary/20" />
                    <button type="button" onClick={() => { setExtraOrigemMode("predefined"); setExtraOrigemCustom(""); }} className="h-8 px-1.5 text-[10px] border border-border rounded-md bg-secondary text-muted-foreground hover:text-foreground shrink-0">←</button>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium">Valor</label>
              <MoneyInput variant="money" min={0} value={extraValor === "" ? 0 : Number(extraValor)} onChange={(v) => setExtraValor(v === "" ? "0" : v.toString())} className="h-8 text-xs bg-background border-border" />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setOpenExtra(false); setExtraOrigemMode("predefined"); setExtraOrigemCustom(""); setExtraValor("0"); }} className="flex-1 rounded-lg border border-border/60 px-2 py-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
              <button type="button" 
                disabled={(extraOrigemMode === "custom" && !extraOrigemCustom.trim()) || Number(extraValor) <= 0} 
                onClick={() => {
                  const pid = extraPessoa === "conjunto" ? null : extraPessoa;
                  const finalOrigem = extraOrigemMode === "predefined" ? extraOrigemPredefined : extraOrigemCustom.trim();
                  onAddExtra(pid, finalOrigem, Number(extraValor)); 
                  setOpenExtra(false); setExtraOrigemMode("predefined"); setExtraOrigemCustom(""); setExtraValor("0"); 
              }} className="flex-1 rounded-lg bg-primary px-2 py-1.5 text-[10px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">Adicionar</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}


// ─── Extras Cell (context aportes) ────────────────────────
type ContextExtra = { origem: string; valor: number; pessoaNome?: string; index: number };

function ExtrasCell({ contextItems, total, onEditExtra, onDeleteExtra }: {
  contextItems: ContextExtra[];
  total: number;
  onEditExtra: (index: number, origem: string, valor: number) => void;
  onDeleteExtra: (index: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editOrigem, setEditOrigem] = useState("");
  const [editValor, setEditValor] = useState("0");
  const triggerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [portalPos, setPortalPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const width = 288;
      const left = Math.min(
        Math.max(8, rect.left + rect.width - width),
        window.innerWidth - width - 8
      );
      const top = Math.min(rect.bottom + 4, window.innerHeight - 220);
      setPortalPos({ top, left });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        popupRef.current && !popupRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setEditingIdx(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const hasExtras = (contextItems ?? []).length > 0;
  const canOpen = hasExtras;

  const startEdit = (item: ContextExtra) => {
    setEditingIdx(item.index);
    setEditOrigem(item.origem);
    setEditValor(item.valor.toString());
  };

  return (
    <div ref={triggerRef}>
      <div
        onClick={() => { if (canOpen) setOpen(o => !o); }}
        className={`flex items-center justify-end gap-1 px-0.5 sm:px-1.5 py-0.5 rounded transition-colors border border-transparent ${total > 0 ? "cursor-pointer hover:bg-accent/10 hover:border-accent/20 text-accent font-semibold" : "text-muted-foreground/40"}`}
        title={canOpen ? "Clique para ver detalhes" : undefined}
      >
        {total > 0 ? `+${brl(total)}` : "—"}
        {total > 0 && (open ? <ChevronUp className="h-3 w-3 shrink-0" /> : <ChevronDown className="h-3 w-3 shrink-0" />)}
      </div>

      {open && canOpen && typeof document !== "undefined" && createPortal(
        <div
          ref={popupRef}
          className="fixed z-50 w-72 max-h-[300px] overflow-y-auto custom-scrollbar bg-card border border-border rounded-xl shadow-xl p-3 space-y-3"
          style={{ top: `${portalPos.top + 4}px`, left: `${Math.max(8, portalPos.left)}px` }}
        >
          {hasExtras && (
            <div className="space-y-1">
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Extras do mês</p>
              {contextItems.map((item) => (
                <div key={item.index}>
                  {editingIdx === item.index ? (
                    <div className="space-y-2 p-2 rounded-lg bg-secondary/40 border border-border/40">
                      <select value={editOrigem} onChange={e => {
                        if (e.target.value === "__custom__") setEditOrigem("");
                        else setEditOrigem(e.target.value);
                      }} className="w-full h-8 px-2 rounded-md border border-border bg-background text-xs">
                        {["13º Salário","Férias","Bônus","PLR","Renda Extra","Venda de Bem","Restituição IR"].includes(editOrigem) ? null : (
                          <option value={editOrigem}>{editOrigem || "Personalizado"}</option>
                        )}
                        <option value="13º Salário">13º Salário</option>
                        <option value="Férias">Férias</option>
                        <option value="Bônus">Bônus</option>
                        <option value="PLR">PLR</option>
                        <option value="Renda Extra">Renda Extra</option>
                        <option value="Venda de Bem">Venda de Bem</option>
                        <option value="Restituição IR">Restituição IR</option>
                        <option value="__custom__">Outro...</option>
                      </select>
                      {!["13º Salário","Férias","Bônus","PLR","Renda Extra","Venda de Bem","Restituição IR"].includes(editOrigem) && (
                        <input type="text" value={editOrigem} onChange={e => setEditOrigem(e.target.value)} placeholder="Digite..." className="w-full h-8 px-2 rounded-md border border-border bg-background text-xs" />
                      )}
                      <MoneyInput variant="money" min={0} value={Number(editValor) || 0} onChange={(v) => setEditValor(v === "" ? "0" : v.toString())} className="h-8 text-xs bg-background border-border" />
                      <div className="flex gap-1.5">
                        <button type="button" onClick={() => setEditingIdx(null)} className="flex-1 rounded-md border border-border/60 px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground">Cancelar</button>
                        <button type="button" disabled={!editOrigem.trim() || Number(editValor) <= 0} onClick={() => { onEditExtra(item.index, editOrigem.trim(), Number(editValor)); setEditingIdx(null); }} className="flex-1 rounded-md bg-primary px-2 py-1 text-[10px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">Salvar</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-[11px] gap-2 py-0.5 group/extra">
                      <div className="flex flex-col min-w-0">
                        <span className="truncate text-foreground font-medium">{item.origem}</span>
                        <span className="text-[10px] text-muted-foreground">{item.pessoaNome || "Conjunto"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="num text-accent font-semibold">+{brl(item.valor)}</span>
                        <button type="button" onClick={() => startEdit(item)} className="opacity-0 group-hover/extra:opacity-100 w-5 h-5 flex items-center justify-center rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-all" title="Editar">
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button type="button" onClick={() => onDeleteExtra(item.index)} className="opacity-0 group-hover/extra:opacity-100 w-5 h-5 flex items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all" title="Excluir">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}
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
  } = usePlanContext();

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
    <div className="space-y-4 relative w-full overflow-hidden">
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
                      className={`
                        relative px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all duration-300
                        ${active ? "text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}
                      `}
                    >
                      {active && (
                        <div className="absolute inset-0 bg-primary rounded-lg -z-10 shadow-glow animate-fade-in" />
                      )}
                      {cen === "realista" ? "base" : cen}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      
        {/* Usando block e min-w-full mas limitando o overflow num scroll container */}
                
        <div className="w-full overflow-x-auto bg-card rounded-xl shadow-sm border border-border/30 custom-scrollbar">
        <table className="w-full text-sm font-sans border-collapse relative">
          <thead className="bg-secondary/40 text-muted-foreground sticky top-0 z-10 backdrop-blur-sm border-b border-border/60">
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
                    ${isZero ? "bg-secondary/20" : ""}
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