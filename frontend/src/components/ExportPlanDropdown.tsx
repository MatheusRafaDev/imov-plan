"use client";

import React, { useState, useRef, useEffect } from "react";
import { Download, FileSpreadsheet, FileText, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { exportPlanToExcel, exportPlanToCSV } from "@/utils/exportPlan";
import { usePlanLogic } from "@/hooks/usePlanLogic";
import type { BackendSimulacaoResult } from "@/types/simulacao";

export interface ExportPlanDropdownProps {
  objetivo?: any;
  pessoas?: Array<{ id: string; nome: string; renda?: number; aporteMensal?: number; valorInicial?: number }>;
  backendData?: BackendSimulacaoResult | null;
  cenario?: string;
  aportesExtras?: any[];
  showFinancials?: boolean;
  variant?: "default" | "outline" | "secondary";
  size?: "default" | "sm";
  className?: string;
  label?: string;
  align?: "left" | "right";
}

export function ExportPlanDropdown({
  objetivo: propObjetivo,
  pessoas: propPessoas,
  backendData: propBackendData,
  cenario: propCenario,
  aportesExtras: propAportesExtras,
  showFinancials = true,
  variant = "outline",
  size = "sm",
  className = "",
  label = "Exportar",
  align = "right",
}: ExportPlanDropdownProps) {
  const planLogic = usePlanLogic();

  const objetivo = propObjetivo ?? planLogic.objetivo;
  const pessoas = propPessoas ?? planLogic.pessoas;
  const backendData = propBackendData ?? planLogic.backendData;
  const cenario = propCenario ?? planLogic.cenario;
  const aportesExtras = propAportesExtras ?? planLogic.aportesExtras;

  const [isOpen, setIsOpen] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isOpen]);

  const hasData = Boolean(backendData?.detalhesMensais?.length);

  const handleDownloadExcel = async () => {
    if (!hasData) {
      toast.error("Nenhum dado de simulação disponível para exportar.");
      return;
    }

    setIsOpen(false);
    setIsExportingExcel(true);
    const toastId = toast.loading("Gerando planilha Excel (.xlsx)...");

    try {
      await exportPlanToExcel({
        objetivo,
        pessoas,
        backendData,
        cenario,
        aportesExtras,
        showFinancials,
      });
      toast.success("Planilha Excel (.xlsx) baixada com sucesso!", { id: toastId });
    } catch (err: any) {
      console.error("Erro ao exportar Excel:", err);
      toast.error(err?.message || "Erro ao gerar arquivo Excel.", { id: toastId });
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleDownloadCSV = () => {
    if (!hasData) {
      toast.error("Nenhum dado de simulação disponível para exportar.");
      return;
    }

    setIsOpen(false);
    setIsExportingCSV(true);
    const toastId = toast.loading("Gerando arquivo CSV...");

    try {
      exportPlanToCSV({
        objetivo,
        pessoas,
        backendData,
        cenario,
        aportesExtras,
        showFinancials,
      });
      toast.success("Arquivo CSV baixado com sucesso!", { id: toastId });
    } catch (err: any) {
      console.error("Erro ao exportar CSV:", err);
      toast.error(err?.message || "Erro ao gerar arquivo CSV.", { id: toastId });
    } finally {
      setIsExportingCSV(false);
    }
  };

  const isBusy = isExportingExcel || isExportingCSV;

  return (
    <div ref={containerRef} className="relative inline-flex text-left">
      <Button
        variant={variant}
        size={size}
        disabled={!hasData || isBusy}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`gap-1.5 cursor-pointer font-medium shadow-sm transition-all ${
          isOpen ? "ring-2 ring-accent/30 bg-secondary/50" : ""
        } ${className}`}
        title="Baixar planilha ou relatório de dados"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {isBusy ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
        ) : (
          <Download className="w-3.5 h-3.5 text-accent" />
        )}
        <span>{isExportingExcel ? "Gerando Excel..." : isExportingCSV ? "Gerando CSV..." : label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </Button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className={`absolute top-full mt-1.5 z-50 w-72 sm:w-80 rounded-xl border border-border/80 bg-popover/95 backdrop-blur-md p-1.5 text-popover-foreground shadow-xl animate-in fade-in-0 zoom-in-95 ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <div className="px-2.5 py-1.5 mb-1 border-b border-border/50">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Formato do Documento
            </p>
          </div>

          {/* Opção Excel (Recomendada) */}
          <button
            type="button"
            role="menuitem"
            onClick={handleDownloadExcel}
            className="w-full flex items-start gap-3 rounded-lg p-2.5 text-left text-sm hover:bg-secondary/70 transition-colors group cursor-pointer"
          >
            <div className="mt-0.5 p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500/20 group-hover:scale-105 transition-all">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-foreground text-xs sm:text-sm">
                  Planilha Excel (.xlsx)
                </span>
                <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-accent">
                  Recomendado
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                Completa e formatada: resumo executivo, evolução mês a mês e divisão por participante.
              </p>
            </div>
          </button>

          {/* Opção CSV */}
          <button
            type="button"
            role="menuitem"
            onClick={handleDownloadCSV}
            className="w-full flex items-start gap-3 rounded-lg p-2.5 text-left text-sm hover:bg-secondary/70 transition-colors group cursor-pointer mt-1"
          >
            <div className="mt-0.5 p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-500/20 group-hover:scale-105 transition-all">
              <FileText className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-foreground text-xs sm:text-sm">
                Arquivo CSV (.csv)
              </span>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                Dados brutos separados por ponto e vírgula com suporte a acentuação UTF-8.
              </p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

