"use client";

import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Wallet, Sparkles, RefreshCw, Check } from "lucide-react";
import { usePlanLogic } from "@/hooks/usePlanLogic";
import { MoneyInput } from "@/components/MoneyInput";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { brl, rendimentoEstimadoMensal } from "@/lib/finance";

export interface AtualizarSaldoGuardadoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AtualizarSaldoGuardadoModal({
  isOpen,
  onClose,
}: AtualizarSaldoGuardadoModalProps) {
  if (!isOpen || typeof document === "undefined") return null;

  return <AtualizarSaldoGuardadoModalContent onClose={onClose} />;
}

function AtualizarSaldoGuardadoModalContent({
  onClose,
}: {
  onClose: () => void;
}) {
  const { pessoas, salvarPlano, calcularBackend, progressoAtualPorPessoa, objetivo } = usePlanLogic();
  const [salvando, setSalvando] = useState(false);

  // Mapeamento local dos saldos por pessoa inicializado sincronicamente ao montar o modal
  const [valores, setValores] = useState<Record<string, number | "">>(() => {
    const initialMap: Record<string, number | ""> = {};
    pessoas.forEach((p) => {
      const saldoP = progressoAtualPorPessoa[p.id] ?? Number(p.valorAtual ?? p.valorInicial ?? 0);
      initialMap[p.id] = saldoP;
    });
    return initialMap;
  });

  const taxaCdiAnual = Number(objetivo?.taxaCdiAnual ?? 10.5);

  const meta = useMemo(() => {
    if (!objetivo?.valorImovel) return 0;
    return Number(objetivo.valorImovel) * (Number(objetivo.percentualEntrada ?? 0) + Number(objetivo.percentualCustosExtras ?? 0)) / 100;
  }, [objetivo]);

  // Cálculos dinâmicos em tempo real conforme o usuário digita
  const { somaTotal, totalRendimentoMensal, progressoPercent } = useMemo(() => {
    let soma = 0;
    let rendimento = 0;
    pessoas.forEach((p) => {
      const val = typeof valores[p.id] === "number" ? (valores[p.id] as number) : 0;
      soma += val;
      rendimento += rendimentoEstimadoMensal(val, taxaCdiAnual, p.tipoInvestimento);
    });
    const perc = meta > 0 ? Math.min(100, (soma / meta) * 100) : 0;
    return { somaTotal: soma, totalRendimentoMensal: rendimento, progressoPercent: perc };
  }, [pessoas, valores, taxaCdiAnual, meta]);

  const handleMudarValor = (pessoaId: string, novoValor: number | "") => {
    setValores((prev) => ({
      ...prev,
      [pessoaId]: novoValor === "" ? "" : Math.max(0, novoValor),
    }));
  };

  const handleSalvar = async () => {
    setSalvando(true);
    try {
      const dataIso = new Date().toISOString();
      const updatedPeople = pessoas.map((p) => {
        const novoVal = typeof valores[p.id] === "number" ? (valores[p.id] as number) : 0;
        return {
          ...p,
          valorAtual: novoVal,
          valorInicial: novoVal,
          dataValorAtual: dataIso,
        };
      });

      const savedId = await salvarPlano({ pessoas: updatedPeople });
      if (savedId) {
        await calcularBackend(savedId);
        toast.success("Saldos atualizados com sucesso!");
        onClose();
      } else {
        toast.error("Erro ao salvar. Tente novamente.");
      }
    } catch (err) {
      console.error("[AtualizarSaldoGuardadoModal] Erro ao salvar:", err);
      toast.error("Não foi possível salvar os saldos.");
    } finally {
      setSalvando(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl border border-border/70 bg-card p-0 shadow-2xl animate-in zoom-in-95 duration-200 text-card-foreground overflow-hidden font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Linha decorativa de topo */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-accent via-accent/80 to-accent/40" />

        {/* Cabeçalho */}
        <div className="px-6 pt-6 pb-4 border-b border-border/50 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-accent/15 text-accent flex items-center justify-center shrink-0 border border-accent/25 shadow-xs">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-accent uppercase tracking-wider">
                Progresso atual da meta
              </p>
              <h2 className="text-lg sm:text-xl font-display font-extrabold text-foreground tracking-tight">
                Atualize o saldo de cada participante
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Defina o valor real já guardado hoje por cada um para sincronizar a projeção.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors cursor-pointer shrink-0"
            title="Fechar (X)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar flex-1">
          {/* Participantes */}
          <div className="space-y-3">
            {pessoas.map((pessoa) => {
              const valorPessoa = valores[pessoa.id] ?? "";
              const numVal = typeof valorPessoa === "number" ? valorPessoa : 0;
              const rendMensal = rendimentoEstimadoMensal(numVal, taxaCdiAnual, pessoa.tipoInvestimento);
              const nameInitial = pessoa.nome ? pessoa.nome.charAt(0).toUpperCase() : "?";

              return (
                <div
                  key={pessoa.id}
                  className="rounded-2xl border border-border/60 bg-secondary/15 p-4 transition-all hover:border-accent/40 hover:bg-secondary/25"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-accent/15 text-accent font-display font-bold text-sm flex items-center justify-center shrink-0 border border-accent/20">
                        {nameInitial}
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-foreground">
                          {pessoa.nome}
                        </h3>
                        {rendMensal > 0 ? (
                          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-success font-medium">
                            <Sparkles className="h-3 w-3 shrink-0" />
                            <span>+{brl(rendMensal)}/mês estimado</span>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground/60 mt-0.5">
                            Sem rendimento informado
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="w-full sm:w-48 shrink-0">
                      <label className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block mb-1">
                        Saldo guardado hoje
                      </label>
                      <MoneyInput
                        variant="money"
                        min={0}
                        value={valorPessoa}
                        onChange={(v) => handleMudarValor(pessoa.id, v)}
                        className="h-10 text-sm font-semibold w-full bg-card"
                        placeholder="R$ 0,00"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Card Resumo do Progresso */}
          <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-secondary/25 via-secondary/15 to-card p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Soma total guardada
                </p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="font-display text-2xl sm:text-3xl font-extrabold text-foreground num">
                    {brl(somaTotal)}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">
                    de {brl(meta)}
                  </span>
                </div>
              </div>

              {totalRendimentoMensal > 0 && (
                <div className="sm:text-right bg-card/60 sm:bg-transparent px-3 py-1.5 sm:p-0 rounded-xl border border-border/30 sm:border-0">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Rendimento Hoje
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-success">
                    <Sparkles className="h-3.5 w-3.5" />
                    +{brl(totalRendimentoMensal)}/mês
                  </span>
                </div>
              )}
            </div>

            {/* Barra de Progresso */}
            <div className="space-y-1.5 pt-1">
              <div className="relative h-2.5 w-full bg-secondary/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressoPercent}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] font-medium text-muted-foreground">
                <span>0%</span>
                <span className="font-bold text-accent uppercase tracking-wider text-[10px]">
                  {progressoPercent.toFixed(1)}% alcançado
                </span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé com Ações */}
        <div className="px-6 py-4 border-t border-border/50 bg-secondary/10 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={salvando}
            className="text-xs font-semibold h-9 px-4 rounded-xl cursor-pointer"
          >
            Cancelar
          </Button>

          <Button
            type="button"
            onClick={handleSalvar}
            disabled={salvando}
            className="text-xs font-semibold h-9 px-5 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 gap-1.5 cursor-pointer shadow-xs"
          >
            {salvando ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Salvar Alterações</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
