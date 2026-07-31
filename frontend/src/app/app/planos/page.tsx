"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlanContext } from "@/context/PlanContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { brl } from "@/lib/finance";
import { toast } from "sonner";
import { Building2, Plus, Trash2, CheckCircle2, Loader2, ArrowRight, TrendingUp, Clock, Zap, Edit2, Check, X } from "lucide-react";
import { SimulacaoService, type BackendSimulacaoResult } from "@/services/SimulacaoService";

export default function PlanosPage() {
  const {
    planoId,
    planos,
    carregandoPlanos,
    carregarListaPlanos,
    trocarPlanoAtivo,
    criarNovoPlano,
    excluirPlano,
    renomearPlano,
  } = usePlanContext();
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
    carregarListaPlanos();
  }, [carregarListaPlanos]);

  useEffect(() => {
    if (planos.length > 0) {
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
        setSimulacoes(simMap);
        setCarregandoSimulacoes(false);
      };
      fetchSimulacoes();
    }
  }, [planos]);

  const handleTrocar = async (id: string) => {
    if (id === planoId) {
      router.push("/app/imovel");
      return;
    }
    setTrocando(id);
    try {
      await trocarPlanoAtivo(id);
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
      const ok = await excluirPlano(planoAExcluir.id);
      if (ok) {
        toast.success("Plano excluído.");
        setSimulacoes(prev => {
          const updated = { ...prev };
          delete updated[planoAExcluir.id];
          return updated;
        });
      } else {
        toast.error("Não foi possível excluir o plano. Tente novamente.");
      }
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
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up pb-12">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-widest text-accent font-medium mb-2 flex items-center gap-2">
            <Building2 className="h-4 w-4" /> Comparador Inteligente
          </p>
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl mb-3">Seus imóveis planejados</h1>
          <p className="text-muted-foreground text-lg">Compare a viabilidade financeira e o tempo de cada plano.</p>
        </div>
        <Button onClick={handleCriarNovo} disabled={criando} className="bg-gradient-warm text-accent-foreground hover:opacity-95 shadow-glow gap-2">
          {criando ? <Loader2 className="h-4 w-4 animate-spin-smooth" /> : <Plus className="h-4 w-4" />}
          Novo plano
        </Button>
      </div>

      {carregandoPlanos && planos.length === 0 ? (
        <div className="grid place-items-center py-16 text-muted-foreground gap-2">
          <Loader2 className="h-6 w-6 animate-spin-smooth" />
          Carregando seus planos...
        </div>
      ) : planos.length === 0 ? (
        <Card className="p-6 sm:p-10 text-center space-y-4 shadow-soft border-border/60 max-w-2xl mx-auto">
          <p className="text-muted-foreground">Você ainda não tem nenhum plano salvo.</p>
          <Button onClick={handleCriarNovo} disabled={criando} className="bg-gradient-warm text-accent-foreground hover:opacity-95 shadow-glow gap-2">
            {criando ? <Loader2 className="h-4 w-4 animate-spin-smooth" /> : <Plus className="h-4 w-4" />}
            Criar meu primeiro plano
          </Button>
        </Card>
      ) : (
        <div className={`grid gap-6 ${temMaisDeUmPlano ? "lg:grid-cols-2" : "grid-cols-1 max-w-3xl mx-auto"}`}>
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
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded-full shrink-0">
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

                {/* Conteúdo Comparativo */}
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Valor do Imóvel</p>
                      <p className="font-display text-lg">{plano.valorImovel > 0 ? brl(plano.valorImovel) : "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Entrada</p>
                      <p className="font-display text-lg">{plano.percentualEntrada > 0 ? `${plano.percentualEntrada}%` : "-"}</p>
                    </div>
                  </div>

                  {/* Highlights Inteligentes */}
                  {(carregandoSimulacoes && !sim) ? (
                    <div className="h-32 bg-secondary/30 rounded-xl animate-pulse flex items-center justify-center text-muted-foreground/50 text-xs">Calculando projeção...</div>
                  ) : sim ? (
                    <div className="bg-secondary/30 rounded-xl p-4 space-y-3 border border-border/40">
                      <div className="flex justify-between items-center pb-2 border-b border-border/40">
                        <span className="text-sm text-muted-foreground flex items-center gap-1.5"><Clock className="h-4 w-4" /> Tempo para a chave</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{sim.mesesParaAtingir} meses</span>
                          {temMaisDeUmPlano && isMaisRapido && <span className="bg-success/15 text-success text-[10px] px-1.5 py-0.5 rounded uppercase font-bold">Mais Rápido</span>}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center pb-2 border-b border-border/40">
                        <span className="text-sm text-muted-foreground flex items-center gap-1.5"><TrendingUp className="h-4 w-4" /> Rendimento do CDI</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-success">+{brl(sim.lucroLiquido)}</span>
                          {temMaisDeUmPlano && isMaiorLucro && <span className="bg-success/15 text-success text-[10px] px-1.5 py-0.5 rounded uppercase font-bold">Maior Lucro</span>}
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground flex items-center gap-1.5"><Zap className="h-4 w-4" /> Aporte Mensal</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{brl(sim.aporteMensalTotal)}</span>
                          {temMaisDeUmPlano && isMenorAporte && <span className="bg-success/15 text-success text-[10px] px-1.5 py-0.5 rounded uppercase font-bold">Mais Suave</span>}
                        </div>
                      </div>
                    </div>
                  ) : (
                     <div className="h-32 bg-secondary/10 rounded-xl flex items-center justify-center text-muted-foreground text-xs border border-border/40 border-dashed">
                       Abra o plano para calcular os resultados.
                     </div>
                  )}

                  {!isAtivo && (
                    <Button 
                      variant="ghost" 
                      className="w-full text-accent hover:text-accent hover:bg-accent/10 mt-2"
                      onClick={() => handleTrocar(plano.id)}
                    >
                      Selecionar como ativo <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {planoAExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <Card className="max-w-md w-full p-6 shadow-glow border-border animate-in zoom-in-95 duration-200">
            <h3 className="font-display text-xl mb-2 flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" /> 
              Excluir plano
            </h3>
            <p className="text-muted-foreground mb-6">
              Tem certeza que deseja excluir o plano <strong className="text-foreground">"{planoAExcluir.nome}"</strong>? Essa ação não pode ser desfeita.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" onClick={() => setPlanoAExcluir(null)} disabled={excluindo === planoAExcluir.id}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={confirmarExcluir} disabled={excluindo === planoAExcluir.id}>
                {excluindo === planoAExcluir.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {excluindo === planoAExcluir.id ? "Excluindo..." : "Excluir"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
