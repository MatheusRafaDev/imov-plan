"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  X, 
  Users, 
  Sparkles, 
  TrendingUp, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Calendar, 
  Check, 
  Info,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { MoneyInput } from "@/components/MoneyInput";
import { brl } from "@/lib/finance";

export type ModalTab = "aportes" | "extras" | "acumulado";

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
  extrasDoMes: { index: number; origem: string; valor: number; pessoaId?: string; pessoaNome?: string }[];
  initialTab?: ModalTab;
  focusPessoaId?: string | null;
  showFinancials?: boolean;
  onSaveAportes: (novosValores: Record<string, number>) => Promise<void> | void;
  onAddExtra: (pessoaId: string | null, origem: string, valor: number) => Promise<void> | void;
  onEditExtra: (index: number, origem: string, valor: number, pessoaId?: string) => Promise<void> | void;
  onDeleteExtra: (index: number) => Promise<void> | void;
  onSaveAcumulado: (novosSaldos: Record<string, number>) => Promise<void> | void;
}

const ORIGENS_PREDEFINIDAS = [
  "13º Salário",
  "Férias",
  "Bônus",
  "PLR",
  "Renda Extra",
  "Venda de Bem",
  "Restituição IR",
  "Outro..."
];

export function EditMesModal({
  isOpen,
  onClose,
  mes,
  data,
  atingiuMeta,
  isMesConcluido,
  pessoas,
  aportesPlanejados,
  aportesReais,
  saldosAcumulados,
  saldoAcumuladoTotal,
  rendimentoLiquido,
  extrasDoMes,
  initialTab = "aportes",
  focusPessoaId,
  showFinancials = true,
  onSaveAportes,
  onAddExtra,
  onDeleteExtra,
  onSaveAcumulado,
}: EditMesModalProps) {
  const [activeTab, setActiveTab] = useState<ModalTab>(initialTab);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Format month label
  const dataFormatada = (() => {
    try {
      const d = new Date(data);
      const str = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
      return str.charAt(0).toUpperCase() + str.slice(1);
    } catch {
      return "";
    }
  })();

  // ─── ABA 1: APORTES REGULARES ──────────────────────────────
  const [draftAportes, setDraftAportes] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    pessoas.forEach(p => {
      initial[p.id] = aportesReais[p.id] !== undefined ? aportesReais[p.id] : (aportesPlanejados[p.id] || 0);
    });
    return initial;
  });
  const [savingAportes, setSavingAportes] = useState(false);

  const totalAportesDraft = pessoas.reduce((sum, p) => sum + (draftAportes[p.id] || 0), 0);
  const totalExtrasAtual = extrasDoMes.reduce((sum, e) => sum + (e.valor || 0), 0);
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

  // ─── ABA 2: APORTES EXTRAS ─────────────────────────────────
  const [novoExtraPessoa, setNovoExtraPessoa] = useState<string>("conjunto");
  const [novoExtraOrigemMode, setNovoExtraOrigemMode] = useState<"predefined" | "custom">("predefined");
  const [novoExtraOrigemPredefined, setNovoExtraOrigemPredefined] = useState<string>("13º Salário");
  const [novoExtraOrigemCustom, setNovoExtraOrigemCustom] = useState<string>("");
  const [novoExtraValor, setNovoExtraValor] = useState<number | "">("");
  const [addingExtra, setAddingExtra] = useState(false);

  const handleAdicionarExtra = async () => {
    const valorNum = Number(novoExtraValor) || 0;
    if (valorNum <= 0) return;

    const origemFinal = novoExtraOrigemMode === "predefined" 
      ? novoExtraOrigemPredefined 
      : novoExtraOrigemCustom.trim() || "Aporte Extra";

    const pessoaIdFinal = novoExtraPessoa === "conjunto" ? null : novoExtraPessoa;

    setAddingExtra(true);
    try {
      await onAddExtra(pessoaIdFinal, origemFinal, valorNum);
      setNovoExtraValor("");
      setNovoExtraOrigemCustom("");
      setNovoExtraOrigemMode("predefined");
    } finally {
      setAddingExtra(false);
    }
  };

  // ─── ABA 3: AJUSTE DE ACUMULADO ─────────────────────────────
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="fixed inset-0 -z-10" 
        onClick={onClose} 
        aria-hidden="true" 
      />

      <div 
        role="dialog"
        aria-modal="true"
        className="relative z-50 w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl border border-border/70 bg-card text-card-foreground shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 font-sans"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-border/50 bg-secondary/30 flex items-start justify-between gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Calendar className="w-4 h-4" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                Mês {mes} · {dataFormatada}
              </h2>
              {atingiuMeta && (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-success/15 text-success border border-success/30">
                  Meta ✓
                </span>
              )}
              {isMesConcluido && (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  Concluído
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Personalize aportes individuais, lance rendas extras ou calibre o saldo da conta neste mês.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Fechar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-border/50 bg-card px-3 pt-2 gap-1 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("aportes")}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 -mb-[1px] whitespace-nowrap ${
              activeTab === "aportes"
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/40"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Aportes do Mês</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("extras")}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 -mb-[1px] whitespace-nowrap ${
              activeTab === "extras"
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/40"
            }`}
          >
            <Sparkles className="w-4 h-4 text-accent" />
            <span>Aportes Extras</span>
            {extrasDoMes.length > 0 && (
              <span className="text-[10px] bg-accent/15 text-accent px-1.5 py-0.2 rounded-full font-bold">
                {extrasDoMes.length}
              </span>
            )}
          </button>

          {showFinancials && (
            <button
              type="button"
              onClick={() => setActiveTab("acumulado")}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-t-lg transition-all border-b-2 -mb-[1px] whitespace-nowrap ${
                activeTab === "acumulado"
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/40"
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Ajustar Acumulado</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 custom-scrollbar">

          {/* ═══════════ ABA 1: APORTES MENSAIS ═══════════ */}
          {activeTab === "aportes" && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-secondary/30 border border-border/40 text-xs text-muted-foreground flex items-start gap-2.5">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>
                  Edite os valores aportados por cada participante no <strong>Mês {mes}</strong>. A alteração afeta apenas este mês específico sem mudar o valor base planejado para os meses seguintes.
                </span>
              </div>

              {/* Cards por pessoa */}
              <div className="space-y-3">
                {pessoas.map((p) => {
                  const planejado = aportesPlanejados[p.id] || 0;
                  const atual = draftAportes[p.id] !== undefined ? draftAportes[p.id] : planejado;
                  const diff = atual - planejado;
                  const diffPercent = planejado > 0 ? (diff / planejado) * 100 : 0;
                  const isFocused = focusPessoaId === p.id;

                  return (
                    <div 
                      key={p.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isFocused 
                          ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20" 
                          : "border-border/60 bg-card hover:border-border"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center font-bold text-xs text-foreground">
                            {p.nome.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-foreground">{p.nome}</span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              Planejado: <strong className="text-foreground/80">{brl(planejado)}</strong>
                            </span>
                          </div>
                        </div>

                        {diff !== 0 && (
                          <button
                            type="button"
                            onClick={() => setDraftAportes(prev => ({ ...prev, [p.id]: planejado }))}
                            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary px-2 py-1 rounded transition-colors"
                            title="Restaurar valor planejado no plano"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Restaurar ({brl(planejado)})</span>
                          </button>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                          Valor aportado no Mês {mes}
                        </label>
                        <MoneyInput
                          variant="money"
                          min={0}
                          value={atual}
                          onChange={(v) => setDraftAportes(prev => ({ ...prev, [p.id]: v === "" ? 0 : Number(v) }))}
                          className="h-10 text-base font-semibold bg-background border-border"
                        />

                        {/* Status da variação */}
                        <div className="flex items-center justify-between pt-1">
                          {diff === 0 ? (
                            <span className="text-xs text-muted-foreground/80 flex items-center gap-1">
                              <Check className="w-3.5 h-3.5 text-success" /> Valor igual ao planejado
                            </span>
                          ) : diff > 0 ? (
                            <span className="text-xs font-semibold text-success flex items-center gap-1 bg-success/10 px-2 py-0.5 rounded">
                              <ArrowUpRight className="w-3.5 h-3.5" /> +{brl(diff)} ({diffPercent > 0 ? `+${diffPercent.toFixed(1)}%` : ""}) acima do planejado
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-destructive flex items-center gap-1 bg-destructive/10 px-2 py-0.5 rounded">
                              <ArrowDownRight className="w-3.5 h-3.5" /> -{brl(Math.abs(diff))} ({diffPercent.toFixed(1)}%) abaixo do planejado
                            </span>
                          )}

                          <span className="text-xs text-muted-foreground font-mono">
                            {brl(atual)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Box de Resumo Total do Mês */}
              <div className="p-4 rounded-xl bg-secondary/40 border border-border/60 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Composição do Aporte no Mês {mes}
                </p>
                <div className="flex justify-between text-xs py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Soma dos aportes regulares:</span>
                  <span className="font-semibold text-foreground">{brl(totalAportesDraft)}</span>
                </div>
                {totalExtrasAtual > 0 && (
                  <div className="flex justify-between text-xs py-1 border-b border-border/40 text-accent">
                    <span>(+) Aportes Extras cadastrados:</span>
                    <span className="font-semibold">+{brl(totalExtrasAtual)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm pt-1 font-bold">
                  <span className="text-foreground">(=) Total Efetivo no Mês:</span>
                  <span className="text-primary text-base">{brl(totalAporteMesPrevisto)}</span>
                </div>
                {showFinancials && (
                  <div className="pt-2 text-[11px] text-muted-foreground flex justify-between">
                    <span>Rendimento líq. projetado: {brl(rendimentoLiquido)}</span>
                    <span>Acumulado final: {brl(saldoAcumuladoTotal)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════════ ABA 2: APORTES EXTRAS ═══════════ */}
          {activeTab === "extras" && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-secondary/30 border border-border/40 text-xs text-muted-foreground flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <span>
                  Lance receitas pontuais como 13º salário, bonificações, férias ou restituição de IR no <strong>Mês {mes}</strong> para acelerar sua meta.
                </span>
              </div>

              {/* Lista de Extras Cadastrados no Mês */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Extras cadastrados no Mês {mes} ({extrasDoMes.length})
                </p>

                {extrasDoMes.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground">
                    Nenhum aporte extra lançado para este mês ainda.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {extrasDoMes.map((extra) => (
                      <div 
                        key={extra.index}
                        className="p-3 rounded-xl border border-border/60 bg-card flex items-center justify-between gap-3 hover:border-border transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground truncate">{extra.origem}</span>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                              {extra.pessoaNome || "Conjunto"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-sm font-bold text-accent">
                            +{brl(extra.valor)}
                          </span>
                          <button
                            type="button"
                            onClick={() => onDeleteExtra(extra.index)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Remover aporte extra"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Formulário para Adicionar Novo Extra */}
              <div className="p-4 rounded-xl border border-accent/20 bg-accent/5 space-y-3">
                <p className="text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Novo Aporte Extra
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">Quem contribuiu?</label>
                    <select
                      value={novoExtraPessoa}
                      onChange={(e) => setNovoExtraPessoa(e.target.value)}
                      className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                    >
                      <option value="conjunto">Conjunto (Ambos)</option>
                      {pessoas.map(p => (
                        <option key={p.id} value={p.id}>{p.nome}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">Origem do valor</label>
                    {novoExtraOrigemMode === "predefined" ? (
                      <select
                        value={novoExtraOrigemPredefined}
                        onChange={(e) => {
                          if (e.target.value === "Outro...") {
                            setNovoExtraOrigemMode("custom");
                          } else {
                            setNovoExtraOrigemPredefined(e.target.value);
                          }
                        }}
                        className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                      >
                        {ORIGENS_PREDEFINIDAS.map(origem => (
                          <option key={origem} value={origem}>{origem}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex gap-1.5">
                        <input
                          autoFocus
                          type="text"
                          value={novoExtraOrigemCustom}
                          onChange={(e) => setNovoExtraOrigemCustom(e.target.value)}
                          placeholder="Digite a origem..."
                          className="w-full h-9 px-3 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                        />
                        <button
                          type="button"
                          onClick={() => { setNovoExtraOrigemMode("predefined"); setNovoExtraOrigemCustom(""); }}
                          className="h-9 px-2 text-xs border border-border rounded-xl bg-secondary text-muted-foreground hover:text-foreground shrink-0"
                          title="Voltar para opções comuns"
                        >
                          ←
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground">Valor do aporte extra</label>
                  <MoneyInput
                    variant="money"
                    min={0}
                    value={novoExtraValor}
                    onChange={(v) => setNovoExtraValor(v)}
                    className="h-10 text-base font-semibold bg-background border-border"
                    placeholder="R$ 0,00"
                  />
                </div>

                <button
                  type="button"
                  disabled={addingExtra || !novoExtraValor || Number(novoExtraValor) <= 0 || (novoExtraOrigemMode === "custom" && !novoExtraOrigemCustom.trim())}
                  onClick={handleAdicionarExtra}
                  className="w-full py-2.5 rounded-xl bg-accent text-accent-foreground font-semibold text-xs hover:bg-accent/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>{addingExtra ? "Adicionando..." : "Adicionar Aporte Extra"}</span>
                </button>
              </div>
            </div>
          )}

          {/* ═══════════ ABA 3: AJUSTAR ACUMULADO ═══════════ */}
          {activeTab === "acumulado" && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-secondary/30 border border-border/40 text-xs text-muted-foreground flex items-start gap-2.5">
                <TrendingUp className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>
                  Calibre o saldo acumulado caso a rentabilidade real na sua corretora ou banco difira da projeção. O sistema calculará automaticamente o ajuste necessário para alinhar a meta.
                </span>
              </div>

              <div className="space-y-3">
                {pessoas.map((p) => {
                  const planejado = saldosAcumulados[p.id] || 0;
                  const atual = draftAcumulado[p.id] !== undefined ? draftAcumulado[p.id] : planejado;
                  const diff = atual - planejado;

                  return (
                    <div key={p.id} className="p-4 rounded-xl border border-border/60 bg-card space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">{p.nome}</span>
                        <span className="text-xs text-muted-foreground">
                          Projetado: <strong className="text-foreground/80">{brl(planejado)}</strong>
                        </span>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                          Saldo Real Apurado na Conta
                        </label>
                        <MoneyInput
                          variant="money"
                          min={0}
                          value={atual}
                          onChange={(v) => setDraftAcumulado(prev => ({ ...prev, [p.id]: v === "" ? 0 : Number(v) }))}
                          className="h-10 text-base font-semibold bg-background border-border"
                        />
                      </div>

                      {diff !== 0 && (
                        <div className={`text-xs font-semibold flex items-center justify-between pt-1 px-2 py-1 rounded ${
                          diff > 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                        }`}>
                          <span>
                            {diff > 0 ? `▲ Ajuste positivo (rendimento extra / depósito):` : `▼ Ajuste negativo (correção / saque):`}
                          </span>
                          <span>
                            {diff > 0 ? `+${brl(diff)}` : brl(diff)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-border/50 bg-secondary/20 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border/70 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            Fechar
          </button>

          {activeTab === "aportes" && (
            <button
              type="button"
              disabled={savingAportes}
              onClick={handleSalvarAportes}
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm flex items-center gap-2"
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
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{savingAcumulado ? "Salvando..." : "Salvar Ajuste"}</span>
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
