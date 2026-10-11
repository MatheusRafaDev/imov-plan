"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Edit2, Plus, TrendingUp, MoreHorizontal } from "lucide-react";
import { ModalTab } from "./EditMesModal";

export function RowActions({
  onOpenModal,
}: {
  onOpenModal: (tab: ModalTab) => void;
}) {
  const [openMenu, setOpenMenu] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [portalPos, setPortalPos] = useState({ top: 0, left: 0, width: 200 });

  const updatePos = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const width = 200;
      const left = rect.left - width - 8;
      const preferredLeft = left < 8 ? rect.right + 8 : left;
      const finalLeft = Math.max(8, Math.min(preferredLeft, window.innerWidth - width - 8));
      const top = Math.max(8, Math.min(rect.top, window.innerHeight - 150));
      setPortalPos({ top, left: finalLeft, width });
    }
  };

  useEffect(() => {
    if (openMenu) updatePos();
  }, [openMenu]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current && triggerRef.current.contains(target)) return;
      if (menuRef.current && !menuRef.current.contains(target)) setOpenMenu(false);
    };
    if (openMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [openMenu]);

  return (
    <span ref={triggerRef} className="relative inline-flex items-center justify-center">
      <button
        type="button"
        onClick={() => setOpenMenu(o => !o)}
        className={`w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors ${
          openMenu ? "opacity-100 bg-secondary text-foreground" : "opacity-40 hover:opacity-100 focus:opacity-100"
        }`}
        title="Opções do mês"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {openMenu && typeof document !== "undefined" && createPortal(
        <div 
          ref={menuRef} 
          className="fixed z-50 rounded-xl border border-border/70 bg-card shadow-xl overflow-hidden py-1 text-xs animate-popover font-sans" 
          style={{ top: `${portalPos.top}px`, left: `${portalPos.left}px`, width: `${portalPos.width}px` }}
        >
          <button 
            type="button"
            onClick={() => { setOpenMenu(false); onOpenModal("aportes"); }} 
            className="w-full text-left px-3.5 py-2.5 text-foreground hover:bg-secondary/70 flex items-center gap-2.5 transition-colors"
          >
            <Edit2 className="h-3.5 w-3.5 text-primary" /> 
            <span>Editar Aportes</span>
          </button>

          <button 
            type="button"
            onClick={() => { setOpenMenu(false); onOpenModal("extras"); }} 
            className="w-full text-left px-3.5 py-2.5 text-foreground hover:bg-secondary/70 flex items-center gap-2.5 transition-colors"
          >
            <Plus className="h-3.5 w-3.5 text-accent" /> 
            <span>Aportes Extras</span>
          </button>

          <button 
            type="button"
            onClick={() => { setOpenMenu(false); onOpenModal("acumulado"); }} 
            className="w-full text-left px-3.5 py-2.5 text-foreground hover:bg-secondary/70 flex items-center gap-2.5 transition-colors"
          >
            <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" /> 
            <span>Ajustar Acumulado</span>
          </button>
        </div>,
        document.body
      )}
    </span>
  );
}
