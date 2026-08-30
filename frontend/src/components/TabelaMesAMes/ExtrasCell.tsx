"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Edit2, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { MoneyInput } from "@/components/MoneyInput";
import { brl } from "@/lib/finance";

export type ContextExtra = { origem: string; valor: number; pessoaNome?: string; index: number };

export function ExtrasCell({ contextItems, total, onEditExtra, onDeleteExtra }: {
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
