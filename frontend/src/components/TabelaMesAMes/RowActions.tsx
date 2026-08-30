"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Edit2, Plus, MoreHorizontal } from "lucide-react";
import { MoneyInput } from "@/components/MoneyInput";
import { brl } from "@/lib/finance";

export function RowActions({
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
