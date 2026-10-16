"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { 
  X, 
  Plus, 
  Trash2, 
  Check,
  CalendarDays
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
  onOpenDetalheDiario?: () => void;
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
  "Hora Extra",
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
  onDeleteExtra,
  onSaveAcumulado,
}: EditMesModalProps) {
  const [activeTab, setActiveTab] = useState<ModalTab>(mes === 0 ? "acumulado" : initialTab);

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

  // ─── ABA 2: EXTRAS ────────────────────────────────────────
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
        className="relative z-50 w-full max-w-[360px] flex flex-col rounded-2xl border border-border/70 bg-card text-card-foreground shadow-2xl overflow-hidden animate-modal-box font-sans"
      >
        {/* Header compacto */}
        <div className="px-4 py-3 border-b border-border/50 bg-secondary/20 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {mes === 0 ? "Início · Saldo Inicial Guardado" : `Mês ${mes}${dataFormatada ? ` · ${dataFormatada}` : ""}`}
            </h3>
            {atingiuMeta && (
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-success/15 text-success border border-success/30 shrink-0">
                Meta ✓
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {mes !== 0 && onOpenDetalheDiario && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDetalheDiario();
                }}
                className="px-2 py-1 rounded-lg text-xs font-semibold text-accent hover:bg-accent/10 transition-colors flex items-center gap-1 cursor-pointer"
                title="Ver evolução diária deste mês"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Dia a dia</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0 cursor-pointer"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Segmented Control / Tabs (apenas para meses normais) */}
        {mes !== 0 && (
          <div className="p-3 pb-0">
            <div className="flex p-1 bg-secondary/50 rounded-xl gap-1 text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveTab("aportes")}
                className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all ${
                  activeTab === "aportes"
                    ? "bg-card text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Aportes
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("extras")}
                className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 ${
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
              {showFinancials && (
                <button
                  type="button"
                  onClick={() => setActiveTab("acumulado")}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all ${
                    activeTab === "acumulado"
                      ? "bg-card text-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Acumulado
                </button>
              )}
            </div>
          </div>
        )}

        {/* Conteúdo do Modal */}
        <div className="p-4 space-y-3.5 max-h-[60vh] overflow-y-auto custom-scrollbar">

          {/* ═══════════ ABA 1: APORTES ═══════════ */}
          {activeTab === "aportes" && (
            <div className="space-y-3">
              {pessoas.map((p) => {
                const planejado = aportesPlanejados[p.id] || 0;
                const atual = draftAportes[p.id] !== undefined ? draftAportes[p.id] : planejado;
                const diff = atual - planejado;
                const isEdited = diff !== 0;

                return (
                  <div key={p.id} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-foreground">{p.nome}</span>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <span>Planejado: {brl(planejado)}</span>
                        {isEdited && (
                          <button
                            type="button"
                            onClick={() => setDraftAportes(prev => ({ ...prev, [p.id]: planejado }))}
                            className="text-[10px] text-muted-foreground hover:text-foreground underline decoration-dotted"
                            title="Restaurar valor planejado"
                          >
                            Restaurar
                          </button>
                        )}
                      </div>
                    </div>

                    <MoneyInput
                      variant="money"
                      min={0}
                      value={atual}
                      onChange={(v) => setDraftAportes(prev => ({ ...prev, [p.id]: v === "" ? 0 : Number(v) }))}
                      className="h-9 text-sm bg-background border-border"
                      autoFocus={focusPessoaId === p.id}
                    />

                    {isEdited && (
                      <div className={`text-[10px] font-semibold text-right ${
                        diff > 0 ? "text-success" : "text-destructive"
                      }`}>
                        {diff > 0 ? `▲ +${brl(diff)}` : `▼ -${brl(Math.abs(diff))}`}
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Total no mês:</span>
                <span className="font-semibold text-foreground num">{brl(totalAporteMesPrevisto)}</span>
              </div>
            </div>
          )}

          {/* ═══════════ ABA 2: EXTRAS ═══════════ */}
          {activeTab === "extras" && (
            <div className="space-y-3">
              {extrasDoMes.length > 0 && (
                <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar">
                  {extrasDoMes.map((extra) => (
                    <div
                      key={extra.index}
                      className="p-2 rounded-lg border border-border/60 bg-secondary/20 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <span className="font-medium text-foreground truncate block">{extra.origem}</span>
                        <span className="text-[10px] text-muted-foreground">{extra.pessoaNome || "Conjunto"}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`font-semibold ${extra.valor >= 0 ? "text-accent" : "text-muted-foreground"}`}>
                          {extra.valor >= 0 ? `+${brl(extra.valor)}` : `-${brl(Math.abs(extra.valor))}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => onDeleteExtra(extra.index)}
                          className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-3 rounded-xl border border-border/70 bg-card space-y-2.5">
                <p className="text-xs font-medium text-foreground">
                  Novo Aporte Extra
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">Quem</label>
                    <select
                      value={novoExtraPessoa}
                      onChange={(e) => setNovoExtraPessoa(e.target.value)}
                      className="w-full h-8 px-2 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                    >
                      <option value="conjunto">Conjunto</option>
                      {pessoas.map(p => (
                        <option key={p.id} value={p.id}>{p.nome.split(" ")[0]}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">Origem</label>
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
                        className="w-full h-8 px-2 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                      >
                        {ORIGENS_PREDEFINIDAS.map(origem => (
                          <option key={origem} value={origem}>{origem}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex gap-1">
                        <input
                          autoFocus
                          type="text"
                          value={novoExtraOrigemCustom}
                          onChange={(e) => setNovoExtraOrigemCustom(e.target.value)}
                          placeholder="Origem..."
                          className="w-full h-8 px-2 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                        />
                        <button
                          type="button"
                          onClick={() => { setNovoExtraOrigemMode("predefined"); setNovoExtraOrigemCustom(""); }}
                          className="h-8 px-1.5 text-xs border border-border rounded-lg bg-secondary text-muted-foreground hover:text-foreground shrink-0"
                          title="Voltar"
                        >
                          ←
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground">Valor</label>
                  <MoneyInput
                    variant="money"
                    min={0}
                    value={novoExtraValor}
                    onChange={(v) => setNovoExtraValor(v)}
                    className="h-8 text-xs bg-background border-border"
                    placeholder="R$ 0,00"
                  />
                </div>

                <button
                  type="button"
                  disabled={addingExtra || !novoExtraValor || Number(novoExtraValor) <= 0 || (novoExtraOrigemMode === "custom" && !novoExtraOrigemCustom.trim())}
                  onClick={handleAdicionarExtra}
                  className="w-full py-1.5 rounded-lg bg-accent text-accent-foreground font-semibold text-xs hover:bg-accent/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{addingExtra ? "Adicionando..." : "Adicionar Extra"}</span>
                </button>
              </div>
            </div>
          )}

          {/* ═══════════ ABA 3: ACUMULADO ═══════════ */}
          {activeTab === "acumulado" && (
            <div className="space-y-3">
              {mes === 0 && (
                <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/20 text-xs text-foreground/90 leading-relaxed">
                  Defina o valor que cada participante já tem guardado no início do planejamento. Toda a simulação e a evolução diária serão recalculadas a partir destes saldos.
                </div>
              )}
              {pessoas.map((p) => {
                const planejado = saldosAcumulados[p.id] || 0;
                const atual = draftAcumulado[p.id] !== undefined ? draftAcumulado[p.id] : planejado;
                const diff = atual - planejado;

                return (
                  <div key={p.id} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-foreground">{p.nome}</span>
                      <span className="text-muted-foreground">{mes === 0 ? "Atual:" : "Projetado:"} {brl(planejado)}</span>
                    </div>

                    <MoneyInput
                      variant="money"
                      min={0}
                      value={atual}
                      onChange={(v) => setDraftAcumulado(prev => ({ ...prev, [p.id]: v === "" ? 0 : Number(v) }))}
                      className="h-9 text-sm bg-background border-border"
                    />

                    {diff !== 0 && (
                      <div className={`text-[10px] font-semibold text-right ${
                        diff > 0 ? "text-success" : "text-destructive"
                      }`}>
                        {diff > 0 ? `▲ +${brl(diff)}` : `▼ -${brl(Math.abs(diff))}`}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border/50 bg-secondary/15 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-border/70 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            Cancelar
          </button>

          {activeTab === "aportes" && (
            <button
              type="button"
              disabled={savingAportes}
              onClick={handleSalvarAportes}
              className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{savingAportes ? "Salvando..." : "Salvar"}</span>
            </button>
          )}

          {activeTab === "acumulado" && (
            <button
              type="button"
              disabled={savingAcumulado}
              onClick={handleSalvarAcumulado}
              className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{savingAcumulado ? "Salvando..." : "Salvar"}</span>
            </button>
          )}

          {activeTab === "extras" && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs"
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
