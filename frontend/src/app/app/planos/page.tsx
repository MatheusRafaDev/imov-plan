"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { usePlanos, useCriarPlano, useExcluirPlano, useRenomearPlano } from "@/hooks/usePlanos";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { brl } from "@/lib/finance";
import { toast } from "sonner";
import { Building2, Plus, Trash2, CheckCircle2, Loader2, ArrowRight, TrendingUp, Clock, Zap, Edit2, Check, X, AlertTriangle } from "lucide-react";
import { SimulacaoService, type BackendSimulacaoResult } from "@/services/SimulacaoService";
import { usePlanStore } from "@/store/usePlanStore";

export default function PlanosPage() {
  const planoId = usePlanStore((state) => state.planoId);
  const setPlanoId = usePlanStore((state) => state.setPlanoId);
  const resetPlan = usePlanStore((state) => state.reset);
  const { data: planos = [], isLoading: carregandoPlanos } = usePlanos();
  const { mutateAsync: criarNovoPlano } = useCriarPlano();
  const { mutateAsync: excluirPlano } = useExcluirPlano();
  const { mutateAsync: renomearPlanoArgs } = useRenomearPlano();

  const trocarPlanoAtivo = (id: string) => {
    setPlanoId(id);
  };

  const renomearPlano = async (id: string, novoNome: string) => {
    try {
      await renomearPlanoArgs({ planoId: id, novoNome });
      return true;
    } catch {
      return false;
    }
  };
  const router = useRouter();

  const [criando, setCriando] = useState(false);
  const [trocando, setTrocando] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState<string | null>(null);
  const [editandoNome, setEditandoNome] = useState<string | null>(null);
  const [nomeTemp, setNomeTemp] = useState("");
  const [salvandoNome, setSalvandoNome] = useState(false);
  const [planoAExcluir, setPlanoAExcluir] = useState<{id: string, nome: string} | null>(null);
  const [simulacoes, setSimulacoes] = useState<Record<string, BackendSimulacaoResult>>({});
  const [carregandoSimulacoes, setCarregandoSimulacoes] = useState(false);

  useEffect(() => {
    if (planos.length > 0) {
      let active = true;
      const fetchSimulacoes = async () => {
        setCarregandoSimulacoes(true);
        const simMap: Record<string, BackendSimulacaoResult> = {};
        await Promise.all(
          planos.map(async (plano) => {
            try {
              const result = await SimulacaoService.getUltimaSimulacao(plano.id);
              if (result) {
                simMap[plano.id] = result;
              }
            } catch (err) {
              console.error(`Erro ao carregar simulação do plano ${plano.id}`, err);
            }
          })
        );
        if (active) {
          setSimulacoes(simMap);
          setCarregandoSimulacoes(false);
        }
      };
      fetchSimulacoes();
      return () => {
        active = false;
      };
    }
  }, [planos]);

  const handleTrocar = async (id: string) => {
    if (id === planoId) {
      router.push("/app/imovel");
      return;
    }
    setTrocando(id);
    try {
      trocarPlanoAtivo(id);
      router.push("/app/imovel");
    } finally {
      setTrocando(null);
    }
  };

  const handleCriarNovo = async () => {
    setCriando(true);
    try {
      const novoId = await criarNovoPlano();
      if (novoId) {
        resetPlan();
        setPlanoId(novoId);
        toast.success("Novo plano criado!");
        router.push("/app/imovel");
      } else {
        toast.error("Não foi possível criar um novo plano. Tente novamente.");
      }
    } finally {
      setCriando(false);
    }
  };

  const handleExcluir = (id: string, nome: string) => {
    setPlanoAExcluir({ id, nome });
  };

  const confirmarExcluir = async () => {
    if (!planoAExcluir) return;
    setExcluindo(planoAExcluir.id);
    try {
      await excluirPlano(planoAExcluir.id);
      
      const planoExcluidoEraAtivo = planoAExcluir.id === planoId;
      const outrosPlanos = planos.filter((plano) => plano.id !== planoAExcluir.id);

      setSimulacoes(prev => {
        const updated = { ...prev };
        delete updated[planoAExcluir.id];
        return updated;
      });

      if (planoExcluidoEraAtivo) {
        if (outrosPlanos.length > 0) {
          const proximoPlano = outrosPlanos[0];
          setPlanoId(proximoPlano.id);
          toast.success(`Plano excluído. Redirecionando para o plano ativo "${proximoPlano.nomePlano}".`);
          router.push("/app/imovel");
        } else {
          resetPlan();
          toast.success("Plano excluído.");
          router.push("/app/imovel");
        }
      } else {
        // Excluiu um plano que não era o ativo: cai para o plano ativo atual
        const planoAtivoAtual = outrosPlanos.find(p => p.id === planoId);
        if (planoAtivoAtual) {
          toast.success(`Plano excluído. Retornando ao plano ativo "${planoAtivoAtual.nomePlano}".`);
          router.push("/app/imovel");
        } else if (outrosPlanos.length > 0) {
          setPlanoId(outrosPlanos[0].id);
          toast.success(`Plano excluído. Redirecionando para o plano ativo "${outrosPlanos[0].nomePlano}".`);
          router.push("/app/imovel");
        } else {
          resetPlan();
          toast.success("Plano excluído.");
          router.push("/app/imovel");
        }
      }
    } catch {
      toast.error("Não foi possível excluir o plano. Tente novamente.");
    } finally {
      setExcluindo(null);
      setPlanoAExcluir(null);
    }
  };

  const handleSalvarNome = async (id: string) => {
    if (!nomeTemp.trim()) return;
    setSalvandoNome(true);
    try {
      const ok = await renomearPlano(id, nomeTemp.trim());
      if (ok) {
        toast.success("Nome do plano atualizado!");
        setEditandoNome(null);
      } else {
        toast.error("Erro ao renomear o plano.");
      }
    } finally {
      setSalvandoNome(false);
    }
  };

  // Lógica de Comparação Inteligente (apenas se tiver >= 2 planos)
  const temMaisDeUmPlano = planos.length >= 2;
  const simVals = Object.values(simulacoes);
  
  let maisRapido = null;
  let maiorLucro = null;
  let menorAporte = null;

  if (temMaisDeUmPlano && simVals.length >= 2) {
    maisRapido = simVals.reduce((prev, curr) => (prev.mesesParaAtingir < curr.mesesParaAtingir ? prev : curr));
    maiorLucro = simVals.reduce((prev, curr) => (prev.lucroLiquido > curr.lucroLiquido ? prev : curr));
    menorAporte = simVals.reduce((prev, curr) => (prev.aporteMensalTotal < curr.aporteMensalTotal ? prev : curr));
  }

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up pb-12 w-full">
      <div className="flex items-center justify-between gap-4 flex-wrap border-b border-border/40 pb-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-accent font-medium mb-1.5 flex items-center gap-2">
            <Building2 className="h-4 w-4" /> Comparador Inteligente
          </p>
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl mb-2 font-normal">Seus imóveis planejados</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Compare a viabilidade financeira, rentabilidade e o tempo de cada plano para a conquista da chave.</p>
        </div>
        <Button onClick={handleCriarNovo} disabled={criando} className="bg-gradient-warm text-accent-foreground hover:opacity-95 shadow-glow gap-2 h-11 px-5">
          {criando ? <Loader2 className="h-4 w-4 animate-spin-smooth" /> : <Plus className="h-4 w-4" />}
          Novo plano
        </Button>
      </div>

      {carregandoPlanos && planos.length === 0 ? (
        <div className="grid place-items-center py-24 text-muted-foreground gap-3">
          <Loader2 className="h-8 w-8 animate-spin-smooth text-accent" />
          <p className="text-sm">Carregando seus planos...</p>
        </div>
      ) : planos.length === 0 ? (
        <Card className="p-8 sm:p-12 text-center space-y-4 shadow-soft border-border/60 max-w-2xl mx-auto my-8">
          <div className="mx-auto w-12 h-12 rounded-full bg-accent/10 grid place-items-center text-accent">
            <Building2 className="h-6 w-6" />
          </div>
          <h3 className="font-display text-2xl">Nenhum plano cadastrado ainda</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Crie seu primeiro imóvel planejado para simular entradas, aportes mensais e tempo até a entrega das chaves.
          </p>
          <Button onClick={handleCriarNovo} disabled={criando} className="bg-gradient-warm text-accent-foreground hover:opacity-95 shadow-glow gap-2">
            {criando ? <Loader2 className="h-4 w-4 animate-spin-smooth" /> : <Plus className="h-4 w-4" />}
            Criar meu primeiro plano
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {planos.map((plano) => {
            const isAtivo = plano.id === planoId;
            const sim = simulacoes[plano.id];
            
            const isMaisRapido = maisRapido?.planejamentoId === plano.id;
            const isMaiorLucro = maiorLucro?.planejamentoId === plano.id;
            const isMenorAporte = menorAporte?.planejamentoId === plano.id;

            return (
              <Card key={plano.id} className={`group p-0 overflow-hidden shadow-soft border-border/60 transition-all ${isAtivo ? "ring-2 ring-accent" : "hover:border-accent/40"}`}>
                
                {/* Header do Card */}
                <div className={`p-5 flex items-start justify-between gap-2 border-b border-border/40 ${isAtivo ? "bg-accent/5" : "bg-secondary/20"}`}>
                  <div className="flex-1">
                    {editandoNome === plano.id ? (
                      <div className="flex items-center gap-2 mb-1">
                        <input 
                          type="text" 
                          autoFocus
                          className="font-display text-xl bg-background border border-border/50 rounded px-2 py-0.5 outline-none focus:ring-2 focus:ring-accent w-full max-w-[200px]"
                          value={nomeTemp}
                          onChange={(e) => setNomeTemp(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSalvarNome(plano.id);
                            if (e.key === "Escape") setEditandoNome(null);
                          }}
                        />
                        <button onClick={() => handleSalvarNome(plano.id)} disabled={salvandoNome} className="text-success hover:bg-success/10 p-1 rounded transition-colors">
                          {salvandoNome ? <Loader2 className="h-4 w-4 animate-spin-smooth" /> : <Check className="h-4 w-4" />}
                        </button>
                        <button onClick={() => setEditandoNome(null)} disabled={salvandoNome} className="text-muted-foreground hover:bg-secondary p-1 rounded transition-colors">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <h3 className="font-display text-xl sm:text-2xl flex flex-wrap items-center gap-2">
                        {plano.nomePlano}
                        {isAtivo && (
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-medium tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded-full shrink-0">
                            <CheckCircle2 className="h-3 w-3" /> Ativo
                          </span>
                        )}
                        <button 
                          onClick={() => {
                            setNomeTemp(plano.nomePlano);
                            setEditandoNome(plano.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 hover:text-accent transition-opacity text-muted-foreground/50 p-1"
                          title="Renomear plano"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      </h3>
                    )}
                    
                    {(plano.cidade || plano.estado) && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {[plano.cidade, plano.estado].filter(Boolean).join(" - ")}
                      </p>
                    )}
                  </div>
                  
                  {/* Ações */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant={isAtivo ? "outline" : "default"}
                      size="sm"
                      className={`${!isAtivo ? "bg-gradient-warm text-accent-foreground hover:opacity-95" : ""}`}
                      onClick={() => handleTrocar(plano.id)}
                      disabled={trocando === plano.id}
                    >
                      {trocando === plano.id ? <Loader2 className="h-4 w-4 animate-spin-smooth" /> : (isAtivo ? "Abrir" : "Selecionar")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive h-9 w-9"
                      onClick={() => handleExcluir(plano.id, plano.nomePlano)}
                      disabled={excluindo === plano.id}
                      title="Excluir"
                    >
                      {excluindo === plano.id ? <Loader2 className="h-4 w-4 animate-spin-smooth" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Conteúdo com Hierarquia Visual Priorizada */}
                <div className="p-5 space-y-4">
                  {/* Saldo Atual & Progresso Hero */}
                  {sim ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">Saldo atual</span>
                        <span className="text-muted-foreground text-[11px] font-medium">Meta: {brl(sim.totalNecessario || (plano.valorImovel * (plano.percentualEntrada / 100)))}</span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="font-display text-2xl sm:text-3xl font-semibold text-foreground num leading-none">
                          {brl(sim.valorJaGuardado)}
                        </span>
                        <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                          {(sim.totalNecessario > 0 ? Math.min(100, (sim.valorJaGuardado / sim.totalNecessario) * 100) : 0).toFixed(1)}%
                        </span>
                      </div>
                      <div className="relative h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full transition-all duration-500 ease-out"
                          style={{ 
                            width: `${sim.totalNecessario > 0 ? Math.min(100, (sim.valorJaGuardado / sim.totalNecessario) * 100) : 0}%` 
                          }}
                        />
                      </div>
                    </div>
                  ) : carregandoSimulacoes ? (
                    <div className="h-20 bg-secondary/30 rounded-xl animate-pulse flex items-center justify-center text-muted-foreground/50 text-xs">
                      Calculando indicadores...
                    </div>
                  ) : (
                    <div className="p-3 bg-secondary/15 rounded-xl border border-border/40 text-xs text-muted-foreground text-center">
                      Abra o plano para calcular saldo e projeções.
                    </div>
                  )}

                  {/* Grid de Indicadores Principais */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <div className="p-2.5 rounded-xl bg-secondary/30 border border-border/40">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Total aportado</p>
                      <p className="font-display text-sm font-semibold text-foreground num mt-0.5">
                        {sim ? brl(sim.totalInvestido) : "-"}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-secondary/30 border border-border/40">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Rendimentos</p>
                      <p className="font-display text-sm font-semibold text-emerald-500 num mt-0.5">
                        {sim ? `+${brl(sim.lucroLiquido)}` : "-"}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-secondary/30 border border-border/40">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Total retirado</p>
                      <p className="font-display text-sm font-semibold text-rose-500 num mt-0.5">
                        {sim ? `-${brl(sim.totalRetirado ?? 0)}` : "R$ 0,00"}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-secondary/30 border border-border/40">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Prazo da meta</p>
                      <p className="font-display text-sm font-semibold text-foreground num mt-0.5 flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground inline" />
                        <span>{sim ? `${sim.mesesParaAtingir} meses` : (plano.prazoMaxMeses ? `${plano.prazoMaxMeses} meses` : "-")}</span>
                      </p>
                    </div>
                  </div>

                  {/* Informações Secundárias e Comparação */}
                  <div className="pt-3 border-t border-border/40 space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>Valor do imóvel:</span>
                      <span className="font-medium text-foreground num">{plano.valorImovel > 0 ? brl(plano.valorImovel) : "-"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Entrada pretendida:</span>
                      <span className="font-medium text-foreground num">{plano.percentualEntrada > 0 ? `${plano.percentualEntrada}%` : "-"}</span>
                    </div>
                    {sim && (
                      <div className="flex items-center justify-between">
                        <span>Aporte mensal:</span>
                        <span className="font-medium text-foreground num">{brl(sim.aporteMensalTotal)}/mês</span>
                      </div>
                    )}

                    {temMaisDeUmPlano && sim && (isMaisRapido || isMaiorLucro || isMenorAporte) && (
                      <div className="flex items-center gap-1.5 pt-1.5 flex-wrap">
                        {isMaisRapido && <span className="bg-success/15 text-success text-[10px] px-2 py-0.5 rounded-full font-medium">⚡ Mais Rápido</span>}
                        {isMaiorLucro && <span className="bg-accent/15 text-accent text-[10px] px-2 py-0.5 rounded-full font-medium">✨ Maior Rendimento</span>}
                        {isMenorAporte && <span className="bg-secondary text-foreground text-[10px] px-2 py-0.5 rounded-full font-medium">🌱 Mais Suave</span>}
                      </div>
                    )}
                  </div>

                  {!isAtivo && (
                    <Button 
                      variant="ghost" 
                      className="w-full text-accent hover:text-accent hover:bg-accent/10 mt-1"
                      onClick={() => handleTrocar(plano.id)}
                    >
                      Selecionar como ativo <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}

          {/* Card para Adicionar Novo Plano */}
          <Card
            onClick={criando ? undefined : handleCriarNovo}
            className="glass p-6 border-2 border-dashed border-border/60 hover:border-accent/50 hover:bg-secondary/20 cursor-pointer transition-all flex flex-col items-center justify-center min-h-[280px] sm:min-h-[340px] text-muted-foreground hover:text-foreground group rounded-xl shadow-soft"
          >
            <div className="h-14 w-14 rounded-full bg-secondary/80 group-hover:bg-accent/10 grid place-items-center mb-3.5 transition-colors">
              {criando ? (
                <Loader2 className="h-6 w-6 animate-spin-smooth text-accent" />
              ) : (
                <Plus className="h-6 w-6 text-muted-foreground group-hover:text-accent transition-colors" />
              )}
            </div>
            <h3 className="font-display text-xl font-semibold text-foreground">Novo imóvel planejado</h3>
            <p className="text-sm text-center mt-2 max-w-[260px] text-muted-foreground leading-relaxed">
              Adicione outro imóvel para comparar valores de entrada, prazos e rentabilidade.
            </p>
          </Card>
        </div>
      )}
    </div>

      <DeletePlanoModal
        plano={planoAExcluir}
        onClose={() => !excluindo && setPlanoAExcluir(null)}
        onConfirm={confirmarExcluir}
        isExcluding={Boolean(excluindo)}
      />
    </>
  );
}

function DeletePlanoModal({
  plano,
  onClose,
  onConfirm,
  isExcluding,
}: {
  plano: { id: string; nome: string } | null;
  onClose: () => void;
  onConfirm: () => void;
  isExcluding: boolean;
}) {
  if (!plano || typeof document === "undefined") return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-modal-backdrop"
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="relative w-full max-w-md rounded-2xl border border-border/70 bg-white dark:bg-card p-6 shadow-2xl animate-modal-box text-card-foreground overflow-hidden font-sans"
      >
        {/* Linha decorativa de topo */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-destructive" />

        {/* Botão Fechar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
          title="Fechar"
          disabled={isExcluding}
        >
          <X className="h-4 w-4" />
        </button>

        {/* Ícone e Título */}
        <div className="flex items-start gap-4 pt-1">
          <div className="h-12 w-12 shrink-0 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center shadow-xs">
            <Trash2 className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0 pr-6">
            <h3 className="font-display text-xl font-semibold text-foreground tracking-tight">
              Excluir plano?
            </h3>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              Tem certeza que deseja excluir o plano <strong className="text-foreground font-semibold">&quot;{plano.nome}&quot;</strong>?
            </p>
          </div>
        </div>

        {/* Alerta de consequência */}
        <div className="mt-4 p-3 rounded-xl bg-destructive/5 border border-destructive/15 text-xs text-destructive/90 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-destructive" />
          <span className="leading-relaxed">
            Esta ação é irreversível. O planejamento, metas salvas e simulações deste imóvel serão permanentemente apagados.
          </span>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-3 mt-6">
          <Button 
            type="button" 
            variant="outline" 
            className="flex-1 h-11 rounded-xl font-medium border-border/70 hover:bg-secondary/80" 
            onClick={onClose} 
            disabled={isExcluding}
          >
            Cancelar
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            className="flex-1 h-11 rounded-xl font-medium shadow-sm hover:opacity-95 flex items-center justify-center gap-2" 
            onClick={onConfirm} 
            disabled={isExcluding}
          >
            {isExcluding ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin-smooth" />
                <span>Excluindo...</span>
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
  );
}
