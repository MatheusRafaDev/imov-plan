"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { navPorCenario } from "@/components/AppShell";
import { usePlanLogic } from "@/hooks/usePlanLogic";
import { brl, type Aporte } from "@/lib/finance";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { MoneyInput } from "@/components/MoneyInput";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/DateInput";
import { ArrowRight, Plus, Trash2, X, AlertCircle, Pencil, Wallet, Calendar, TrendingDown, Check } from "lucide-react";
import { TabelaMesAMes } from "@/components/TabelaMesAMes";
import { PlanejamentoPageSkeleton } from "@/components/Skeleton";

const ORIGENS = ["FGTS", "13º Salário", "Bônus", "Hora Extra", "Férias", "Freelance", "Restituição IR", "PLR", "Venda de bem", "Herança", "Presente", "Outro"];

export default function PlanejamentoPage() {
  const { cenario, objetivo, setObjetivo, pessoas, setPessoas, aportesExtras, setAportesExtras, salvarPlano, calcularBackend, backendData, calculating, isDraftLoading } = usePlanLogic();
  const router = useRouter();
  const pathname = usePathname();
  const nav = navPorCenario[cenario] ?? navPorCenario.entrada;
  const currentStep = nav.findIndex(n => pathname?.startsWith(n.to)) + 1;
  const totalSteps = nav.length;

  const isLoading = isDraftLoading;

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
        calcularBackend(savedId).catch(console.error);
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
    <div className="max-w-6xl mx-auto space-y-8 lg:space-y-12">
      <div className="animate-fade-in-up" style={{ animationDelay: '0ms' }}>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">Etapa {currentStep > 0 ? currentStep : 3} de {totalSteps}</p>
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl mb-3 font-medium bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">Acelere seu plano</h1>
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
                  <p className="text-xs uppercase tracking-wider text-destructive font-bold mb-2">{!atingiuMeta ? "Meta não atingível" : foraDoPrazo ? `Não atinge o prazo (${prazoMeses}m)` : ""}</p>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-medium">Atual:</span>
                    <span className="font-semibold text-foreground">{brl(aporteTotal)}/mês</span>
                  </div>
                  <div className="flex justify-between items-center text-xs mt-1.5">
                    <span className="text-muted-foreground font-medium">Necessário:</span>
                    <span className="font-bold text-destructive">{brl(aporteNecessario)}/mês</span>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs uppercase tracking-wider text-success font-bold mb-2">No prazo programado</p>
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
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Progresso inicial da meta</p>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" onClick={() => setIsEditingTotal(!isEditingTotal)} title="Atualizar valor guardado hoje">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              {isEditingTotal ? (
                <div className="flex items-center gap-2 animate-fade-in">
                  <MoneyInput 
                    variant="money" 
                    min={0} 
                    value={totalGuardado} 
                    onChange={handleUpdateTotal} 
                    className="font-display text-2xl sm:text-3xl font-semibold h-10 w-32 sm:w-40 border-primary/40 bg-primary/5 rounded-xl text-primary ring-1 ring-primary/20 transition-all outline-none"
                  />
                  <Button onClick={() => setIsEditingTotal(false)} size="icon" className="bg-primary text-primary-foreground h-10 w-10 rounded-xl shadow-md shrink-0">
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <span className="font-display text-3xl sm:text-4xl num leading-none tracking-tight text-foreground">{brl(totalGuardado)}</span>
              )}
              <span className="text-[11px] sm:text-xs text-muted-foreground mb-1 font-medium whitespace-nowrap">de {brl(meta)}</span>
            </div>
            <div className="relative h-2.5 sm:h-3 w-full bg-secondary/80 rounded-full overflow-hidden shadow-inner">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-accent transition-all duration-1000 ease-out"
                style={{ width: `${progressoPercent}%` }}
              />
              <div className="absolute top-0 left-0 w-full h-full bg-white/20 animate-pulse mix-blend-overlay" />
            </div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground text-right font-semibold">{progressoPercent.toFixed(1)}% alcançado</p>
          </div>
        </Card>

        <Card className="p-5 sm:p-6 border-border/40 rounded-2xl flex flex-col justify-center transition-all duration-300 hover:shadow-lg hover:border-border/60">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Aporte mensal (Programado)</p>
          <p className="font-display text-4xl sm:text-5xl num mt-3 leading-none bg-gradient-to-br from-accent to-accent/70 bg-clip-text text-transparent">{brl(aporteTotal)}</p>

          <div className="mt-6 space-y-2.5">
            {pessoas.map(p => {
              const nameInitial = p.nome.charAt(0).toUpperCase();
              return (
                <div key={p.id} className="flex justify-between items-center bg-secondary/30 p-2.5 rounded-xl border border-border/40 transition-colors hover:bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-full bg-accent/10 text-accent flex items-center justify-center text-[11px] font-bold shadow-sm">
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

      <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-6 sm:gap-8 pt-8 border-t border-border/30 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <div className="space-y-4">
          <div className="rounded-3xl border border-border/40 bg-gradient-to-b from-card/80 to-card/30 p-5 sm:p-6 lg:p-8 shadow-sm backdrop-blur-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-2">
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-medium">Aportes extras</h2>
                <p className="text-[13px] sm:text-sm text-muted-foreground mt-1">Recursos eventuais para turbinar sua meta.</p>
              </div>
              {aportesExtras.length > 0 && (
                <Button variant="outline" onClick={() => setIsAportesExtrasModalOpen(true)} className="shadow-sm rounded-xl text-sm h-10 border-primary/20 text-primary hover:bg-primary/5 hover:border-primary/40 transition-colors">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              )}
            </div>

            {aportesExtras.length === 0 ? (
              <div className="mt-6 sm:mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-secondary/20 py-10 sm:py-14 px-4 sm:px-6 text-center transition-all duration-300 hover:bg-secondary/40 hover:border-primary/30 group cursor-pointer" onClick={() => setIsAportesExtrasModalOpen(true)}>
                <div className="mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-primary/10 shadow-inner transition-transform group-hover:scale-110 duration-500 ease-out relative">
                  <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-20" />
                  <Wallet className="h-7 w-7 sm:h-8 sm:w-8 text-primary relative z-10" />
                </div>
                <h3 className="text-base sm:text-lg font-medium text-foreground mb-1.5">Nenhum aporte extra adicionado</h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
                  Turbine o seu planejamento adicionando recursos como décimo terceiro, bônus ou vendas de bens.
                </p>
                <Button className="bg-primary shadow-lg shadow-primary/20 text-primary-foreground transition-all rounded-xl h-10 px-6 font-medium group-hover:-translate-y-0.5">
                  <Plus className="h-4 w-4 mr-2" />
                  Lançar aporte extra
                </Button>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {aportesExtras.map((a, index) => (
                  <div key={index} className="group relative rounded-2xl border border-border/40 bg-card p-4 transition-all duration-300 hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 shrink-0 shadow-sm">
                           <TrendingDown className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-display font-semibold num text-lg text-foreground leading-none">{brl(Number(a.valor))}</p>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[11px] text-muted-foreground mt-2 font-medium">
                            <span className="flex items-center bg-secondary/80 px-2 py-0.5 rounded-md text-foreground/80"><Calendar className="h-3 w-3 mr-1.5 opacity-70" /> {new Date(a.data + "T12:00:00").toLocaleDateString("pt-BR")}</span>
                            <span className="bg-secondary/80 px-2 py-0.5 rounded-md text-foreground/80">{a.origem}</span>
                            <span className="rounded-md bg-accent/10 px-2 py-0.5 text-accent">{a.pessoaNome ?? "Conjunto"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all self-end sm:self-auto translate-x-0 sm:translate-x-2 sm:group-hover:translate-x-0">
                        <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); editarAporte(index); }} className="h-10 w-10 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); removerAporte(index); }} className="h-10 w-10 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4 min-w-0">
          <TabelaMesAMes showFinancials={false} showCompletedToggle={false} showCenarioSelector={false} />
        </div>
      </div>

      {/* Botão Prosseguir */}
      <div className="pt-6 pb-4 flex justify-end animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        <Button
          onClick={prosseguir}
          disabled={calculating}
          className="w-full lg:w-auto h-12 px-8 text-sm font-semibold rounded-xl bg-primary text-primary-foreground shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 hover:-translate-y-0.5 active:scale-[0.98]"
        >
          {calculating ? "Calculando..." : "Ver resultado"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
