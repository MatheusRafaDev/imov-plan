"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { navPorCenario } from "@/components/AppShell";
import { usePlanLogic } from "@/hooks/usePlanLogic";
import { type Pessoa } from "@/context/PlanContext";;
import { brl, mesesEntre, type Aporte } from "@/lib/finance";
import { formatDate } from "@/utils/formatters";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/MoneyInput";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/DateInput";
import { ArrowRight, Plus, Trash2, Sparkles, X, AlertCircle, Pencil, Wallet, Calendar, TrendingDown, Check } from "lucide-react";
import { TabelaMesAMes } from "@/components/TabelaMesAMes";
import { PlanejamentoPageSkeleton } from "@/components/Skeleton";

const ORIGENS = ["FGTS", "13º Salário", "Bônus", "Hora Extra", "Férias", "Freelance", "Restituição IR", "PLR", "Venda de bem", "Herança", "Presente", "Outro"];

export default function PlanejamentoPage() {
  const { cenario, objetivo, setObjetivo, pessoas, setPessoas, aportesExtras, setAportesExtras, saveDraft, salvarPlano, calcularBackend, backendData, calculating } = usePlanLogic();
  const router = useRouter();
  const pathname = usePathname();
  const nav = navPorCenario[cenario] ?? navPorCenario.entrada;
  const currentStep = nav.findIndex(n => pathname?.startsWith(n.to)) + 1;
  const totalSteps = nav.length;

  const [isLoading, setIsLoading] = useState(true);

  // Show skeleton briefly to avoid empty field flash on hydration
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 350);
    return () => clearTimeout(timer);
  }, []);

  const [isEditingTotal, setIsEditingTotal] = useState(false);

  const handleUpdateTotal = (novoTotal: number | "") => {
    const val = novoTotal === "" ? 0 : novoTotal;
    setObjetivo(prev => prev ? { ...prev, valorJaGuardado: val } : null);
    
    setPessoas(prev => {
      if (prev.length === 1) {
        return [{ ...prev[0], valorInicial: val }];
      }
      const currentTotal = prev.reduce((sum, p) => sum + Number(p.valorInicial ?? 0), 0);
      if (currentTotal <= 0) {
          return prev.map((p, i) => i === 0 ? { ...p, valorInicial: val } : { ...p, valorInicial: 0 });
      }
      const factor = val / currentTotal;
      return prev.map(p => ({ ...p, valorInicial: Number(p.valorInicial ?? 0) * factor }));
    });
  };

  const prosseguir = async () => {
    const savedId = await salvarPlano();
    if (savedId) {
      if (!savedId.startsWith("local-draft")) {
        await calcularBackend(savedId);
      }
      router.push("/app/resultado");
    } else {
      toast.error("Erro ao salvar os dados. Tente novamente.");
    }
  };
  
  const [isAportesExtrasModalOpen, setIsAportesExtrasModalOpen] = useState(false);
  const [editingAporteIndex, setEditingAporteIndex] = useState<number | null>(null);
  
  const [novoAporte, setNovoAporte] = useState({
    data: new Date().toISOString().slice(0, 10),
    valor: 0 as number | "",
    origem: "13º Salário",
    pessoa_id: "",
  });

  const aporteTotal = pessoas.reduce((s, p) => s + Number(p.aporte_mensal ?? 0), 0);
  const pessoasGuardadoSum = pessoas.reduce((s, p) => s + (p.valorInicial ?? 0), 0);
  const totalGuardado = pessoasGuardadoSum > 0 ? pessoasGuardadoSum : Number(objetivo?.valorJaGuardado ?? 0);
  const pessoaGuardado = pessoas.map(p => ({
    id: p.id,
    nome: p.nome,
    valor: p.valorInicial ?? 0,
    percent: totalGuardado ? ((p.valorInicial ?? 0) / totalGuardado) * 100 : 0,
  }));


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

  // Usa a data projetada do backend para atingir a meta com aportes atuais
  const dataAlcancavel = backendData?.dataPrevistaAlvo ? new Date(backendData.dataPrevistaAlvo) : null;

  const progressoPercent = Math.min(100, meta > 0 ? (totalGuardado / meta) * 100 : 0);

  const adicionarAporte = () => {
    if (!novoAporte.valor) return;
    const pessoa = pessoas.find(p => p.id === novoAporte.pessoa_id);
    const aporte: Aporte = {
      data: novoAporte.data,
      valor: novoAporte.valor,
      origem: novoAporte.origem,
      pessoaId: pessoa?.id,
      pessoaNome: pessoa ? pessoa.nome : undefined,
    };
    
    if (editingAporteIndex !== null) {
      const updated = [...aportesExtras];
      updated[editingAporteIndex] = aporte;
      setAportesExtras(updated);
      setEditingAporteIndex(null);
    } else {
      setAportesExtras([...aportesExtras, aporte]);
    }
    setNovoAporte({ ...novoAporte, valor: 0 });
  };

  const editarAporte = (index: number) => {
    const aporte = aportesExtras[index];
    setNovoAporte({
      data: aporte.data,
      valor: Number(aporte.valor),
      origem: aporte.origem,
      pessoa_id: aporte.pessoaId ?? "",
    });
    setEditingAporteIndex(index);
    setIsAportesExtrasModalOpen(true);
  };

  const removerAporte = (index: number) => {
    setAportesExtras(aportesExtras.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return <PlanejamentoPageSkeleton />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 lg:space-y-10">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-2">Etapa {currentStep > 0 ? currentStep : 3} de {totalSteps}</p>
        <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-3 font-light">Acelere seu plano</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Confira o resumo do seu tempo de preparo e adicione entradas extras para chegar lá mais rápido.</p>
      </div>

      {foraDoPrazo && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 sm:p-4 flex gap-2 sm:gap-3 text-destructive">
          <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <p className="font-semibold mb-1">Atenção ao seu prazo</p>
            <p>Mantendo o ritmo atual, a meta será atingida em {mesesEstimados} meses, acima do prazo escolhido ({prazoMeses} meses). Considere aumentar os aportes mensais ou adicionar aportes extras.</p>
          </div>
        </div>
      )}

      {/* Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className={`p-4 sm:p-6 border-border/50 flex flex-col justify-center items-center text-center rounded-xl ${!atingiuMeta || foraDoPrazo ? 'bg-destructive/5 border-destructive/30' : 'bg-success/5 border-success/30'}`}>
          <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-2">Tempo estimado</p>
          <p className={`font-display text-4xl sm:text-5xl lg:text-6xl num ${!atingiuMeta || foraDoPrazo ? 'text-destructive' : 'text-success'}`}>{mesesEstimados ? `${mesesEstimados}` : "—"}</p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-2">{mesesEstimados ? "meses" : "Indefinido"}</p>
          {mesesEstimados && (
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border/20 w-full">
              {!atingiuMeta || foraDoPrazo ? (
                <>
                  <p className="text-xs text-destructive font-medium mb-1">{!atingiuMeta ? "Meta não atingível" : foraDoPrazo ? `Não atinge o prazo (${prazoMeses} meses)` : ""}</p>
                  <p className="text-xs text-muted-foreground">Aporte atual: <span className="font-semibold text-foreground">{brl(aporteTotal)}/mês</span></p>
                  <p className="text-xs text-muted-foreground mt-1">Necessário: <span className="font-semibold text-destructive">{brl(aporteNecessario)}/mês</span></p>

                </>
              ) : (
                <>
                  <p className="text-xs text-success font-medium mb-1">Meta atingível no prazo</p>
                  <p className="text-xs text-muted-foreground">Aporte atual: <span className="font-semibold text-foreground">{brl(aporteTotal)}/mês</span></p>
                </>
              )}
            </div>
          )}
        </Card>

        <Card className="p-4 sm:p-6 border-border/50 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">Progresso inicial da meta</p>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => setIsEditingTotal(!isEditingTotal)} title="Atualizar valor guardado hoje">
              <Pencil className="h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex justify-between items-end">
              {isEditingTotal ? (
                <div className="flex items-center gap-2">
                  <MoneyInput 
                    variant="money" 
                    min={0} 
                    value={totalGuardado} 
                    onChange={handleUpdateTotal} 
                    className="font-display text-2xl sm:text-3xl font-semibold h-9 w-32 sm:w-40 border-border bg-background"
                  />
                  <Button onClick={() => setIsEditingTotal(false)} size="sm" className="bg-primary text-primary-foreground h-9 px-2">
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <span className="font-display text-2xl sm:text-3xl num leading-none">{brl(totalGuardado)}</span>
              )}
              <span className="text-xs sm:text-sm text-muted-foreground mb-1">de {brl(meta)}</span>
            </div>
            <div className="h-2 sm:h-3 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 ease-in-out"
                style={{ width: `${progressoPercent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-right">{progressoPercent.toFixed(1)}% alcançado</p>
          </div>
        </Card>

        <Card className="p-4 sm:p-6 border-border/50 flex flex-col justify-center">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground">Aporte mensal total (Programado)</p>
          <p className="font-display text-3xl sm:text-4xl num mt-2 leading-none text-accent">{brl(aporteTotal)}</p>

          <div className="mt-4 sm:mt-6 space-y-1.5 sm:space-y-2">
            {pessoas.map(p => (
              <div key={p.id} className="flex justify-between text-xs sm:text-sm items-center border-b border-border/40 pb-1.5 sm:pb-2 last:border-0 last:pb-0">
                <span className="text-muted-foreground">{p.nome}</span>
                <span className="num font-medium">{brl(Number(p.aporte_mensal || 0))}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Modal Aportes Extras */}
      {isAportesExtrasModalOpen && (
        <div className="fixed inset-0 z-[9999] grid min-h-screen place-items-center bg-primary/10 px-3 sm:px-4 py-4 sm:py-6 backdrop-blur-sm">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />
          <div className="relative z-[10000] w-full max-w-md overflow-hidden rounded-2xl border border-border/50 bg-card/95 p-4 sm:p-6 text-card-foreground shadow-[0_45px_120px_-60px_rgba(15,23,42,0.8)] ring-1 ring-slate-900/10">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/50 pb-3 sm:pb-4">
              <div>
                <h2 className="font-display text-lg sm:text-xl font-semibold text-foreground">
                  {editingAporteIndex !== null ? "Editar Aporte Extra" : "Adicionar Aporte Extra"}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">Aporte pontual para acelerar seu plano.</p>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 hover:bg-secondary" onClick={() => { setIsAportesExtrasModalOpen(false); setEditingAporteIndex(null); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Form Content */}
            <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Valor do aporte</Label>
                <MoneyInput
                  variant="money"
                  value={novoAporte.valor}
                  onChange={(v) => setNovoAporte({ ...novoAporte, valor: v })}
                  className="h-10 sm:h-11 w-full rounded-xl border border-border/70 bg-background px-3 text-base sm:text-lg text-foreground shadow-sm outline-none transition focus:border-primary/80 focus:ring-1 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Data do aporte</Label>
                <DateInput
                  value={novoAporte.data}
                  onChange={(v) => setNovoAporte({ ...novoAporte, data: v })}
                  className="w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-sm outline-none transition focus:border-primary/80 focus:ring-1 focus:ring-primary/20 text-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Origem</Label>
                <select
                  value={novoAporte.origem}
                  onChange={(e) => setNovoAporte({ ...novoAporte, origem: e.target.value })}
                  className="w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-sm outline-none transition focus:border-primary/80 focus:ring-1 focus:ring-primary/20 text-foreground"
                >
                  {ORIGENS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Quem contribuiu?</Label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setNovoAporte({ ...novoAporte, pessoa_id: "" })}
                    className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${novoAporte.pessoa_id === "" ? 'bg-primary text-primary-foreground border border-primary shadow-sm' : 'bg-background text-muted-foreground border border-border hover:border-primary/60 hover:text-foreground'}`}
                  >
                    Conjunto
                  </button>
                  {pessoas.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setNovoAporte({ ...novoAporte, pessoa_id: p.id })}
                      className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${novoAporte.pessoa_id === p.id ? 'bg-primary text-primary-foreground border border-primary shadow-sm' : 'bg-background text-muted-foreground border border-border hover:border-primary/60 hover:text-foreground'}`}
                    >
                      {p.nome}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Summary / Actions */}
            {Number(novoAporte.valor) > 0 && (
              <p className="text-xs text-muted-foreground text-center mb-3 sm:mb-4 italic">
                Resumo: {brl(Number(novoAporte.valor))} em {novoAporte.data ? new Date(novoAporte.data + "T12:00:00").toLocaleDateString("pt-BR") : "data de hoje"} ({novoAporte.pessoa_id ? pessoas.find(p => p.id === novoAporte.pessoa_id)?.nome : "Conjunto"})
              </p>
            )}

            <div className="flex justify-end gap-2 border-t border-border/50 pt-3 sm:pt-4">
              <Button variant="ghost" className="h-9 px-4 text-sm" onClick={() => { setIsAportesExtrasModalOpen(false); setEditingAporteIndex(null); }}>Cancelar</Button>
              <Button
                onClick={() => { adicionarAporte(); setIsAportesExtrasModalOpen(false); }}
                className="h-9 bg-primary text-primary-foreground px-4 text-sm"
                disabled={novoAporte.valor === "" || novoAporte.valor <= 0}
              >
                <Plus className="h-4 w-4 mr-1.5" /> {editingAporteIndex !== null ? "Salvar" : "Adicionar"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-4 sm:gap-6 pt-4 border-t border-border/40">
        <div className="space-y-3 sm:space-y-4">


          <div className="rounded-2xl border border-border/40 bg-gradient-to-b from-card to-card/50 p-4 sm:p-6 lg:p-8 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-light">Aportes extras</h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">Aportes pontuais que aceleram sua meta além do programado.</p>
              </div>
              {aportesExtras.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button variant="default" onClick={() => setIsAportesExtrasModalOpen(true)} className="shadow-sm text-sm sm:text-base h-9 sm:h-10">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar aporte
                  </Button>
                </div>
              )}
            </div>

            {aportesExtras.length === 0 ? (
              <div className="mt-6 sm:mt-8 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/40 bg-muted/20 py-8 sm:py-12 px-4 sm:px-6 text-center transition-colors hover:bg-muted/40 group cursor-default">
                <div className="mb-3 sm:mb-4 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-primary/10 transition-transform group-hover:scale-110 duration-300">
                  <Wallet className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                </div>
                <h3 className="text-sm sm:text-base font-medium text-foreground mb-1">Nenhum aporte extra adicionado</h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mb-4 sm:mb-6">
                  Turbine o seu planejamento adicionando recursos extras (décimo terceiro, bônus, vendas) que entrarão ao longo do tempo.
                </p>
                <Button variant="outline" onClick={() => setIsAportesExtrasModalOpen(true)} className="bg-background shadow-sm hover:border-primary/50 hover:text-primary transition-all text-sm sm:text-base h-9 sm:h-10">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar meu primeiro aporte
                </Button>
              </div>
            ) : (
              <div className="mt-6 sm:mt-8 space-y-2 sm:space-y-3">
                {aportesExtras.map((a, index) => (
                  <div key={index} className="group relative rounded-xl border border-border/50 bg-background p-3 sm:p-4 lg:p-5 transition-all duration-300 hover:shadow-md hover:border-primary/30">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="hidden sm:flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-primary/10 shrink-0">
                           <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold num text-base sm:text-lg text-foreground">{brl(Number(a.valor))}</p>
                          <div className="flex flex-wrap items-center gap-x-1.5 sm:gap-x-2 gap-y-1 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center"><Calendar className="h-3 w-3 mr-1" /> {new Date(a.data + "T12:00:00").toLocaleDateString("pt-BR")}</span>
                            <span className="hidden sm:inline">•</span>
                            <span className="font-medium text-foreground/80">{a.origem}</span>
                            <span className="hidden sm:inline">•</span>
                            <span className="rounded-full bg-secondary px-1.5 sm:px-2 py-0.5 font-medium text-secondary-foreground text-xs">{a.pessoaNome ?? "Conjunto"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity self-end sm:self-auto">
                        <Button size="icon" variant="ghost" onClick={() => editarAporte(index)} className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-primary hover:bg-primary/10">
                          <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => removerAporte(index)} className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4">

          <TabelaMesAMes showFinancials={false} showCompletedToggle={false} showCenarioSelector={false} />
        </div>
      </div>

      {/* Botão Prosseguir */}
      <div className="pt-3">
        <Button
          onClick={prosseguir}
          disabled={calculating}
          className="w-full lg:w-auto lg:float-right h-12 text-sm font-semibold rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all active:scale-[0.98]"
        >
          {calculating ? "Calculando..." : "Ver resultado"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
