"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname } from "next/navigation";
import { navPorCenario } from "@/components/AppShell";
import { usePlanLogic } from "@/hooks/usePlanLogic";
import { brl, rendimentoEstimadoMensal, aporteNecessarioParaPrazo, type Aporte } from "@/lib/finance";
import { getBrasiliaToday } from "@/utils/dates";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { MoneyInput } from "@/components/MoneyInput";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { usePlanStore } from "@/store/usePlanStore";
import { ArrowRight, Plus, Trash2, X, AlertCircle, Pencil, Wallet, TrendingUp, TrendingDown, Loader2, Sparkles, RotateCcw } from "lucide-react";
import { TabelaMesAMes } from "@/components/TabelaMesAMes";
import { PlanejamentoPageSkeleton } from "@/components/Skeleton";
import { AtualizarSaldoGuardadoModal } from "@/components/AtualizarSaldoGuardadoModal";

const ORIGENS = ["FGTS", "13º Salário", "Bônus", "Hora Extra", "Férias", "Freelance", "Restituição IR", "PLR", "Venda de bem", "Herança", "Presente", "Outro"];
const MOTIVOS_RETIRADA = ["Emergência", "Reforma", "Outro Investimento", "Despesa Imprevista", "Outro"];

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

  // Se o store está sem aportes extras mas a última simulação calculada possui registros de aportes extras / retiradas,
  // restaura esses registros para que apareçam imediatamente na listagem de movimentações financeiras.
  useEffect(() => {
    if (!isDraftLoading && aportesExtras.length === 0 && backendData?.detalhesMensais) {
      const recovered: Aporte[] = [];
      backendData.detalhesMensais.forEach((r) => {
        if (r.aportesExtras && Math.abs(r.aportesExtras) > 0.001) {
          const dateStr = r.dataReferencia ? r.dataReferencia.split("T")[0] : getBrasiliaToday().dataStr;
          recovered.push({
            tipo: "aporte",
            data: dateStr,
            valor: Number(r.aportesExtras),
            origem: "Aporte Extra",
            pessoaNome: "Conjunto",
          });
        }
        if (r.retiradas && Math.abs(r.retiradas) > 0.001) {
          const dateStr = r.dataReferencia ? r.dataReferencia.split("T")[0] : getBrasiliaToday().dataStr;
          recovered.push({
            tipo: "retirada",
            data: dateStr,
            valor: Number(r.retiradas),
            origem: "Retirada",
            motivo: "Retirada",
            pessoaNome: "Conjunto",
          });
        }
      });
      if (recovered.length > 0) {
        setAportesExtras(recovered);
        usePlanStore.getState().hydrate({ aportesExtras: recovered });
        salvarPlano({ aportesExtras: recovered });
      }
    }
  }, [isDraftLoading, aportesExtras.length, backendData, setAportesExtras, salvarPlano]);
  
  const [isAportesExtrasModalOpen, setIsAportesExtrasModalOpen] = useState(false);
  const [editingAporteIndex, setEditingAporteIndex] = useState<number | null>(null);
  const [salvandoAporte, setSalvandoAporte] = useState(false);
  const [extraParaExcluir, setExtraParaExcluir] = useState<{ index: number; aporte: Aporte } | null>(null);
  const [excluindoAporte, setExcluindoAporte] = useState(false);
  
  const [novoAporte, setNovoAporte] = useState({
    tipo: "aporte" as "aporte" | "retirada",
    data: getBrasiliaToday().dataStr,
    valor: "" as number | "",
    origem: "13º Salário",
    origemCustom: "",
    motivo: "Emergência",
    motivoCustom: "",
    pessoa_id: "",
  });

  const aporteTotal = pessoas.reduce((s, p) => s + Number(p.aporte_mensal ?? 0), 0);
  const totalGuardado = progressoAtual;

  const meta = objetivo?.valorImovel
    ? Number(objetivo.valorImovel) * (Number(objetivo.percentualEntrada ?? 0) + Number(objetivo.percentualCustosExtras ?? 0)) / 100
    : 0;

  const prazoMeses = objetivo?.prazoMaxMeses ?? 36;
  const mesesEstimados = backendData?.mesesParaAtingir ?? null;
  const atingiuMeta = backendData?.atingiuMeta ?? false;
  const foraDoPrazo = mesesEstimados !== null && prazoMeses > 0 && mesesEstimados > prazoMeses;

  const taxaCdiAnual = Number(objetivo?.taxaCdiAnual ?? 10.5);

  // Cálculo detalhado da viabilidade
  const faltaParaMeta = Math.max(0, meta - totalGuardado);
  const aporteNecessarioLinear = faltaParaMeta > 0 && prazoMeses > 0 ? faltaParaMeta / prazoMeses : 0;
  const aporteNecessarioComJuros = (meta > 0 && prazoMeses > 0 && faltaParaMeta > 0)
    ? aporteNecessarioParaPrazo({
        valorImovel: Number(objetivo?.valorImovel) || 0,
        percentualEntrada: Number(objetivo?.percentualEntrada) || 0,
        percentualCustosExtras: Number(objetivo?.percentualCustosExtras) || 0,
        valorJaGuardado: totalGuardado,
        taxaCdiAnual: taxaCdiAnual,
        percentualCdi: Number(objetivo?.percentualCdi) || 100,
        tipoInvestimento: objetivo?.tipoInvestimento || "cdb_100",
        prazoMeses: prazoMeses,
        aportesExtras: aportesExtras,
        dataInicio: objetivo?.dataInicio ? new Date(objetivo.dataInicio) : new Date(),
      })
    : 0;

  const progressoPercent = Math.min(100, meta > 0 ? (totalGuardado / meta) * 100 : 0);

  const totalRendimentoMensal = pessoas.reduce((acc, p) => {
    const saldoP = progressoAtualPorPessoa[p.id] ?? Number(p.valorAtual ?? p.valorInicial ?? 0);
    return acc + rendimentoEstimadoMensal(saldoP, taxaCdiAnual, p.tipoInvestimento);
  }, 0);

  const calcularGastosPessoa = (p: typeof pessoas[number]) =>
    p.usar_gastos_detalhados
      ? (p.gastos_detalhados || []).reduce((acc, g) => acc + Number(g.valor || 0), 0)
      : Number(p.gastos_mensais || 0);

  const rendaTotalGeral = pessoas.reduce((s, p) => s + (Number(p.renda_mensal || 0) + Number(p.renda_complementar || 0)), 0);
  const gastosTotaisGeral = pessoas.reduce((s, p) => s + calcularGastosPessoa(p), 0);
  const sobraTotal = rendaTotalGeral - gastosTotaisGeral;

  const abrirModalNovoAporte = (tipo: "aporte" | "retirada" = "aporte") => {
    setEditingAporteIndex(null);
    setNovoAporte({
      tipo,
      data: getBrasiliaToday().dataStr,
      valor: "",
      origem: "13º Salário",
      origemCustom: "",
      motivo: "Emergência",
      motivoCustom: "",
      pessoa_id: "",
    });
    setIsAportesExtrasModalOpen(true);
  };

  const adicionarAporte = async () => {
    const val = Number(novoAporte.valor);
    if (!val || val <= 0) {
      toast.error("Informe um valor maior que zero.");
      return;
    }

    if (novoAporte.tipo === "retirada" && val > totalGuardado) {
      toast.error(`O valor da retirada (${brl(val)}) não pode ser superior ao saldo acumulado disponível (${brl(totalGuardado)}).`);
      return;
    }

    const pessoa = pessoas.find(p => p.id === novoAporte.pessoa_id);
    const origemFinal = novoAporte.tipo === "retirada"
      ? (novoAporte.motivo === "Outro" && novoAporte.motivoCustom.trim() ? novoAporte.motivoCustom.trim() : novoAporte.motivo)
      : (novoAporte.origem === "Outro" && novoAporte.origemCustom.trim() ? novoAporte.origemCustom.trim() : novoAporte.origem);

    const aporte: Aporte = {
      tipo: novoAporte.tipo,
      data: novoAporte.data || getBrasiliaToday().dataStr,
      valor: val,
      origem: origemFinal,
      motivo: novoAporte.tipo === "retirada" ? origemFinal : undefined,
      pessoaId: pessoa?.id,
      pessoaNome: pessoa ? pessoa.nome : undefined,
    };

    const prevAportes = [...aportesExtras];
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

      toast.success(editingAporteIndex !== null 
        ? (aporte.tipo === "retirada" ? "Retirada atualizada com sucesso!" : "Aporte extra atualizado com sucesso!") 
        : (aporte.tipo === "retirada" ? "Retirada registrada com sucesso!" : "Aporte extra adicionado com sucesso!"));
      setIsAportesExtrasModalOpen(false);
      setEditingAporteIndex(null);
    } catch (err) {
      console.error("Erro ao salvar movimentação:", err);
      setAportesExtras(prevAportes);
      usePlanStore.getState().hydrate({ aportesExtras: prevAportes });
      toast.error("Erro ao persistir movimentação no servidor. O estado foi restaurado.");
    } finally {
      setSalvandoAporte(false);
    }
  };

  const reverterMovimentacao = async (index: number) => {
    const item = aportesExtras[index];
    if (!item) return;
    const prevAportes = [...aportesExtras];
    const updated = [...aportesExtras];
    const hojeStr = getBrasiliaToday().dataStr;
    const estavaRevertido = !!item.revertido;
    
    updated[index] = {
      ...item,
      revertido: !estavaRevertido,
      revertidoEm: !estavaRevertido ? hojeStr : undefined,
    };

    setAportesExtras(updated);
    usePlanStore.getState().hydrate({ aportesExtras: updated });
    try {
      const savedId = await salvarPlano({ aportesExtras: updated });
      const idToUse = savedId || usePlanStore.getState().planoId;
      if (idToUse) {
        await calcularBackend(idToUse, { aportesExtras: updated });
      }
      toast.success(!estavaRevertido ? "Operação revertida com sucesso!" : "Reversão desfeita com sucesso!");
    } catch (err) {
      console.error("Erro ao reverter operação:", err);
      setAportesExtras(prevAportes);
      usePlanStore.getState().hydrate({ aportesExtras: prevAportes });
      toast.error("Erro ao persistir reversão no servidor. O estado anterior foi restaurado.");
    }
  };

  const editarAporte = (index: number) => {
    const aporte = aportesExtras[index];
    if (!aporte) return;
    const isRetirada = aporte.tipo === "retirada";
    const isStandardOrigem = ORIGENS.includes(aporte.origem);
    const isStandardMotivo = MOTIVOS_RETIRADA.includes(aporte.motivo || aporte.origem);
    setNovoAporte({
      tipo: isRetirada ? "retirada" : "aporte",
      data: aporte.data,
      valor: Number(aporte.valor),
      origem: isStandardOrigem ? aporte.origem : "Outro",
      origemCustom: isStandardOrigem ? "" : aporte.origem,
      motivo: isStandardMotivo ? (aporte.motivo || aporte.origem) : "Outro",
      motivoCustom: isStandardMotivo ? "" : (aporte.motivo || aporte.origem),
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
    const itemTipo = extraParaExcluir.aporte.tipo === "retirada" ? "Retirada" : "Aporte extra";
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
      toast.success(`${itemTipo} excluído e planejamento recalculado!`);
      setExtraParaExcluir(null);
    } catch (err) {
      console.error("Erro ao excluir movimentação:", err);
      toast.error(`Erro ao excluir ${itemTipo.toLowerCase()}.`);
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
          <div className="text-xs sm:text-sm space-y-1">
            <p className="font-semibold">Atenção: Aporte atual insuficiente para o prazo desejado</p>
            <p>
              Com o aporte atual de <strong>{brl(aporteTotal)}/mês</strong>, a meta de <strong>{brl(meta)}</strong> será alcançada em <strong>{mesesEstimados} meses</strong>, superando o prazo estipulado de <strong>{prazoMeses} meses</strong>.
            </p>
            <p className="text-xs opacity-90 pt-1">
              Para atingir a meta em {prazoMeses} meses considerando a projeção de rendimento CDI, o aporte estimado é de <strong>{brl(aporteNecessarioComJuros)}/mês</strong> (ou <strong>{brl(aporteNecessarioLinear)}/mês</strong> em acúmulo linear direto sem rendimentos).
            </p>
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
                  <p className="text-xs uppercase tracking-wider text-destructive font-medium mb-2">{!atingiuMeta ? "Meta não atingível no limite" : foraDoPrazo ? `Prazo excedido (${prazoMeses} meses estipulados)` : ""}</p>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-medium">Aporte atual:</span>
                      <span className="font-semibold text-foreground">{brl(aporteTotal)}/mês</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground font-medium">Aporte c/ juros (CDI):</span>
                      <span className="font-semibold text-destructive">{brl(aporteNecessarioComJuros)}/mês</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground/80">
                      <span>Estimativa linear sem juros:</span>
                      <span>{brl(aporteNecessarioLinear)}/mês</span>
                    </div>
                  </div>
                  <div className="mt-3 p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-[11px] text-destructive/90 space-y-1">
                    <p className="font-semibold">Alternativas viáveis:</p>
                    <p>• <strong>Aumentar aporte:</strong> Aportar {brl(aporteNecessarioComJuros)}/mês para manter o prazo de {prazoMeses} meses.</p>
                    <p>• <strong>Ampliar prazo:</strong> Estender o objetivo para {mesesEstimados ?? 60} meses mantendo {brl(aporteTotal)}/mês.</p>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs uppercase tracking-wider text-success font-medium mb-2">No prazo programado</p>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-medium">Aporte programado:</span>
                    <span className="font-semibold text-foreground">{brl(aporteTotal)}/mês</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    Projeção calculada com base na rentabilidade líquida do plano.
                  </p>
                </>
              )}
            </div>
          )}
        </Card>

        <Card className="min-w-0 p-5 sm:p-6 border-border/40 rounded-2xl flex flex-col justify-center transition-all duration-300 hover:shadow-lg hover:border-border/60">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Progresso atual da meta</p>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors cursor-pointer" 
              onClick={() => setIsEditingTotal(true)} 
              title="Atualizar saldo guardado hoje"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="space-y-4">
            <div className="flex min-w-0 flex-col items-start gap-1">
              <span className="max-w-full break-words font-display text-2xl sm:text-3xl num leading-tight tracking-tight text-foreground">{brl(totalGuardado)}</span>
              <span className="max-w-full break-words text-[11px] sm:text-xs text-muted-foreground font-medium">de {brl(meta)}</span>
            </div>
            <div className="relative h-2.5 sm:h-3 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progressoPercent}%` }}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] font-medium text-muted-foreground pt-0.5">
              {totalRendimentoMensal > 0 ? (
                <span className="flex items-center gap-1.5 text-success font-semibold text-xs">
                  <Sparkles className="h-3.5 w-3.5 shrink-0" />
                  <span>+{brl(totalRendimentoMensal)}/mês hoje</span>
                </span>
              ) : <span />}
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground text-right font-semibold">{progressoPercent.toFixed(1)}% alcançado</span>
            </div>
          </div>
        </Card>

        {/* Modal para atualizar o saldo guardado de cada participante com conforto e espaço */}
        <AtualizarSaldoGuardadoModal
          isOpen={isEditingTotal}
          onClose={() => setIsEditingTotal(false)}
        />

        <Card className="p-5 sm:p-6 border-border/40 rounded-2xl flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:border-border/60">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Capacidade & Aporte</p>
              <span className="text-[10px] text-muted-foreground font-medium">
                {sobraTotal > aporteTotal 
                  ? `Sobra livre: ${brl(sobraTotal - aporteTotal)}` 
                  : sobraTotal === aporteTotal 
                    ? "100% da sobra líquida" 
                    : "Aporte acima da sobra"}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 pt-0.5">
              <p className="font-display text-3xl sm:text-4xl num leading-none text-foreground font-semibold">{brl(aporteTotal)}</p>
              <span className="text-xs text-muted-foreground font-medium">/mês planejado</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
              <span>Renda: <strong className="text-foreground font-medium">{brl(rendaTotalGeral)}</strong></span>
              {gastosTotaisGeral > 0 && (
                <span>Despesas: <strong className="text-foreground font-medium">{brl(gastosTotaisGeral)}</strong></span>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/40 space-y-2">
            {pessoas.map(p => {
              const nameInitial = p.nome ? p.nome.charAt(0).toUpperCase() : "?";
              return (
                <div key={p.id} className="flex justify-between items-center bg-secondary/30 p-2 sm:p-2.5 rounded-xl border border-border/40 transition-colors hover:bg-secondary/50">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-6 w-6 rounded-full bg-accent/10 text-accent flex items-center justify-center text-[10px] font-bold shadow-xs shrink-0">
                      {nameInitial}
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-foreground/90 truncate">{p.nome.split(" ")[0]}</span>
                  </div>
                  <span className="num font-semibold text-xs sm:text-sm shrink-0">{brl(Number(p.aporte_mensal || 0))}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Modal Aportes Extras e Retiradas */}
      {isAportesExtrasModalOpen && typeof document !== "undefined" && createPortal(
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div 
            className="relative w-full max-w-lg max-h-[90dvh] flex flex-col rounded-2xl border border-border/70 bg-card shadow-2xl animate-in zoom-in-95 duration-200 text-card-foreground overflow-hidden font-sans"
          >
            {/* Linha decorativa de topo */}
            <div className={`absolute top-0 left-0 right-0 h-1 z-10 ${novoAporte.tipo === "retirada" ? "bg-destructive" : "bg-success"}`} />

            {/* Header fixo */}
            <div className="flex items-start justify-between gap-3 p-5 sm:p-6 pb-4 border-b border-border/40 shrink-0 bg-secondary/20">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 ${
                  novoAporte.tipo === "retirada"
                    ? "bg-destructive/10 border-destructive/20 text-destructive"
                    : "bg-success/10 border-success/20 text-success"
                }`}>
                  {novoAporte.tipo === "retirada" ? <TrendingDown className="h-5 w-5" /> : <Wallet className="h-5 w-5" />}
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold text-foreground leading-tight">
                    {editingAporteIndex !== null 
                      ? (novoAporte.tipo === "retirada" ? "Editar Retirada" : "Editar Aporte Extra") 
                      : (novoAporte.tipo === "retirada" ? "Registrar Retirada" : "Adicionar Aporte Extra")}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {novoAporte.tipo === "retirada" 
                      ? "Saque pontual de recursos com atualização do saldo." 
                      : "Recurso pontual para acelerar sua conquista."}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors cursor-pointer"
                onClick={() => { setIsAportesExtrasModalOpen(false); setEditingAporteIndex(null); }}
                title="Fechar"
                disabled={salvandoAporte}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Corpo rolável com scrollbar suave */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 custom-scrollbar flex-1">
              {/* Alternador de Tipo de Movimentação */}
              <div className="grid grid-cols-2 p-1 bg-secondary/50 rounded-xl border border-border/50">
                <button
                  type="button"
                  onClick={() => setNovoAporte(prev => ({ ...prev, tipo: "aporte" }))}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    novoAporte.tipo === "aporte" 
                      ? "bg-card text-success shadow-xs font-bold" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Plus className="h-3.5 w-3.5 text-success" />
                  <span>Aporte Extra (Entrada)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNovoAporte(prev => ({ ...prev, tipo: "retirada" }))}
                  className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    novoAporte.tipo === "retirada" 
                      ? "bg-card text-destructive shadow-xs font-bold" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                  <span>Retirada (Saída)</span>
                </button>
              </div>

              {novoAporte.tipo === "retirada" && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs flex justify-between items-center text-foreground">
                  <span className="text-muted-foreground">Saldo acumulado disponível:</span>
                  <span className="font-semibold num">{brl(totalGuardado)}</span>
                </div>
              )}

              {/* Grid de 2 colunas para Valor e Data */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">
                    {novoAporte.tipo === "retirada" ? "Valor da retirada" : "Valor do aporte"}
                  </Label>
                  <MoneyInput
                    variant="money"
                    min={0}
                    value={novoAporte.valor}
                    onChange={(v) => setNovoAporte(prev => ({ ...prev, valor: v }))}
                    placeholder="0,00"
                    className="h-11 w-full rounded-xl border border-border bg-background text-base font-semibold text-foreground focus:ring-2 focus:ring-accent"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">Data da movimentação</Label>
                  <input
                    type="date"
                    value={novoAporte.data}
                    onChange={(e) => setNovoAporte(prev => ({ ...prev, data: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:ring-2 focus:ring-accent outline-none"
                  />
                </div>
              </div>

              {/* Origem / Motivo */}
              {novoAporte.tipo === "retirada" ? (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">Motivo da retirada</Label>
                  <select
                    value={novoAporte.motivo}
                    onChange={(e) => setNovoAporte(prev => ({ ...prev, motivo: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:ring-2 focus:ring-accent outline-none cursor-pointer"
                  >
                    {MOTIVOS_RETIRADA.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  {novoAporte.motivo === "Outro" && (
                    <Input
                      placeholder="Especifique o motivo da retirada"
                      value={novoAporte.motivoCustom}
                      onChange={(e) => setNovoAporte(prev => ({ ...prev, motivoCustom: e.target.value }))}
                      className="h-10 mt-2 rounded-xl text-sm"
                    />
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">Origem do recurso</Label>
                  <select
                    value={novoAporte.origem}
                    onChange={(e) => setNovoAporte(prev => ({ ...prev, origem: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:ring-2 focus:ring-accent outline-none cursor-pointer"
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
              )}

              {/* Titular / Quem */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">
                  {novoAporte.tipo === "retirada" ? "Titular da retirada" : "Quem contribuiu?"}
                </Label>
                <div className="flex flex-wrap gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setNovoAporte(prev => ({ ...prev, pessoa_id: "" }))}
                    className={`rounded-xl px-3.5 py-2 text-xs font-medium transition-all cursor-pointer ${
                      novoAporte.pessoa_id === ""
                        ? 'bg-primary text-primary-foreground shadow-xs ring-1 ring-primary font-semibold'
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
                      className={`rounded-xl px-3.5 py-2 text-xs font-medium transition-all cursor-pointer ${
                        novoAporte.pessoa_id === p.id
                          ? 'bg-primary text-primary-foreground shadow-xs ring-1 ring-primary font-semibold'
                          : 'bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground border border-border/50'
                      }`}
                    >
                      {p.nome.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Actions fixo */}
            <div className="flex items-center gap-3 p-4 sm:p-5 border-t border-border/40 bg-secondary/15 shrink-0">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1 h-11 rounded-xl font-medium border-border/70 hover:bg-secondary/80 cursor-pointer" 
                onClick={() => { setIsAportesExtrasModalOpen(false); setEditingAporteIndex(null); }}
                disabled={salvandoAporte}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={adicionarAporte}
                disabled={salvandoAporte || !novoAporte.valor || Number(novoAporte.valor) <= 0}
                className={`flex-1 h-11 rounded-xl font-semibold shadow-xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer ${
                  novoAporte.tipo === "retirada"
                    ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    : "bg-success hover:bg-success/90 text-success-foreground"
                }`}
              >
                {salvandoAporte ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin-smooth" />
                    <span>Calculando...</span>
                  </>
                ) : (
                  <>
                    {novoAporte.tipo === "retirada" ? <TrendingDown className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    <span>{editingAporteIndex !== null ? "Salvar alterações" : (novoAporte.tipo === "retirada" ? "Confirmar retirada" : "Adicionar aporte")}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal de Confirmação de Exclusão */}
      {extraParaExcluir && typeof document !== "undefined" && createPortal(
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div 
            className="relative w-full max-w-md rounded-2xl border border-border/70 bg-white dark:bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-card-foreground overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-destructive" />
            <button
              type="button"
              onClick={() => !excluindoAporte && setExtraParaExcluir(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
              title="Fechar"
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
                  {extraParaExcluir.aporte.tipo === "retirada" ? "Excluir retirada?" : "Excluir aporte extra?"}
                </h3>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  Tem certeza que deseja excluir {extraParaExcluir.aporte.tipo === "retirada" ? "a retirada" : "o aporte"} de <strong className="text-foreground font-semibold">{brl(Number(extraParaExcluir.aporte.valor))}</strong> ({extraParaExcluir.aporte.motivo || extraParaExcluir.aporte.origem})?
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
        </div>,
        document.body
      )}

      <div className="space-y-6 pt-6 border-t border-border/30 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        {/* Card Movimentações Financeiras (Aportes Extras & Retiradas) */}
        <Card className="p-0 overflow-hidden shadow-soft border-border/60 hover:border-accent/40 transition-all bg-white dark:bg-card rounded-2xl group">
          {/* Header do Card */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 border-b border-border/40 bg-secondary/20">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                <Wallet className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-display text-base sm:text-lg font-semibold text-foreground leading-tight">
                    Movimentações financeiras
                  </h2>
                  {aportesExtras.length > 0 && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent shrink-0">
                      {aportesExtras.length} {aportesExtras.length === 1 ? "registro" : "registros"}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Aportes pontuais e retiradas com histórico rastreável e reversão segura.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => abrirModalNovoAporte("retirada")} 
                className="flex-1 sm:flex-initial h-9 px-3 rounded-xl text-xs font-medium border-destructive/30 text-destructive hover:bg-destructive/10 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <TrendingDown className="h-3.5 w-3.5" />
                <span>Retirada</span>
              </Button>
              <Button 
                size="sm" 
                onClick={() => abrirModalNovoAporte("aporte")} 
                className="flex-1 sm:flex-initial h-9 px-3 rounded-xl text-xs font-medium bg-gradient-warm text-accent-foreground hover:opacity-95 shadow-glow flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Aporte</span>
              </Button>
            </div>
          </div>

          {aportesExtras.length === 0 ? (
            <div 
              onClick={() => abrirModalNovoAporte("aporte")}
              className="p-6 text-center cursor-pointer hover:bg-secondary/10 transition-colors flex flex-col items-center justify-center group/empty"
            >
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 border border-accent/20 text-accent shadow-inner transition-transform group-hover/empty:scale-105 duration-300">
                <Wallet className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-0.5">Nenhuma movimentação cadastrada</h3>
              <p className="text-xs text-muted-foreground max-w-[340px] leading-relaxed">
                Adicione 13º salário, bônus, resgates ou saques pontuais para acompanhar o impacto na sua meta.
              </p>
              <span className="text-xs text-accent font-medium mt-2 inline-flex items-center gap-1 hover:underline">
                + Lançar primeiro aporte ou retirada
              </span>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {aportesExtras.map((a, index) => {
                  const isRetirada = String(a.tipo || "").toLowerCase() === "retirada";
                  const isRevertido = !!a.revertido;
                  return (
                    <div 
                      key={index} 
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-2.5 group/item ${
                        isRevertido
                          ? "opacity-50 bg-secondary/10 border-border/30 line-through"
                          : isRetirada
                            ? "border-destructive/20 bg-destructive/5 hover:bg-destructive/10"
                            : "border-success/20 bg-success/5 hover:bg-success/10"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`h-8 w-8 rounded-lg border flex items-center justify-center shrink-0 ${
                          isRetirada
                            ? "bg-destructive/10 border-destructive/20 text-destructive"
                            : "bg-success/10 border-success/20 text-success"
                        }`}>
                          {isRetirada ? <TrendingDown className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`font-display text-sm font-semibold num leading-none ${
                              isRetirada ? "text-destructive" : "text-success"
                            }`}>
                              {isRetirada ? "-" : "+"}{brl(Number(a.valor))}
                            </span>
                            <span className={`text-[9px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0 border ${
                              isRetirada 
                                ? "text-destructive bg-destructive/10 border-destructive/20" 
                                : "text-success bg-success/10 border-success/20"
                            }`}>
                              {a.motivo || a.origem}
                            </span>
                            {isRevertido && (
                              <span className="text-[9px] font-medium uppercase tracking-wider text-warning bg-warning/10 border border-warning/20 px-1.5 py-0.5 rounded-full shrink-0 not-italic">
                                Revertido
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1 truncate">
                            <span>{formatarDataAporte(a.data)}</span>
                            <span className="text-border">•</span>
                            <span className="font-medium text-foreground/80">{a.pessoaNome ?? "Conjunto"}</span>
                            {a.revertidoEm && (
                              <span className="text-[10px] text-muted-foreground">(revertido em {formatarDataAporte(a.revertidoEm)})</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5 shrink-0 not-italic">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => reverterMovimentacao(index)} 
                          className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg"
                          title={isRevertido ? "Desfazer reversão" : "Reverter movimentação (manter histórico)"}
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => editarAporte(index)} 
                          className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg"
                          title="Editar"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => removerAporte(index)} 
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                          title="Excluir"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Resumo Total no rodapé */}
              {(() => {
                const totalAportesValidos = aportesExtras
                  .filter(a => !a.revertido && String(a.tipo || "").toLowerCase() !== "retirada")
                  .reduce((acc, a) => acc + Number(a.valor || 0), 0);
                const totalRetiradasValidas = aportesExtras
                  .filter(a => !a.revertido && String(a.tipo || "").toLowerCase() === "retirada")
                  .reduce((acc, a) => acc + Number(a.valor || 0), 0);
                const saldoMovimentacoes = totalAportesValidos - totalRetiradasValidas;

                return (
                  <div className="pt-3 border-t border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 px-1 text-xs">
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-muted-foreground text-xs">
                      <span>Aportes extras: <strong className="text-success font-semibold num">+{brl(totalAportesValidos)}</strong></span>
                      {totalRetiradasValidas > 0 && (
                        <span>Retiradas: <strong className="text-destructive font-semibold num">-{brl(totalRetiradasValidas)}</strong></span>
                      )}
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-2 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-border/20">
                      <span className="text-muted-foreground font-medium">Impacto líquido:</span>
                      <span className={`font-display text-sm font-semibold num ${
                        saldoMovimentacoes >= 0 ? "text-success" : "text-destructive"
                      }`}>
                        {saldoMovimentacoes >= 0 ? "+" : ""}{brl(saldoMovimentacoes)}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </Card>

        {/* Tabela Mês a Mês em Largura Completa */}
        <div className="w-full min-w-0">
          <TabelaMesAMes showFinancials={false} showCompletedToggle={false} showCenarioSelector={false} allowDailyDetail={true} />
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
