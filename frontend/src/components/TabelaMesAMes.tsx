"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import React from "react";
import { createPortal } from "react-dom";
import { usePlanContext } from "@/context/PlanContext";
import { brl, mesDaSimulacaoParaData, type CenarioSimulacao } from "@/lib/finance";
import { Check, ChevronDown, ChevronUp, MoreHorizontal, Edit2, Plus, Trash2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { MoneyInput } from "@/components/MoneyInput";

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
        <span className={`ml-1 text-[9px] font-bold ${diff > 0 ? "text-green-500" : "text-rose-500"}`}>
          {diff > 0 ? "▲" : "▼"}
        </span>
      )}
    </div>
  );
}

function RowActions({
  mes,
  dataStr,
  pessoas,
  aportesPlanejados,
  aportesReais,
  onSaveAportes,
  onAddExtra,
}: {
  mes: number;
  dataStr: string;
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
  useEffect(() => {
    if (openEdit) {
      const initial: Record<string, string> = {};
      pessoas.forEach(p => initial[p.id] = (aportesReais[p.id] || 0).toFixed(2));
      setEditDraft(initial);
    }
  }, [openEdit, pessoas, aportesReais]);

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
        className={`w-7 h-7 flex items-center justify-center rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors ${openMenu || openEdit || openExtra ? "opacity-100 bg-secondary" : "opacity-0 group-hover:opacity-100 focus:opacity-100"}`}
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
                    <div className={`text-[10px] font-semibold text-right ${diff > 0 ? "text-green-500" : "text-rose-500"}`}>
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
        <div ref={extraPopupRef} className="fixed z-50 rounded-xl border border-border/70 bg-card shadow-xl overflow-hidden" style={{ top: `${portalPos.top}px`, left: `${portalPos.left}px`, width: `${portalPos.width}px`, maxHeight: 'calc(100vh - 16px)' }}>
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
        className={`flex items-center justify-end gap-1 px-1.5 py-0.5 rounded transition-colors border border-transparent ${total > 0 ? "cursor-pointer hover:bg-accent/10 hover:border-accent/20 text-accent font-semibold" : "text-muted-foreground/40"}`}
        title={canOpen ? "Clique para ver detalhes" : undefined}
      >
        {total > 0 ? `+${brl(total)}` : "—"}
        {total > 0 && (open ? <ChevronUp className="h-3 w-3 shrink-0" /> : <ChevronDown className="h-3 w-3 shrink-0" />)}
      </div>

      {open && canOpen && typeof document !== "undefined" && createPortal(
        <div
          ref={popupRef}
          className="fixed z-50 w-72 bg-card border border-border rounded-xl shadow-xl p-3 space-y-3"
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
                        <button type="button" onClick={() => onDeleteExtra(item.index)} className="opacity-0 group-hover/extra:opacity-100 w-5 h-5 flex items-center justify-center rounded hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-all" title="Excluir">
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

function Th({ children, right }: { children?: React.ReactNode; right?: boolean }) {
  return <th className={`px-3 py-2.5 text-[10px] font-medium uppercase tracking-wider whitespace-nowrap ${right ? "text-right" : "text-left"}`}>{children}</th>;
}

function Td({ children, right, className = "", suppressHydrationWarning }: { children?: React.ReactNode; right?: boolean; className?: string; suppressHydrationWarning?: boolean }) {
  return <td suppressHydrationWarning={suppressHydrationWarning} className={`px-3 py-[5px] num ${right ? "text-right" : "text-left"} ${className}`}>{children}</td>;
}

// ─── Seletor de Cenário ───────────────────────────────
const CENARIOS: { value: CenarioSimulacao; label: string; icon: React.ReactNode; color: string }[] = [
  { value: "pessimista", label: "Pessimista", icon: <TrendingDown className="h-3.5 w-3.5" />, color: "text-rose-500 border-rose-500/30 bg-rose-500/5 data-[active=true]:bg-rose-500/15" },
  { value: "realista",   label: "Realista",   icon: <Minus className="h-3.5 w-3.5" />,        color: "text-foreground border-border/60 bg-secondary/40 data-[active=true]:bg-secondary" },
  { value: "otimista",   label: "Otimista",   icon: <TrendingUp className="h-3.5 w-3.5" />,   color: "text-emerald-500 border-emerald-500/30 bg-emerald-500/5 data-[active=true]:bg-emerald-500/15" },
];

function CenarioSelector({ value, onChange }: { value: CenarioSimulacao; onChange: (v: CenarioSimulacao) => void }) {
  return (
    <div className="flex items-center gap-1.5 p-1 rounded-xl border border-border/40 bg-card shadow-sm">
      {CENARIOS.map(c => (
        <button
          key={c.value}
          type="button"
          data-active={value === c.value}
          onClick={() => onChange(c.value)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all duration-150 ${c.color}`}
        >
          {c.icon}
          {c.label}
          {c.value === "pessimista" && <span className="text-[9px] opacity-70">CDI −2%</span>}
          {c.value === "otimista"   && <span className="text-[9px] opacity-70">CDI +2%</span>}
        </button>
      ))}
    </div>
  );
}

// Removido InfeasibilityAlert, movido para o backend ou removido do design

export function TabelaMesAMes({ showFinancials = true, showCompletedToggle = true }: { showFinancials?: boolean, showCompletedToggle?: boolean }) {
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
      <div className="mb-3 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-xl font-light">Tabela mês a mês</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Clique no mês para marcá-lo como concluído. Clique em Extras para detalhar lançamentos. Aporte é editável.</p>
        </div>
        <CenarioSelector value={cenarioSimulacao} onChange={setCenarioSimulacao} />
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
                </>
              )}
              <Th></Th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-border/40">
            {displayRows.map(r => {
              const defaultAporte = r.mes === 0 ? 0 : aporteTotal;
              const isConcluido = mesesConcluidosSet.has(r.mes);
              const totalExtras = r.aportesExtras;
              const totalAporteMes = r.aporteRegular + totalExtras;

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
                          <DisplayAporte
                            value={currentValue}
                            planned={defaultPessoaAporte}
                            isEdited={isEdited}
                          />
                        )}
                      </Td>
                    );
                  })}

                  <Td right>
                    {(() => {
                      const ctxItems: ContextExtra[] = aportesExtras
                        .map((a, idx) => ({ a, idx }))
                        .filter(({ a }) => {
                          const mesOffset = mesDaSimulacaoParaData(a.data, inicio);
                          return mesOffset === r.mes;
                        })
                        .map(({ a, idx }) => ({ origem: a.origem, valor: Number(a.valor), pessoaNome: a.pessoaNome, index: idx }));

                      const extrasTotal = ctxItems.reduce((sum, item) => sum + item.valor, 0);

                      return (
                        <ExtrasCell
                          contextItems={ctxItems}
                          total={extrasTotal}
                          onEditExtra={(index, origem, valor) => {
                            setAportesExtras(prev => {
                              const copy = [...prev];
                              copy[index] = { ...copy[index], origem, valor };
                              saveDraft({ aportesExtras: copy });
                              return copy;
                            });
                          }}
                          onDeleteExtra={(index) => {
                            setAportesExtras(prev => {
                              const copy = prev.filter((_, i) => i !== index);
                              saveDraft({ aportesExtras: copy });
                              return copy;
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

                      <Td right className="text-[#3B6D11] dark:text-[#80B551] font-medium">
                        {r.rendimentoLiquido > 0 ? `+${brl(r.rendimentoLiquido)}` : brl(r.rendimentoLiquido)}
                      </Td>

                      <Td right className="font-bold text-sm text-foreground">{brl(r.saldoAcumulado)}</Td>
                    </>
                  )}
                  
                  {/* Actions Column */}
                  <Td right className="group">
                    {r.mes > 0 && (
                      <RowActions
                        mes={r.mes}
                        dataStr={r.data}
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
                  <Td right className="bg-primary/20 py-2">
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-bold text-foreground text-[13px]">{brl(totals.saldoFinal)}</span>
                      <span className="text-[10px] text-foreground/70 font-medium px-1.5 py-0.5 rounded-sm bg-foreground/5" title="Total Aportes + Rendimento no período">
                        +{brl(totals.totalMes + totals.rendLiquido)} período
                      </span>
                    </div>
                  </Td>
                </>
              )}
              <Td className="bg-primary/20"></Td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}