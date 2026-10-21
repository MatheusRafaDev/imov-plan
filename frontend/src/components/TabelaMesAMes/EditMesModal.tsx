"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { 
  X, 
  Plus, 
  Trash2, 
  Check,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Pencil,
  Wallet
} from "lucide-react";
import { MoneyInput } from "@/components/MoneyInput";
import { brl } from "@/lib/finance";

export type ModalTab = "aportes" | "extras" | "acumulado";

export interface EditMesModalExtraItem {
  index: number;
  origem: string;
  valor: number;
  tipo?: "aporte" | "retirada";
  motivo?: string;
  data?: string;
  pessoaId?: string;
  pessoaNome?: string;
  revertido?: boolean;
  revertidoEm?: string;
}

export interface EditMesModalProps {
  isOpen: boolean;
  onClose: () => void;
  mes: number;
  data: string;
  atingiuMeta?: boolean;
  isMesConcluido?: boolean;
  pessoas: { id: string; nome: string; aporte_mensal?: number }[];
  aportesPlanejados: Record<string, number>;
  aportesReais: Record<string, number>;
  saldosAcumulados: Record<string, number>;
  saldoAcumuladoTotal: number;
  rendimentoLiquido: number;
  extrasDoMes: EditMesModalExtraItem[];
  initialTab?: ModalTab;
  focusPessoaId?: string | null;
  showFinancials?: boolean;
  onOpenDetalheDiario?: () => void;
  onSaveAportes: (novosValores: Record<string, number>) => Promise<void> | void;
  onAddExtra: (payload: {
    pessoaId: string | null;
    origem: string;
    valor: number;
    tipo: "aporte" | "retirada";
    motivo?: string;
    data?: string;
  }) => Promise<void> | void;
  onEditExtra?: (index: number, origem: string, valor: number, pessoaId?: string, tipo?: "aporte" | "retirada", data?: string) => Promise<void> | void;
  onDeleteExtra: (index: number) => Promise<void> | void;
  onRevertExtra?: (index: number) => Promise<void> | void;
  onSaveAcumulado: (novosSaldos: Record<string, number>) => Promise<void> | void;
}

const ORIGENS_PREDEFINIDAS = [
  "13º Salário",
  "FGTS",
  "Bônus",
  "Hora Extra",
  "Férias",
  "Freelance",
  "Restituição IR",
  "PLR",
  "Venda de bem",
  "Herança",
  "Presente",
  "Outro..."
];

const MOTIVOS_RETIRADA_PREDEFINIDOS = [
  "Emergência",
  "Reforma",
  "Outro Investimento",
  "Despesa Imprevista",
  "Outro..."
];

