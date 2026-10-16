"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { usePlanLogic } from "@/hooks/usePlanLogic";
import { type Pessoa, type GastoDetalhado } from "@/context/PlanContext";;
import PessoaCard from "@/components/PessoaCard";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/MoneyInput";

const generateObjectId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(12);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  return Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
};
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { brl } from "@/lib/finance";
import { Plus, Trash2, ArrowRight, X, Wallet, TrendingUp, AlertTriangle, ChevronDown, Users, Coins, Sparkles } from "lucide-react";
import { PessoasPageSkeleton } from "@/components/Skeleton";

const calcularGastos = (p: { usar_gastos_detalhados?: boolean; gastos_detalhados?: GastoDetalhado[]; gastos_mensais?: number | "" }) => {
  return p.usar_gastos_detalhados 
    ? (p.gastos_detalhados || []).reduce((acc, g) => acc + Number(g.valor), 0)
    : Number(p.gastos_mensais || 0);
};

export default function PessoasPage() {
  const { pessoas, setPessoas, saveDraft, salvarPlano, objetivo, setObjetivo, cenario, planoId, calcularBackend, calculating, isDraftLoading, progressoAtual, progressoAtualPorPessoa } = usePlanLogic();
  
  const totalObjetivo = Number(objetivo?.valorJaGuardado ?? 0);
  
  const isLoading = isDraftLoading;

  const { user } = useAuth();
  const router = useRouter();
  const wasInitialized = useRef(false);

  useEffect(() => {
    if (pessoas.length > 0) {
      wasInitialized.current = true;
    }
  }, [pessoas.length]);

  // Redirect if missing step 1
  useEffect(() => {
    if (planoId && (!objetivo || !objetivo.valorImovel || objetivo.valorImovel === 0)) {
      const paths: Record<string, string> = {
        entrada: "/app/imovel",
        pronto: "/app/pronto",
        planta: "/app/planta"
      };
      router.replace(paths[cenario] || "/app/imovel");
    }
  }, [planoId, objetivo, cenario, router]);

  useEffect(() => {
    if (pessoas.length === 0 && user && planoId && !wasInitialized.current) {
      const defaultPessoa: Pessoa = {
        id: generateObjectId(),
        nome: user.name || "Eu",
        renda_mensal: 0,
        renda_complementar: 0,
        gastos_mensais: 0,
        usar_gastos_detalhados: false,
        gastos_detalhados: [],
        aporte_mensal: 0,
        valorInicial: totalObjetivo,
      };
      setPessoas([defaultPessoa]);
      saveDraft({ pessoas: [defaultPessoa] });
    }
  }, [user, pessoas.length, setPessoas, planoId, saveDraft, totalObjetivo]);

  const prosseguir = async () => {
    try {
      const savedId = await salvarPlano();
      // usa != null para também capturar undefined (falha silenciosa)
      if (savedId != null) {
        if (!savedId.startsWith("local-draft")) {
          // Cálculo da simulação não deve bloquear a navegação
          calcularBackend(savedId).catch((calcErr) => {
            console.warn("[prosseguir] Erro ao calcular simulação (não crítico):", calcErr);
          });
        }
        router.push("/app/planejamento");
      } else {
        toast.error("Erro ao salvar os dados. Tente novamente.");
      }
    } catch (error) {
      console.error("[prosseguir] Erro inesperado ao salvar:", error);
      toast.error("Erro ao salvar os dados. Tente novamente.");
    }
  };
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ 
    nome: "", 
    renda_mensal: 0 as number | "", 
    renda_complementar: 0 as number | "", 
    gastos_mensais: 0 as number | "",
    usar_gastos_detalhados: false,
    gastos_detalhados: [] as GastoDetalhado[],
    valorInicial: 0 as number | "",
    tipoInvestimento: "",
    aporte_mensal: 0 as number | "",
  });
  const [novoGastoForm, setNovoGastoForm] = useState({ nome: "", valor: 0 as number | "" });
  const [pessoaParaRemover, setPessoaParaRemover] = useState<string | null>(null);

  const taxaCdiAnual = Number(objetivo?.taxaCdiAnual ?? 10.5);

  const adicionarGastoForm = () => {
    if (!novoGastoForm.nome || !novoGastoForm.valor) return;
    const newGastos = [
      ...form.gastos_detalhados,
      { id: Math.random().toString(), nome: novoGastoForm.nome, valor: Number(novoGastoForm.valor) || 0 }
    ];
    const gastosTotais = newGastos.reduce((acc, g) => acc + Number(g.valor), 0);
    const novaSobra = (Number(form.renda_mensal) || 0) + (Number(form.renda_complementar) || 0) - gastosTotais;
    setForm({
      ...form,
      gastos_detalhados: newGastos,
      aporte_mensal: Math.max(0, novaSobra)
    });
    setNovoGastoForm({ nome: "", valor: 0 });
  };

  const removerGastoForm = (id: string) => {
    const newGastos = form.gastos_detalhados.filter(g => g.id !== id);
    const gastosTotais = newGastos.reduce((acc, g) => acc + Number(g.valor), 0);
    const novaSobra = (Number(form.renda_mensal) || 0) + (Number(form.renda_complementar) || 0) - gastosTotais;
    setForm({
      ...form,
      gastos_detalhados: newGastos,
      aporte_mensal: Math.max(0, novaSobra)
    });
  };

  const atualizarGastoForm = (gId: string, patch: Partial<GastoDetalhado>) => {
    const newGastos = form.gastos_detalhados.map(g => g.id === gId ? { ...g, ...patch } : g);
    const gastosTotais = newGastos.reduce((acc, g) => acc + Number(g.valor), 0);
    const novaSobra = (Number(form.renda_mensal) || 0) + (Number(form.renda_complementar) || 0) - gastosTotais;
    setForm({ ...form, gastos_detalhados: newGastos, aporte_mensal: Math.max(0, novaSobra) });
  };

  const handleUpdateRendaForm = (field: 'renda_mensal' | 'renda_complementar', value: number | "") => {
    const numValue = value === "" ? 0 : value;
    const gastosTotais = form.usar_gastos_detalhados
      ? form.gastos_detalhados.reduce((acc, g) => acc + Number(g.valor), 0)
      : Number(form.gastos_mensais || 0);
    const novaSobra = (field === 'renda_mensal' ? numValue : Number(form.renda_mensal || 0)) +
                      (field === 'renda_complementar' ? numValue : Number(form.renda_complementar || 0)) -
                      gastosTotais;
    setForm({ ...form, [field]: numValue, aporte_mensal: Math.max(0, novaSobra) });
  };

  const handleUpdateGastosDiretosForm = (value: number | "") => {
    const numValue = value === "" ? 0 : value;
    const novaSobra = (Number(form.renda_mensal) || 0) + (Number(form.renda_complementar) || 0) - numValue;
    setForm({ ...form, gastos_mensais: numValue, aporte_mensal: Math.max(0, novaSobra) });
  };

  const resetForm = () => ({
    nome: "",
    renda_mensal: 0 as number | "",
    renda_complementar: 0 as number | "",
    gastos_mensais: 0 as number | "",
    usar_gastos_detalhados: false,
    gastos_detalhados: [] as GastoDetalhado[],
    valorInicial: 0 as number | "",
    tipoInvestimento: "",
    aporte_mensal: 0 as number | "",
  });

  const adicionar = () => {
    if (!form.nome) return;
    const gastosTotais = calcularGastos(form);
    const rendaTotal = (Number(form.renda_mensal) || 0) + (Number(form.renda_complementar) || 0);
    const sobra = Math.max(0, rendaTotal - gastosTotais);

    // Balances are individually owned. Adding someone must not change the
    // values already assigned to other participants.
    const formValorInicial = Number(form.valorInicial) || 0;
    const novoTotalObjetivo = formValorInicial > 0 ? totalObjetivo + formValorInicial : totalObjetivo;

    const novaPessoa: Pessoa = {
      id: generateObjectId(),
      nome: form.nome,
      renda_mensal: Number(form.renda_mensal) || 0,
      renda_complementar: Number(form.renda_complementar) || 0,
      gastos_mensais: form.usar_gastos_detalhados ? gastosTotais : (Number(form.gastos_mensais) || 0),
      usar_gastos_detalhados: form.usar_gastos_detalhados,
      gastos_detalhados: form.gastos_detalhados,
      aporte_mensal: Number(form.aporte_mensal) || Math.round(sobra),
      valorInicial: formValorInicial,
      valorAtual: formValorInicial,
      dataValorAtual: new Date().toISOString(),
      tipoInvestimento: form.tipoInvestimento || undefined,
    };

    setPessoas([...pessoas, novaPessoa]);
    setObjetivo(prev => prev ? { ...prev, valorJaGuardado: novoTotalObjetivo } : prev);
    setForm(resetForm());
    setNovoGastoForm({ nome: "", valor: 0 });
    setShowAddForm(false);
  };

  const confirmarRemocao = (id: string) => {
    setPessoaParaRemover(id);
  };

  const efetivarRemocao = () => {
    if (pessoaParaRemover) {
      const remainingPeople = pessoas.filter((p) => p.id !== pessoaParaRemover);

      setPessoas(remainingPeople);
      setObjetivo(prev => prev ? {
        ...prev,
        valorJaGuardado: remainingPeople.reduce((sum, p) => sum + Number(p.valorAtual ?? p.valorInicial ?? 0), 0),
      } : prev);

      setPessoaParaRemover(null);
    }
  };

  const atualizarPessoa = (pId: string, patch: Partial<Pessoa>) => {
    setPessoas((prev) => {
      const arr = [...prev];
      const idx = arr.findIndex(p => p.id === pId);
      if (idx === -1) return prev;

      const updated = { ...arr[idx], ...patch };

      if (updated.usar_gastos_detalhados && patch.gastos_detalhados !== undefined) {
        updated.gastos_mensais = calcularGastos(updated);
      } else if (patch.usar_gastos_detalhados !== undefined) {
        updated.gastos_mensais = calcularGastos(updated);
      }

      if (patch.valorInicial !== undefined || patch.valorAtual !== undefined) {
        const novoValor = patch.valorAtual !== undefined ? patch.valorAtual : (patch.valorInicial ?? 0);
        updated.valorInicial = patch.valorInicial !== undefined ? patch.valorInicial : novoValor;
        updated.valorAtual = patch.valorAtual !== undefined ? patch.valorAtual : novoValor;
        if (!patch.dataValorAtual && !updated.dataValorAtual) {
          updated.dataValorAtual = new Date().toISOString();
        } else if (patch.dataValorAtual) {
          updated.dataValorAtual = patch.dataValorAtual;
        }

        const newSum = arr.reduce((s, p, i) => {
          const val = i === idx ? (updated.valorAtual ?? updated.valorInicial ?? 0) : (p.valorAtual ?? p.valorInicial ?? 0);
          return s + (val || 0);
        }, 0);
        setObjetivo(prev => prev ? { ...prev, valorJaGuardado: newSum } : null);
      }

      arr[idx] = updated;
      return arr;
    });
  };

  const gastosTotaisForm = calcularGastos(form);
  const sobraForm = ((Number(form.renda_mensal) || 0) + (Number(form.renda_complementar) || 0)) - gastosTotaisForm;

  if (isLoading) {
    return <PessoasPageSkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up pb-8">
      <div className="animate-fade-in-up" style={{ animationDelay: "0ms" }}>
        <p className="text-xs uppercase tracking-widest text-orange-500 font-medium mb-1 flex items-center gap-2">
          <Users className="h-4 w-4" /> Etapa 2 de 4
        </p>
        <h1 className="font-display text-2xl md:text-3xl mb-1 font-normal">Quem está nessa?</h1>
        <p className="text-muted-foreground text-sm">Cadastre você e seu par. Peça mais informações e detalhe os gastos para maior precisão.</p>
      </div>

      {/* Grid de Participantes: Uma pessoa do lado da outra */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 items-start animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          {pessoas.map((p, index) => (
            <PessoaCard 
              key={p.id} 
              p={p} 
              index={index}
              totalGuardadoObjetivo={progressoAtual > 0 ? progressoAtual : totalObjetivo}
              progressoAtual={progressoAtualPorPessoa[p.id] ?? Number(p.valorAtual ?? p.valorInicial ?? 0)}
              taxaCdiAnual={taxaCdiAnual}
              remover={confirmarRemocao} 
              atualizarPessoa={atualizarPessoa} 
            />
          ))}

          {!showAddForm ? (
            <Card 
              onClick={() => setShowAddForm(true)}
              className="bg-white/80 dark:bg-card/80 p-5 sm:p-6 border-2 border-dashed border-border/60 hover:border-accent/50 hover:bg-white dark:hover:bg-card cursor-pointer transition-all flex flex-col items-center justify-center min-h-[160px] text-muted-foreground hover:text-foreground group rounded-2xl shadow-soft"
            >
              <div className="h-10 w-10 rounded-xl bg-secondary/80 group-hover:bg-accent/10 grid place-items-center mb-2.5 transition-colors">
                <Plus className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
              </div>
              <h3 className="font-display text-base sm:text-lg font-semibold text-foreground">Adicionar participante</h3>
              <p className="text-xs text-center mt-1 max-w-[280px] text-muted-foreground">
                Adicione outra pessoa para somar renda e planejar juntos a entrada do imóvel.
              </p>
            </Card>
          ) : (
            <Card className="bg-white dark:bg-card p-4 sm:p-5 border border-border/60 rounded-2xl shadow-soft space-y-4 relative animate-fade-in-up">
              <button 
                onClick={() => {
                  setShowAddForm(false);
                  setForm(resetForm());
                }}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                title="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
              <div>
                <h3 className="font-display text-lg font-bold">Adicionar participante</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Preencha a renda e informe as despesas para somar a capacidade financeira.
                </p>
              </div>
              
              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">Nome da pessoa</Label>
                  <Input placeholder="Ex: Maria" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className="h-10" />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-foreground">Renda Principal</Label>
                    <MoneyInput variant="money" min={0} value={form.renda_mensal}
                      onChange={(v) => handleUpdateRendaForm('renda_mensal', v)} placeholder="Salário líquido" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-foreground">Renda Extra</Label>
                    <MoneyInput variant="money" min={0} value={form.renda_complementar}
                      onChange={(v) => handleUpdateRendaForm('renda_complementar', v)} placeholder="Freelance, bônus" />
                  </div>
                </div>

                <div className="bg-secondary/20 rounded-xl p-3.5 border border-border/40 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Despesas Mensais</Label>
                    <div className="flex bg-secondary border border-border/60 rounded-lg p-0.5 shadow-2xs">
                      <button
                        onClick={() => {
                          const novoModo = false;
                          setForm({ ...form, usar_gastos_detalhados: novoModo });
                          const gastosTotais = novoModo
                            ? form.gastos_detalhados.reduce((acc, g) => acc + Number(g.valor), 0)
                            : Number(form.gastos_mensais || 0);
                          const novaSobra = (Number(form.renda_mensal) || 0) + (Number(form.renda_complementar) || 0) - gastosTotais;
                          setForm(prev => ({ ...prev, aporte_mensal: Math.max(0, novaSobra) }));
                        }}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition-all cursor-pointer ${!form.usar_gastos_detalhados ? 'bg-white dark:bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        Valor Direto
                      </button>
                      <button
                        onClick={() => {
                          const novoModo = true;
                          setForm({ ...form, usar_gastos_detalhados: novoModo });
                          const gastosTotais = novoModo
                            ? form.gastos_detalhados.reduce((acc, g) => acc + Number(g.valor), 0)
                            : Number(form.gastos_mensais || 0);
                          const novaSobra = (Number(form.renda_mensal) || 0) + (Number(form.renda_complementar) || 0) - gastosTotais;
                          setForm(prev => ({ ...prev, aporte_mensal: Math.max(0, novaSobra) }));
                        }}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition-all cursor-pointer ${form.usar_gastos_detalhados ? 'bg-white dark:bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        Detalhar
                      </button>
                    </div>
                  </div>

                  {!form.usar_gastos_detalhados ? (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-foreground">Total de Despesas do Mês</Label>
                      <MoneyInput variant="money" min={0} value={form.gastos_mensais}
                        onChange={(v) => handleUpdateGastosDiretosForm(v)} placeholder="Contas, moradia..." />
                    </div>
                  ) : (
                    <div className="space-y-3 pt-1">
                      {form.gastos_detalhados.map(g => (
                        <div key={g.id} className="flex items-center gap-2 bg-white dark:bg-card p-2 rounded-xl border border-border/60 shadow-2xs">
                          <Input 
                            value={g.nome} 
                            onChange={(e) => atualizarGastoForm(g.id, { nome: e.target.value })} 
                            className="flex-1 bg-transparent border-none focus-visible:ring-0 text-xs sm:text-sm font-medium px-2 h-8"
                            placeholder="Nome do gasto"
                          />
                          <div className="w-28 sm:w-32 shrink-0">
                            <MoneyInput 
                              variant="money" 
                              min={0} 
                              value={g.valor} 
                              onChange={(v) => atualizarGastoForm(g.id, { valor: Number(v) || 0 })} 
                              className="bg-secondary/40 border-none focus-visible:ring-0 text-right h-8 text-xs sm:text-sm font-semibold"
                            />
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer" onClick={() => removerGastoForm(g.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                      <div className="flex gap-2 items-end pt-1">
                        <div className="flex-1 space-y-1">
                          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Descrição</Label>
                          <Input placeholder="Ex: Aluguel" className="h-9 text-xs" value={novoGastoForm.nome} onChange={e => setNovoGastoForm({...novoGastoForm, nome: e.target.value})} />
                        </div>
                        <div className="w-28 sm:w-32 shrink-0 space-y-1">
                          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Valor</Label>
                          <MoneyInput variant="money" min={0} placeholder="R$" className="h-9 text-xs" value={novoGastoForm.valor} onChange={v => setNovoGastoForm({...novoGastoForm, valor: v})} />
                        </div>
                        <Button size="icon" className="h-9 w-9 bg-accent text-accent-foreground shrink-0 rounded-xl shadow-xs hover:bg-accent/90 transition-all cursor-pointer" onClick={adicionarGastoForm} disabled={!novoGastoForm.nome || !novoGastoForm.valor}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex justify-between items-center pt-2 px-1 text-xs">
                        <span className="text-muted-foreground font-medium">Total das despesas</span>
                        <span className="font-bold text-destructive num">{brl(gastosTotaisForm)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Fluxo Mensal: Sobra e Aporte Planejado */}
                <div className="bg-secondary/20 rounded-xl p-3.5 sm:p-4 border border-border/40 space-y-3">
                  <div className="flex items-center justify-between pb-2.5 border-b border-border/40 gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Wallet className="h-3.5 w-3.5 text-accent" />
                        <span>Sobra Líquida Estimada</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Renda − Despesas
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`font-display text-lg sm:text-xl font-bold num ${sobraForm >= 0 ? "text-success" : "text-destructive"}`}>
                        {brl(sobraForm)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-accent" />
                        <span>Aporte Mensal Planejado</span>
                      </Label>
                      {sobraForm > 0 && Number(form.aporte_mensal) !== sobraForm && (
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, aporte_mensal: Math.max(0, sobraForm) })}
                          className="text-[11px] font-semibold text-accent hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <Sparkles className="h-3 w-3" /> Usar sobra ({brl(sobraForm)})
                        </button>
                      )}
                    </div>
                    <MoneyInput
                      variant="money"
                      min={0}
                      value={form.aporte_mensal}
                      onChange={(v) => setForm({ ...form, aporte_mensal: v })}
                      placeholder="Deixe em branco para usar a sobra"
                    />
                  </div>
                </div>

                {/* Reserva Atual (Já Guardado) */}
                <div className="bg-secondary/20 rounded-xl p-3.5 sm:p-4 border border-border/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Coins className="h-3.5 w-3.5 text-accent" />
                      <span>Já Guardado Hoje</span>
                    </p>
                    <span className="text-[11px] text-muted-foreground">Patrimônio acumulado</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-foreground">Valor Acumulado</Label>
                      <MoneyInput
                        variant="money"
                        min={0}
                        value={form.valorInicial}
                        onChange={(v) => setForm({ ...form, valorInicial: v })}
                        placeholder="0,00"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-foreground">Onde está aplicado?</Label>
                      <div className="relative">
                        <select
                          value={form.tipoInvestimento || "cdb_100"}
                          onChange={(e) => setForm({ ...form, tipoInvestimento: e.target.value })}
                          className="w-full h-10 rounded-xl border border-border bg-background px-3 pr-8 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 cursor-pointer transition-colors hover:border-accent/40"
                        >
                          <option value="cdb_100">CDB 100% CDI</option>
                          <option value="tesouro_selic">Tesouro Selic</option>
                          <option value="poupanca">Poupança</option>
                          <option value="lci_lca">LCI / LCA</option>
                          <option value="fundo_di">Fundo DI</option>
                          <option value="conta_corrente">Conta Corrente</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 pt-2">
                <Button 
                  onClick={() => {
                    setShowAddForm(false);
                    setForm(resetForm());
                  }} 
                  variant="outline" 
                  className="flex-1 h-10 rounded-xl"
                >
                  Cancelar
                </Button>
                <Button onClick={adicionar} className="flex-1 bg-gradient-warm text-accent-foreground hover:opacity-90 h-10 rounded-xl" disabled={!form.nome}>
                  <Plus className="h-4 w-4 mr-1" /> Adicionar
                </Button>
              </div>
            </Card>
          )}
        </div>



      {/* Card Rodapé CTA */}
      <Card className="p-4 sm:p-5 bg-gradient-ink text-primary-foreground shadow-elevated rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest opacity-70 font-medium">Tudo pronto?</p>
          <p className="font-display text-xl sm:text-2xl mt-0.5">Continue para o planejamento</p>
          <p className="text-xs opacity-70 mt-0.5">Calcularemos a projeção mês a mês e o tempo até a compra.</p>
        </div>
        <Button
          onClick={prosseguir}
          disabled={calculating || pessoas.length === 0}
          className="bg-gradient-warm text-accent-foreground hover:opacity-90 w-full sm:w-auto h-11 px-5"
        >
          {calculating ? "Salvando..." : "Ir para o Planejamento"} <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Card>

      {pessoaParaRemover && typeof document !== "undefined" && createPortal(
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div 
            className="relative w-full max-w-md rounded-2xl border border-border/70 bg-white dark:bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-card-foreground overflow-hidden"
          >
            {/* Linha decorativa de topo */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-destructive" />

            {/* Botão Fechar */}
            <button
              type="button"
              onClick={() => setPessoaParaRemover(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
              title="Fechar"
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
                  Remover participante?
                </h3>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  Tem certeza que deseja remover <strong className="text-foreground font-semibold">{pessoas.find(p => p.id === pessoaParaRemover)?.nome || "este participante"}</strong> do planejamento?
                </p>
              </div>
            </div>

            {/* Alerta de consequência */}
            <div className="mt-4 p-3 rounded-xl bg-destructive/5 border border-destructive/15 text-xs text-destructive/90 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-destructive" />
              <span className="leading-relaxed">
                As rendas e aportes deste participante deixarão de compor os cálculos da entrada e do prazo do imóvel.
              </span>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-3 mt-6">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1 h-11 rounded-xl font-medium border-border/70 hover:bg-secondary/80" 
                onClick={() => setPessoaParaRemover(null)}
              >
                Cancelar
              </Button>
              <Button 
                type="button" 
                variant="destructive" 
                className="flex-1 h-11 rounded-xl font-medium shadow-sm hover:opacity-95 flex items-center justify-center gap-2" 
                onClick={efetivarRemocao}
              >
                <Trash2 className="h-4 w-4" />
                <span>Sim, remover</span>
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
