"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { navPorCenario } from "@/components/AppShell";
import { usePlanLogic } from "@/hooks/usePlanLogic";
import { brl, rendimentoEstimadoDiario, type Aporte } from "@/lib/finance";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { MoneyInput } from "@/components/MoneyInput";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { usePlanStore } from "@/store/usePlanStore";
import { ArrowRight, Plus, Trash2, X, AlertCircle, Pencil, Wallet, TrendingUp, Loader2, Sparkles } from "lucide-react";
import { TabelaMesAMes } from "@/components/TabelaMesAMes";
import { PlanejamentoPageSkeleton } from "@/components/Skeleton";
import { StatusAtualInvestimento } from "@/components/StatusAtualInvestimento";

const ORIGENS = ["FGTS", "13º Salário", "Bônus", "Hora Extra", "Férias", "Freelance", "Restituição IR", "PLR", "Venda de bem", "Herança", "Presente", "Outro"];

const formatarDataAporte = (dataIso?: string) => {
  if (!dataIso) return "Data não informada";
  try {
    const raw = dataIso.split("T")[0];
    const parts = raw.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return new Date(dataIso + "T12:00:00").toLocaleDateString("pt-BR");
  } catch {
    return dataIso;
  }
};

export default function PlanejamentoPage() {
  const { cenario, objetivo, pessoas, aportesExtras, setAportesExtras, salvarPlano, calcularBackend, backendData, calculating, isDraftLoading, progressoAtual, progressoAtualPorPessoa } = usePlanLogic();
  const router = useRouter();
  const pathname = usePathname();
  const nav = navPorCenario[cenario] ?? navPorCenario.entrada;
  const currentStep = nav.findIndex(n => pathname?.startsWith(n.to)) + 1;
  const totalSteps = nav.length;

  const isLoading = isDraftLoading;
  const [isEditingTotal, setIsEditingTotal] = useState(false);

  const prosseguir = async () => {
    const savedId = await salvarPlano();
    if (savedId) {
      if (!savedId.startsWith("local-draft")) {
        calcularBackend(savedId).catch(console.error);
      }
      router.push("/app/resultado");
    } else {
      toast.error("Erro ao salvar os dados. Tente novamente.");
    }
  };
  
  const [isAportesExtrasModalOpen, setIsAportesExtrasModalOpen] = useState(false);
  const [editingAporteIndex, setEditingAporteIndex] = useState<number | null>(null);
  const [salvandoAporte, setSalvandoAporte] = useState(false);
  const [extraParaExcluir, setExtraParaExcluir] = useState<{ index: number; aporte: Aporte } | null>(null);
  const [excluindoAporte, setExcluindoAporte] = useState(false);
  
  const [novoAporte, setNovoAporte] = useState({
    data: new Date().toISOString().slice(0, 10),
    valor: "" as number | "",
    origem: "13º Salário",
    origemCustom: "",
    pessoa_id: "",
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (extraParaExcluir && !excluindoAporte) {
          setExtraParaExcluir(null);
        } else if (isAportesExtrasModalOpen && !salvandoAporte) {
          setIsAportesExtrasModalOpen(false);
          setEditingAporteIndex(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [extraParaExcluir, excluindoAporte, isAportesExtrasModalOpen, salvandoAporte]);

  const aporteTotal = pessoas.reduce((s, p) => s + Number(p.aporte_mensal ?? 0), 0);
  const totalGuardado = progressoAtual;

  const meta = objetivo?.valorImovel
    ? Number(objetivo.valorImovel) * (Number(objetivo.percentualEntrada ?? 0) + Number(objetivo.percentualCustosExtras ?? 0)) / 100
    : 0;

  const prazoMeses = objetivo?.prazoMaxMeses ?? 36;
  // Usa os dados do backend se disponíveis, senão não exibe estimativa
  const mesesEstimados = backendData?.mesesParaAtingir ?? null;
  const atingiuMeta = backendData?.atingiuMeta ?? false;
  const foraDoPrazo = mesesEstimados !== null && prazoMeses > 0 && mesesEstimados > prazoMeses;

  // Calcula aporte necessário para atingir a meta no prazo (sem considerar juros para simplificar)
  const faltaParaMeta = meta - totalGuardado;
  const aporteNecessario = faltaParaMeta > 0 && prazoMeses > 0 ? faltaParaMeta / prazoMeses : 0;

  const progressoPercent = Math.min(100, meta > 0 ? (totalGuardado / meta) * 100 : 0);

  const taxaCdiAnual = Number(objetivo?.taxaCdiAnual ?? 10.5);
  const totalRendimentoDiario = pessoas.reduce((acc, p) => {
    const saldoP = progressoAtualPorPessoa[p.id] ?? Number(p.valorAtual ?? p.valorInicial ?? 0);
    return acc + rendimentoEstimadoDiario(saldoP, taxaCdiAnual, p.tipoInvestimento);
  }, 0);

  const abrirModalNovoAporte = () => {
    setEditingAporteIndex(null);
    setNovoAporte({
      data: new Date().toISOString().slice(0, 10),
      valor: "",
      origem: "13º Salário",
      origemCustom: "",
      pessoa_id: "",
    });
    setIsAportesExtrasModalOpen(true);
  };

  const adicionarAporte = async () => {
    const val = Number(novoAporte.valor);
    if (!val || val <= 0) {
      toast.error("Informe um valor maior que zero para o aporte.");
      return;
    }
    const pessoa = pessoas.find(p => p.id === novoAporte.pessoa_id);
    const origemFinal = novoAporte.origem === "Outro" && novoAporte.origemCustom.trim()
      ? novoAporte.origemCustom.trim()
      : novoAporte.origem;

    const aporte: Aporte = {
      data: novoAporte.data || new Date().toISOString().slice(0, 10),
      valor: val,
      origem: origemFinal,
      pessoaId: pessoa?.id,
      pessoaNome: pessoa ? pessoa.nome : undefined,
    };

    setSalvandoAporte(true);
    try {
      let updated: Aporte[];
      if (editingAporteIndex !== null) {
        updated = [...aportesExtras];
        updated[editingAporteIndex] = aporte;
      } else {
        updated = [...aportesExtras, aporte];
      }

      setAportesExtras(updated);
      usePlanStore.getState().hydrate({ aportesExtras: updated });
      const savedId = await salvarPlano({ aportesExtras: updated });
      const idToUse = savedId || usePlanStore.getState().planoId;
      if (idToUse) {
        await calcularBackend(idToUse, { aportesExtras: updated });
      }

      toast.success(editingAporteIndex !== null ? "Aporte extra atualizado com sucesso!" : "Aporte extra adicionado com sucesso!");
      setIsAportesExtrasModalOpen(false);
      setEditingAporteIndex(null);
    } catch (err) {
      console.error("Erro ao salvar aporte extra:", err);
      toast.error("Erro ao salvar aporte extra. Tente novamente.");
    } finally {
      setSalvandoAporte(false);
    }
  };

  const editarAporte = (index: number) => {
    const aporte = aportesExtras[index];
    if (!aporte) return;
    const isStandardOrigem = ORIGENS.includes(aporte.origem);
    setNovoAporte({
      data: aporte.data,
      valor: Number(aporte.valor),
      origem: isStandardOrigem ? aporte.origem : "Outro",
      origemCustom: isStandardOrigem ? "" : aporte.origem,
      pessoa_id: aporte.pessoaId ?? "",
    });
    setEditingAporteIndex(index);
    setIsAportesExtrasModalOpen(true);
  };

  const removerAporte = (index: number) => {
    const aporte = aportesExtras[index];
    if (!aporte) return;
    setExtraParaExcluir({ index, aporte });
  };

  const confirmarRemoverAporte = async () => {
    if (!extraParaExcluir) return;
    const indexToDelete = extraParaExcluir.index;
    setExcluindoAporte(true);
    try {
      const updated = aportesExtras.filter((_, i) => i !== indexToDelete);
      setAportesExtras(updated);
      usePlanStore.getState().hydrate({ aportesExtras: updated });
      const savedId = await salvarPlano({ aportesExtras: updated });
      const idToUse = savedId || usePlanStore.getState().planoId;
      if (idToUse) {
        await calcularBackend(idToUse, { aportesExtras: updated });
      }
      toast.success("Aporte extra excluído e planejamento recalculado!");
      setExtraParaExcluir(null);
    } catch (err) {
      console.error("Erro ao excluir aporte:", err);
      toast.error("Erro ao excluir aporte extra.");
    } finally {
      setExcluindoAporte(false);
    }
  };

  if (isLoading) {
    return <PlanejamentoPageSkeleton />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 lg:space-y-12">
      <div className="animate-fade-in-up" style={{ animationDelay: '0ms' }}>
        <p className="text-[10px] uppercase tracking-widest text-orange-500 font-semibold mb-2">Etapa {currentStep > 0 ? currentStep : 3} de {totalSteps}</p>
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl mb-3 tracking-tight text-foreground font-normal">Acelere seu plano</h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">Confira o resumo do seu tempo de preparo e adicione entradas extras para chegar lá mais rápido.</p>
      </div>

      {foraDoPrazo && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 sm:p-5 flex gap-2 sm:gap-3 text-destructive">
          <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <p className="font-semibold mb-1">Atenção ao seu prazo</p>
            <p>Mantendo o ritmo atual, a meta será atingida em {mesesEstimados} meses, acima do prazo escolhido ({prazoMeses} meses). Considere aumentar os aportes mensais ou adicionar aportes extras.</p>
          </div>
        </div>
      )}

      {/* Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <Card className={`relative overflow-hidden p-5 sm:p-6 flex flex-col justify-center items-center text-center rounded-2xl transition-all duration-300 hover:shadow-lg ${!atingiuMeta || foraDoPrazo ? 'bg-destructive/5 border-destructive/20 hover:border-destructive/40' : 'bg-success/5 border-success/20 hover:border-success/40'}`}>
          <div className={`absolute top-0 left-0 w-full h-1 opacity-40 ${!atingiuMeta || foraDoPrazo ? 'bg-destructive' : 'bg-success'}`} />
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tempo estimado</p>
          <div className="flex items-end gap-1">
            <p className={`font-display text-5xl sm:text-6xl lg:text-7xl num tracking-tight ${!atingiuMeta || foraDoPrazo ? 'text-destructive' : 'text-success'}`}>{mesesEstimados ? `${mesesEstimados}` : "—"}</p>
            {mesesEstimados && <span className="text-sm font-medium text-muted-foreground pb-2 sm:pb-3">meses</span>}
          </div>
          {mesesEstimados && (
            <div className="mt-4 pt-4 border-t border-border/40 w-full">
              {!atingiuMeta || foraDoPrazo ? (
                <>
                  <p className="text-xs uppercase tracking-wider text-destructive font-medium mb-2">{!atingiuMeta ? "Meta não atingível" : foraDoPrazo ? `Não atinge o prazo (${prazoMeses}m)` : ""}</p>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-medium">Atual:</span>
                    <span className="font-semibold text-foreground">{brl(aporteTotal)}/mês</span>
                  </div>
                  <div className="flex justify-between items-center text-xs mt-1.5">
                    <span className="text-muted-foreground font-medium">Necessário:</span>
                    <span className="font-medium text-destructive">{brl(aporteNecessario)}/mês</span>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs uppercase tracking-wider text-success font-medium mb-2">No prazo programado</p>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-medium">Aporte programado:</span>
                    <span className="font-semibold text-foreground">{brl(aporteTotal)}/mês</span>
                  </div>
                </>
              )}
            </div>
          )}
        </Card>

        <Card className="p-5 sm:p-6 border-border/40 rounded-2xl flex flex-col justify-center transition-all duration-300 hover:shadow-lg hover:border-border/60">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Progresso atual da meta</p>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" onClick={() => setIsEditingTotal(!isEditingTotal)} title="Atualizar valor guardado hoje">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="space-y-4">
            <div className={`flex ${isEditingTotal ? 'flex-col gap-3' : 'justify-between items-end'}`}>
              {isEditingTotal ? (
                <div className="w-full animate-fade-in space-y-3 bg-secondary/10 p-3 rounded-xl border border-border/40">
                  <p className="text-xs text-muted-foreground font-medium flex items-center justify-between">
                    <span>Atualize o saldo de cada participante</span>
                    <Button variant="ghost" size="sm" onClick={() => setIsEditingTotal(false)} className="h-6 px-2 text-xs">Concluir</Button>
                  </p>
                  <StatusAtualInvestimento />
                </div>
              ) : (
                <>
                  <span className="font-display text-3xl sm:text-4xl num leading-none tracking-tight text-foreground">{brl(totalGuardado)}</span>
                  <span className="text-[11px] sm:text-xs text-muted-foreground mb-1 font-medium whitespace-nowrap">de {brl(meta)}</span>
                </>
              )}
            </div>
            <div className="relative h-2.5 sm:h-3 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progressoPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground pt-0.5">
              {totalRendimentoDiario > 0 ? (
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                  <Sparkles className="h-3.5 w-3.5 shrink-0" />
                  <span>+{brl(totalRendimentoDiario)}/dia hoje</span>
                </span>
              ) : <span />}
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground text-right font-semibold">{progressoPercent.toFixed(1)}% alcançado</span>
            </div>
          </div>
        </Card>

        <Card className="p-5 sm:p-6 border-border/40 rounded-2xl flex flex-col justify-center transition-all duration-300 hover:shadow-lg hover:border-border/60">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Aporte mensal (Programado)</p>
          <p className="font-display text-4xl sm:text-5xl num mt-3 leading-none text-foreground font-semibold">{brl(aporteTotal)}</p>

          <div className="mt-6 space-y-2.5">
            {pessoas.map(p => {
              const nameInitial = p.nome.charAt(0).toUpperCase();
              return (
                <div key={p.id} className="flex justify-between items-center bg-secondary/30 p-2.5 rounded-xl border border-border/40 transition-colors hover:bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-full bg-accent/10 text-accent flex items-center justify-center text-[11px] font-medium shadow-sm">
                      {nameInitial}
                    </div>
                    <span className="text-sm font-medium text-foreground/90">{p.nome.split(" ")[0]}</span>
                  </div>
                  <span className="num font-semibold text-sm">{brl(Number(p.aporte_mensal || 0))}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Modal Aportes Extras */}
      {isAportesExtrasModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => !salvandoAporte && (setIsAportesExtrasModalOpen(false), setEditingAporteIndex(null))}
          role="dialog"
          aria-modal="true"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-2xl border border-border/70 bg-white dark:bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-card-foreground overflow-hidden"
          >
            {/* Linha decorativa de topo */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-accent" />

            {/* Header */}
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-border/40">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center shrink-0">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold text-foreground leading-tight">
                    {editingAporteIndex !== null ? "Editar Aporte Extra" : "Adicionar Aporte Extra"}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Recurso pontual para acelerar sua conquista.</p>
                </div>
              </div>
              <button 
                type="button"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
                onClick={() => { setIsAportesExtrasModalOpen(false); setEditingAporteIndex(null); }}
                title="Fechar (Esc)"
                disabled={salvandoAporte}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form Content */}
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Valor do aporte</Label>
                <MoneyInput
                  variant="money"
                  min={0}
                  value={novoAporte.valor}
                  onChange={(v) => setNovoAporte(prev => ({ ...prev, valor: v }))}
                  placeholder="R$ 0,00"
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-lg font-semibold text-foreground focus:ring-2 focus:ring-accent"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Data do recebimento / aporte</Label>
                <input
                  type="date"
                  value={novoAporte.data}
                  onChange={(e) => setNovoAporte(prev => ({ ...prev, data: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:ring-2 focus:ring-accent outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Origem do recurso</Label>
                <select
                  value={novoAporte.origem}
                  onChange={(e) => setNovoAporte(prev => ({ ...prev, origem: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:ring-2 focus:ring-accent outline-none"
                >
                  {ORIGENS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
                {novoAporte.origem === "Outro" && (
                  <Input
                    placeholder="Especifique a origem (ex: Restituição IR)"
                    value={novoAporte.origemCustom}
                    onChange={(e) => setNovoAporte(prev => ({ ...prev, origemCustom: e.target.value }))}
                    className="h-10 mt-2 rounded-xl text-sm"
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Quem contribuiu?</Label>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setNovoAporte(prev => ({ ...prev, pessoa_id: "" }))}
                    className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                      novoAporte.pessoa_id === ""
                        ? 'bg-primary text-primary-foreground shadow-xs ring-1 ring-primary'
                        : 'bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground border border-border/50'
                    }`}
                  >
                    Conjunto
                  </button>
                  {pessoas.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setNovoAporte(prev => ({ ...prev, pessoa_id: p.id }))}
                      className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                        novoAporte.pessoa_id === p.id
                          ? 'bg-primary text-primary-foreground shadow-xs ring-1 ring-primary'
                          : 'bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground border border-border/50'
                      }`}
                    >
                      {p.nome.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center gap-3 pt-3 border-t border-border/40">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1 h-11 rounded-xl font-medium border-border/70 hover:bg-secondary/80" 
                onClick={() => { setIsAportesExtrasModalOpen(false); setEditingAporteIndex(null); }}
                disabled={salvandoAporte}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={adicionarAporte}
                disabled={salvandoAporte || !novoAporte.valor || Number(novoAporte.valor) <= 0}
                className="flex-1 h-11 rounded-xl bg-gradient-warm text-accent-foreground font-semibold hover:opacity-95 shadow-glow disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {salvandoAporte ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin-smooth" />
                    <span>Calculando...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>{editingAporteIndex !== null ? "Salvar alterações" : "Adicionar aporte"}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Aporte Extra */}
      {extraParaExcluir && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => !excluindoAporte && setExtraParaExcluir(null)}
          role="dialog"
          aria-modal="true"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-2xl border border-border/70 bg-white dark:bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-card-foreground overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-destructive" />
            <button
              type="button"
              onClick={() => !excluindoAporte && setExtraParaExcluir(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
              title="Fechar (Esc)"
              disabled={excluindoAporte}
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-start gap-4 pt-1">
              <div className="h-12 w-12 shrink-0 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center shadow-xs">
                <Trash2 className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0 pr-6">
                <h3 className="font-display text-xl font-semibold text-foreground tracking-tight">
                  Excluir aporte extra?
                </h3>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  Tem certeza que deseja excluir o aporte de <strong className="text-foreground font-semibold">{brl(Number(extraParaExcluir.aporte.valor))}</strong> ({extraParaExcluir.aporte.origem})?
                </p>
              </div>
            </div>
            <div className="mt-4 p-3 rounded-xl bg-destructive/5 border border-destructive/15 text-xs text-destructive/90 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-destructive" />
              <span className="leading-relaxed">
                O saldo acumulado e as projeções do planejamento serão recalculados automaticamente.
              </span>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1 h-11 rounded-xl font-medium border-border/70 hover:bg-secondary/80" 
                onClick={() => setExtraParaExcluir(null)} 
                disabled={excluindoAporte}
              >
                Cancelar
              </Button>
              <Button 
                type="button" 
                variant="destructive" 
                className="flex-1 h-11 rounded-xl font-medium shadow-sm hover:opacity-95 flex items-center justify-center gap-2" 
                onClick={confirmarRemoverAporte} 
                disabled={excluindoAporte}
              >
                {excluindoAporte ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin-smooth" />
                    <span>Recalculando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>Sim, excluir</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-6 sm:gap-8 pt-8 border-t border-border/30 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <div className="space-y-4">
          <Card className="p-0 overflow-hidden shadow-soft border-border/60 hover:border-accent/40 transition-all bg-white dark:bg-card rounded-2xl group">
            {/* Header do Card (estilo Meus Planos / PessoaCard) */}
            <div className="p-5 flex items-start justify-between gap-3 border-b border-border/40 bg-secondary/20">
              <div className="min-w-0">
                <div className="flex items-center gap-2">

                  <h2 className="font-display text-lg font-semibold text-foreground leading-tight">
                    Aportes extras
                  </h2>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Recursos eventuais para turbinar sua meta.
                </p>
              </div>
              <Button 
                size="sm" 
                onClick={abrirModalNovoAporte} 
                className="h-9 px-3 rounded-xl text-xs font-medium bg-gradient-warm text-accent-foreground hover:opacity-95 shadow-glow shrink-0 flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar
              </Button>
            </div>

            {aportesExtras.length === 0 ? (
              <div 
                onClick={abrirModalNovoAporte}
                className="p-8 text-center cursor-pointer hover:bg-secondary/10 transition-colors flex flex-col items-center justify-center group/empty"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 border border-accent/20 text-accent shadow-inner transition-transform group-hover/empty:scale-105 duration-300">
                  <Wallet className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Nenhum aporte extra cadastrado</h3>
                <p className="text-xs text-muted-foreground max-w-[240px] leading-relaxed">
                  Adicione 13º salário, bônus ou venda de bens para acelerar a entrega das chaves.
                </p>
                <span className="text-xs text-accent font-medium mt-3 inline-flex items-center gap-1 hover:underline">
                  + Lançar primeiro aporte
                </span>
              </div>
            ) : (
              <div className="p-4 space-y-2.5">
                {aportesExtras.map((a, index) => (
                  <div 
                    key={index} 
                    className="p-3.5 rounded-xl border border-border/50 bg-secondary/15 hover:bg-secondary/35 transition-all flex items-center justify-between gap-3 group/item"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center shrink-0">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-display text-base font-semibold text-foreground num leading-none">
                            +{brl(Number(a.valor))}
                          </span>
                          <span className="text-[10px] font-medium uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded-full shrink-0">
                            {a.origem}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5 truncate">
                          <span>{formatarDataAporte(a.data)}</span>
                          <span className="text-border">•</span>
                          <span className="font-medium text-foreground/80">{a.pessoaNome ?? "Conjunto"}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => editarAporte(index)} 
                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg"
                        title="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => removerAporte(index)} 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                        title="Excluir"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Resumo Total no rodapé */}
                <div className="pt-2.5 border-t border-border/40 flex items-center justify-between px-1 text-xs">
                  <span className="text-muted-foreground font-medium">Total em aportes extras</span>
                  <span className="font-display text-sm font-semibold text-accent num">
                    +{brl(aportesExtras.reduce((acc, a) => acc + Number(a.valor || 0), 0))}
                  </span>
                </div>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-3 sm:space-y-4 min-w-0">
          <TabelaMesAMes showFinancials={false} showCompletedToggle={false} showCenarioSelector={false} />
        </div>
      </div>

      {/* Botão Prosseguir */}
      <Card className="p-6 bg-gradient-ink text-primary-foreground shadow-elevated flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-8 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        <div>
          <p className="text-xs uppercase tracking-widest opacity-70">Plano concluído?</p>
          <p className="font-display text-2xl md:text-3xl mt-1">Veja o resultado</p>
          <p className="text-xs opacity-70 mt-1">Confira o resumo completo do seu planejamento para o imóvel.</p>
        </div>
        <Button
          onClick={prosseguir}
          disabled={calculating}
          className="bg-gradient-warm text-accent-foreground hover:opacity-90 w-full sm:w-auto h-11 px-5"
        >
          {calculating ? "Calculando..." : "Ver resultado"} <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Card>
    </div>
  );
}