export function EditMesModal({
  isOpen,
  onClose,
  mes,
  data,
  atingiuMeta,
  pessoas,
  aportesPlanejados,
  aportesReais,
  saldosAcumulados,
  extrasDoMes,
  initialTab = "aportes",
  focusPessoaId,
  showFinancials = true,
  onOpenDetalheDiario,
  onSaveAportes,
  onAddExtra,
  onEditExtra,
  onDeleteExtra,
  onRevertExtra,
  onSaveAcumulado,
}: EditMesModalProps) {
  const [activeTab, setActiveTab] = useState<ModalTab>(mes === 0 ? (initialTab === "extras" ? "extras" : "acumulado") : initialTab);

  // Formatar data abreviada (ex: Jan/26)
  const dataFormatada = (() => {
    try {
      if (!data) return "";
      const d = new Date(data);
      if (isNaN(d.getTime())) return "";
      const str = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit", timeZone: "UTC" }).replace(" de ", "/");
      return str.charAt(0).toUpperCase() + str.slice(1);
    } catch {
      return "";
    }
  })();

  // ─── ABA 1: APORTES ───────────────────────────────────────
  const [draftAportes, setDraftAportes] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    pessoas.forEach(p => {
      initial[p.id] = aportesReais[p.id] !== undefined ? aportesReais[p.id] : (aportesPlanejados[p.id] || 0);
    });
    return initial;
  });
  const [savingAportes, setSavingAportes] = useState(false);

  const totalAportesDraft = pessoas.reduce((sum, p) => sum + (draftAportes[p.id] || 0), 0);
  const totalExtrasAtual = extrasDoMes
    .filter(e => !e.revertido)
    .reduce((sum, e) => {
      const isRet = String(e.tipo || "").toLowerCase() === "retirada";
      return sum + (isRet ? -Number(e.valor || 0) : Number(e.valor || 0));
    }, 0);
  const totalAporteMesPrevisto = totalAportesDraft + totalExtrasAtual;

  const handleSalvarAportes = async () => {
    setSavingAportes(true);
    try {
      await onSaveAportes(draftAportes);
      onClose();
    } finally {
      setSavingAportes(false);
    }
  };

  // ─── ABA 2: EXTRAS ────────────────────────────────────────
  const [editingExtraIndex, setEditingExtraIndex] = useState<number | null>(null);
  const [novoExtraTipo, setNovoExtraTipo] = useState<"aporte" | "retirada">("aporte");
  const [novoExtraPessoa, setNovoExtraPessoa] = useState<string>("conjunto");
  const [novoExtraOrigemMode, setNovoExtraOrigemMode] = useState<"predefined" | "custom">("predefined");
  const [novoExtraOrigemPredefined, setNovoExtraOrigemPredefined] = useState<string>("13º Salário");
  const [novoExtraMotivoPredefined, setNovoExtraMotivoPredefined] = useState<string>("Emergência");
  const [novoExtraOrigemCustom, setNovoExtraOrigemCustom] = useState<string>("");
  const [novoExtraValor, setNovoExtraValor] = useState<number | "">("");
  const [novoExtraDia, setNovoExtraDia] = useState<number>(() => {
    try {
      if (data) {
        const d = new Date(data);
        const day = d.getUTCDate();
        if (day === 1 || day === 5 || day === 20) return day;
      }
    } catch {}
    return 5;
  });
  const [addingExtra, setAddingExtra] = useState(false);

  const startEditExtra = (extra: EditMesModalExtraItem) => {
    setEditingExtraIndex(extra.index);
    const isRet = String(extra.tipo || "").toLowerCase() === "retirada";
    setNovoExtraTipo(isRet ? "retirada" : "aporte");
    setNovoExtraPessoa(extra.pessoaId || "conjunto");
    setNovoExtraValor(Number(extra.valor));

    const isPredefined = isRet
      ? MOTIVOS_RETIRADA_PREDEFINIDOS.includes(extra.motivo || extra.origem)
      : ORIGENS_PREDEFINIDAS.includes(extra.origem);

    if (isPredefined) {
      setNovoExtraOrigemMode("predefined");
      if (isRet) setNovoExtraMotivoPredefined(extra.motivo || extra.origem);
      else setNovoExtraOrigemPredefined(extra.origem);
      setNovoExtraOrigemCustom("");
    } else {
      setNovoExtraOrigemMode("custom");
      setNovoExtraOrigemCustom(extra.motivo || extra.origem);
    }

    if (extra.data) {
      const parts = extra.data.split("-");
      const day = parseInt(parts[2] || parts[0], 10);
      if (day === 1 || day === 5 || day === 20) setNovoExtraDia(day);
      else setNovoExtraDia(5);
    }
  };

  const cancelEditExtra = () => {
    setEditingExtraIndex(null);
    setNovoExtraValor("");
    setNovoExtraOrigemCustom("");
    setNovoExtraOrigemMode("predefined");
  };

  const handleAdicionarExtra = async () => {
    const valorNum = Number(novoExtraValor) || 0;
    if (valorNum <= 0) return;

    const dataReferenciaStr = data ? data.split("T")[0] : "";
    const parts = dataReferenciaStr.split("-");
    const anoMes = parts.length >= 2 ? `${parts[0]}-${parts[1]}` : "";
    const diaPad = String(novoExtraDia).padStart(2, "0");
    const dataFinal = anoMes ? `${anoMes}-${diaPad}` : undefined;

    const origemFinal = novoExtraTipo === "retirada"
      ? (novoExtraOrigemMode === "predefined" ? novoExtraMotivoPredefined : novoExtraOrigemCustom.trim() || "Retirada")
      : (novoExtraOrigemMode === "predefined" ? novoExtraOrigemPredefined : novoExtraOrigemCustom.trim() || "Aporte Extra");

    const pessoaIdFinal = novoExtraPessoa === "conjunto" ? null : novoExtraPessoa;

    setAddingExtra(true);
    try {
      if (editingExtraIndex !== null && onEditExtra) {
        await onEditExtra(
          editingExtraIndex,
          origemFinal,
          valorNum,
          pessoaIdFinal || undefined,
          novoExtraTipo,
          dataFinal
        );
        cancelEditExtra();
      } else {
        await onAddExtra({
          pessoaId: pessoaIdFinal,
          origem: origemFinal,
          motivo: novoExtraTipo === "retirada" ? origemFinal : undefined,
          valor: valorNum,
          tipo: novoExtraTipo,
          data: dataFinal,
        });
        setNovoExtraValor("");
        setNovoExtraOrigemCustom("");
        setNovoExtraOrigemMode("predefined");
      }
    } finally {
      setAddingExtra(false);
    }
  };

  // ─── ABA 3: ACUMULADO ─────────────────────────────────────
  const [draftAcumulado, setDraftAcumulado] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    pessoas.forEach(p => {
      initial[p.id] = saldosAcumulados[p.id] !== undefined ? saldosAcumulados[p.id] : 0;
    });
    return initial;
  });
  const [savingAcumulado, setSavingAcumulado] = useState(false);

  const handleSalvarAcumulado = async () => {
    setSavingAcumulado(true);
    try {
      await onSaveAcumulado(draftAcumulado);
      onClose();
    } finally {
      setSavingAcumulado(false);
    }
  };

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/60 backdrop-blur-[2px] animate-modal-backdrop">
      <div 
        className="fixed inset-0 -z-10" 
        aria-hidden="true" 
      />

      <div 
        role="dialog"
        aria-modal="true"
        className="relative z-50 w-full max-w-lg sm:max-w-xl max-h-[90dvh] flex flex-col rounded-2xl border border-border/70 bg-card text-card-foreground shadow-2xl overflow-hidden animate-modal-box font-sans"
      >
        {/* Header com título e ações */}
        <div className="px-5 py-4 border-b border-border/50 bg-secondary/20 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center shrink-0">
              <Wallet className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-semibold text-foreground truncate">
                {mes === 0 ? "Início · Saldo Inicial Guardado" : `Mês ${mes}${dataFormatada ? ` · ${dataFormatada}` : ""}`}
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                {mes === 0 ? "Defina o saldo guardado inicial de cada pessoa" : "Gerencie aportes, movimentações e saldo do mês"}
              </p>
            </div>
            {atingiuMeta && (
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-success/15 text-success border border-success/30 shrink-0">
                Meta ✓
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {mes !== 0 && onOpenDetalheDiario && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDetalheDiario();
                }}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-accent hover:bg-accent/10 border border-accent/20 transition-colors flex items-center gap-1 cursor-pointer"
                title="Ver evolução diária deste mês"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Dia a dia</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-colors shrink-0 cursor-pointer"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Segmented Control / Tabs */}
        <div className="px-5 pt-3.5 pb-0 shrink-0">
          <div className={`grid ${mes === 0 ? "grid-cols-2" : "grid-cols-3"} p-1 bg-secondary/50 rounded-xl gap-1 text-xs font-medium`}>
            {mes !== 0 && (
              <button
                type="button"
                onClick={() => setActiveTab("aportes")}
                className={`py-2 px-2 rounded-lg text-center transition-all cursor-pointer ${
                  activeTab === "aportes"
                    ? "bg-card text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Aportes
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveTab("extras")}
              className={`py-2 px-2 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "extras"
                  ? "bg-card text-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>Extras</span>
              {extrasDoMes.length > 0 && (
                <span className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.2 rounded-full font-semibold">
                  {extrasDoMes.length}
                </span>
              )}
            </button>
            {(showFinancials || mes === 0) && (
              <button
                type="button"
                onClick={() => setActiveTab("acumulado")}
                className={`py-2 px-2 rounded-lg text-center transition-all cursor-pointer ${
                  activeTab === "acumulado"
                    ? "bg-card text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {mes === 0 ? "Saldo Inicial" : "Acumulado"}
              </button>
            )}
          </div>
        </div>

        {/* Conteúdo do Modal - Corpo Rolável */}
        <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">

          {/* ═══════════ ABA 1: APORTES ═══════════ */}
          {activeTab === "aportes" && (
            <div className="space-y-3.5">
              {pessoas.map((p) => {
                const planejado = aportesPlanejados[p.id] || 0;
                const atual = draftAportes[p.id] !== undefined ? draftAportes[p.id] : planejado;
                const diff = atual - planejado;
                const isEdited = diff !== 0;

                return (
                  <div key={p.id} className="p-3.5 rounded-xl border border-border/60 bg-secondary/15 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-sm text-foreground">{p.nome}</span>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="bg-secondary/60 px-2 py-0.5 rounded-md border border-border/40">
                          Planejado: {brl(planejado)}
                        </span>
                        {isEdited && (
                          <button
                            type="button"
                            onClick={() => setDraftAportes(prev => ({ ...prev, [p.id]: planejado }))}
                            className="text-xs text-accent hover:underline font-medium cursor-pointer"
                            title="Restaurar valor planejado"
                          >
                            Restaurar
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="relative">
                      <MoneyInput
                        variant="money"
                        min={0}
                        value={atual}
                        onChange={(v) => setDraftAportes(prev => ({ ...prev, [p.id]: v === "" ? 0 : Number(v) }))}
                        className={`h-10 text-sm font-semibold rounded-xl ${
                          isEdited ? "border-accent/50 bg-accent/5 text-accent" : "bg-background"
                        }`}
                        autoFocus={focusPessoaId === p.id}
                      />
                    </div>

                    {isEdited && (
                      <div className={`text-xs font-semibold text-right ${
                        diff > 0 ? "text-success" : "text-destructive"
                      }`}>
                        {diff > 0 ? `▲ +${brl(diff)} em relação ao planejado` : `▼ -${brl(Math.abs(diff))} em relação ao planejado`}
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="p-3 rounded-xl bg-secondary/30 border border-border/50 flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Total de aportes no mês:</span>
                <span className="font-semibold text-foreground text-sm num">{brl(totalAporteMesPrevisto)}</span>
              </div>
            </div>
          )}

          {/* ═══════════ ABA 2: EXTRAS ═══════════ */}
          {activeTab === "extras" && (
            <div className="space-y-4">
              {extrasDoMes.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Movimentações do Mês ({extrasDoMes.length})
                  </span>
                  <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-0.5">
                    {extrasDoMes.map((extra) => {
                      const isRetirada = String(extra.tipo || "").toLowerCase() === "retirada";
                      const isRevertido = !!extra.revertido;
                      return (
                        <div
                          key={extra.index}
                          className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs transition-all ${
                            isRevertido
                              ? "opacity-50 bg-secondary/10 border-border/30 line-through"
                              : isRetirada
                                ? "border-destructive/30 bg-destructive/10"
                                : "border-success/30 bg-success/5"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                              isRetirada ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success"
                            }`}>
                              {isRetirada ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-foreground truncate">
                                  {extra.motivo || extra.origem}
                                </span>
                                {isRevertido && (
                                  <span className="text-[10px] uppercase px-1.5 py-0.5 bg-warning/20 text-warning font-semibold rounded not-italic">
                                    Revertido
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-muted-foreground block truncate mt-0.5">
                                {extra.pessoaNome || "Conjunto"}
                                {extra.data && ` • Dia ${extra.data.split("-")[2] || extra.data}`}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 not-italic border-t sm:border-t-0 pt-2 sm:pt-0 border-border/30">
                            <span className={`font-bold num text-sm ${
                              isRetirada ? "text-destructive" : "text-success"
                            }`}>
                              {isRetirada ? "-" : "+"}{brl(Number(extra.valor))}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => startEditExtra(extra)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                                title="Editar movimentação"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              {onRevertExtra && (
                                <button
                                  type="button"
                                  onClick={() => onRevertExtra(extra.index)}
                                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                                  title={isRevertido ? "Desfazer reversão" : "Reverter movimentação"}
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => onDeleteExtra(extra.index)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                                title="Excluir"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Formulário de Adicionar / Editar */}
              <div className="p-4 sm:p-5 rounded-2xl border border-border/70 bg-card space-y-4">
                {/* Cabeçalho do formulário */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {editingExtraIndex !== null ? (
                      <>
                        <Pencil className="w-4 h-4 text-accent" />
                        <span className="text-xs sm:text-sm font-semibold text-foreground">Editar Movimentação</span>
                      </>
                    ) : (
                      <span className="text-xs sm:text-sm font-semibold text-foreground">
                        Nova Movimentação no Mês
                      </span>
                    )}
                  </div>

                  {editingExtraIndex !== null && (
                    <button
                      type="button"
                      onClick={cancelEditExtra}
                      className="text-xs text-muted-foreground hover:text-foreground underline decoration-dotted cursor-pointer"
                    >
                      Cancelar edição
                    </button>
                  )}
                </div>

                {/* Seletor Tipo: Aporte Extra vs Retirada em 2 colunas amplas */}
                <div className="grid grid-cols-2 p-1 bg-secondary/50 rounded-xl border border-border/50 gap-1">
                  <button
                    type="button"
                    onClick={() => setNovoExtraTipo("aporte")}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      novoExtraTipo === "aporte"
                        ? "bg-success text-success-foreground shadow-xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                    <span>Aporte Extra</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNovoExtraTipo("retirada")}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      novoExtraTipo === "retirada"
                        ? "bg-destructive text-destructive-foreground shadow-xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <TrendingDown className="w-3.5 h-3.5 shrink-0" />
                    <span>Retirada</span>
                  </button>
                </div>

                {/* Titular */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    {novoExtraTipo === "retirada" ? "Titular da retirada" : "Participante"}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setNovoExtraPessoa("conjunto")}
                      className={`rounded-xl px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                        novoExtraPessoa === "conjunto"
                          ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                          : "bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground border border-border/50"
                      }`}
                    >
                      Conjunto
                    </button>
                    {pessoas.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setNovoExtraPessoa(p.id)}
                        className={`rounded-xl px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                          novoExtraPessoa === p.id
                            ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                            : "bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground border border-border/50"
                        }`}
                      >
                        {p.nome.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Origem / Motivo */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    {novoExtraTipo === "retirada" ? "Motivo da Retirada" : "Origem do Aporte"}
                  </label>
                  {novoExtraOrigemMode === "predefined" ? (
                    <select
                      value={novoExtraTipo === "retirada" ? novoExtraMotivoPredefined : novoExtraOrigemPredefined}
                      onChange={(e) => {
                        if (e.target.value === "Outro...") {
                          setNovoExtraOrigemMode("custom");
                        } else {
                          if (novoExtraTipo === "retirada") {
                            setNovoExtraMotivoPredefined(e.target.value);
                          } else {
                            setNovoExtraOrigemPredefined(e.target.value);
                          }
                        }
                      }}
                      className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                    >
                      {(novoExtraTipo === "retirada" ? MOTIVOS_RETIRADA_PREDEFINIDOS : ORIGENS_PREDEFINIDAS).map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        autoFocus
                        type="text"
                        value={novoExtraOrigemCustom}
                        onChange={(e) => setNovoExtraOrigemCustom(e.target.value)}
                        placeholder={novoExtraTipo === "retirada" ? "Motivo da retirada..." : "Origem do aporte..."}
                        className="flex-1 h-10 px-3 rounded-xl border border-border bg-background text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <button
                        type="button"
                        onClick={() => { setNovoExtraOrigemMode("predefined"); setNovoExtraOrigemCustom(""); }}
                        className="h-10 px-3 text-xs border border-border rounded-xl bg-secondary text-muted-foreground hover:text-foreground shrink-0 cursor-pointer transition-colors"
                        title="Voltar para opções pré-definidas"
                      >
                        ← Voltar
                      </button>
                    </div>
                  )}
                </div>

                {/* Grid: Dia do Mês e Valor */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Dia do Mês</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[1, 5, 20].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setNovoExtraDia(d)}
                          className={`h-10 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            novoExtraDia === d
                              ? "bg-accent text-accent-foreground shadow-2xs font-bold"
                              : "bg-secondary/40 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-secondary/70"
                          }`}
                        >
                          Dia {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Valor</label>
                    <MoneyInput
                      variant="money"
                      min={0}
                      value={novoExtraValor}
                      onChange={(v) => setNovoExtraValor(v)}
                      className="h-10 text-xs sm:text-sm bg-background border-border"
                      placeholder="R$ 0,00"
                    />
                  </div>
                </div>

                {/* Botão Salvar / Adicionar */}
                <button
                  type="button"
                  disabled={addingExtra || !novoExtraValor || Number(novoExtraValor) <= 0 || (novoExtraOrigemMode === "custom" && !novoExtraOrigemCustom.trim())}
                  onClick={handleAdicionarExtra}
                  className={`w-full h-11 rounded-xl font-semibold text-xs sm:text-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
                    novoExtraTipo === "retirada"
                      ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      : "bg-success text-success-foreground hover:bg-success/90"
                  }`}
                >
                  {novoExtraTipo === "retirada" ? <TrendingDown className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>
                    {addingExtra 
                      ? "Salvando..." 
                      : (editingExtraIndex !== null 
                          ? (novoExtraTipo === "retirada" ? "Salvar Alterações da Retirada" : "Salvar Alterações do Aporte")
                          : (novoExtraTipo === "retirada" ? "Confirmar Retirada" : "Adicionar Aporte Extra"))}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* ═══════════ ABA 3: ACUMULADO ═══════════ */}
          {activeTab === "acumulado" && (
            <div className="space-y-3.5">
              {mes === 0 && (
                <div className="p-3 rounded-xl bg-accent/10 border border-accent/20 text-xs text-foreground/90 leading-relaxed">
                  Defina o valor que cada participante já tem guardado no início do planejamento. Toda a simulação e a evolução diária serão recalculadas a partir destes saldos.
                </div>
              )}
              {pessoas.map((p) => {
                const planejado = saldosAcumulados[p.id] || 0;
                const atual = draftAcumulado[p.id] !== undefined ? draftAcumulado[p.id] : planejado;
                const diff = atual - planejado;

                return (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-xl border border-border/60 bg-secondary/15 hover:border-border transition-colors space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground text-sm">{p.nome}</span>
                      <span className="text-muted-foreground text-[11px]">
                        {mes === 0 ? "Saldo Inicial Atual:" : "Saldo Projetado:"}{" "}
                        <strong className="text-foreground num font-semibold">{brl(planejado)}</strong>
                      </span>
                    </div>

                    <MoneyInput
                      variant="money"
                      min={0}
                      value={atual}
                      onChange={(v) => setDraftAcumulado(prev => ({ ...prev, [p.id]: v === "" ? 0 : Number(v) }))}
                      className="h-10 text-sm bg-background border-border"
                    />

                    {diff !== 0 && (
                      <div className={`text-xs font-semibold text-right ${
                        diff > 0 ? "text-success" : "text-destructive"
                      }`}>
                        {diff > 0 ? `▲ +${brl(diff)} em relação ao planejado` : `▼ -${brl(Math.abs(diff))} em relação ao planejado`}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border/50 bg-secondary/15 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border/70 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          {activeTab === "aportes" && (
            <button
              type="button"
              disabled={savingAportes}
              onClick={handleSalvarAportes}
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{savingAportes ? "Salvando..." : "Salvar Aportes"}</span>
            </button>
          )}

          {activeTab === "acumulado" && (
            <button
              type="button"
              disabled={savingAcumulado}
              onClick={handleSalvarAcumulado}
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{savingAcumulado ? "Salvando..." : "Salvar Saldos"}</span>
            </button>
          )}

          {activeTab === "extras" && (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs cursor-pointer"
            >
              Concluir
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
