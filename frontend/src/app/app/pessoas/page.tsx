"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlanContext, type Pessoa, type GastoDetalhado } from "@/context/PlanContext";
import PessoaCard from "@/components/PessoaCard";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/MoneyInput";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { brl } from "@/lib/finance";
import { Plus, Trash2, ArrowRight, X, Wallet, Pencil, Check } from "lucide-react";

const calcularGastos = (p: { usar_gastos_detalhados?: boolean; gastos_detalhados?: GastoDetalhado[]; gastos_mensais?: number | "" }) => {
  return p.usar_gastos_detalhados 
    ? (p.gastos_detalhados || []).reduce((acc, g) => acc + Number(g.valor), 0)
    : Number(p.gastos_mensais || 0);
};

export default function PessoasPage() {
  const { pessoas, setPessoas, saveDraft, objetivo, setObjetivo, cenario, planoId } = usePlanContext();
  
  const [isEditingTotal, setIsEditingTotal] = useState(false);
  const totalObjetivo = Number(objetivo?.valorJaGuardado ?? 0);
  const sumValores = pessoas.reduce((s, p) => s + (p.valorInicial ?? 0), 0);
  const diffTotal = totalObjetivo - sumValores;
  
  const { user } = useAuth();
  const router = useRouter();

  // Redirect if missing step 1
  useEffect(() => {
    if (planoId && (!objetivo || !objetivo.valorImovel || objetivo.valorImovel === 0)) {
      const paths: Record<string, string> = {
        entrada: "/app/objetivo",
        pronto: "/app/pronto",
        planta: "/app/planta"
      };
      router.replace(paths[cenario] || "/app/objetivo");
    }
  }, [planoId, objetivo, cenario, router]);

  // Pre-load distribution (50/50) if values are 0 (e.g., old drafts)
  useEffect(() => {
    if (pessoas.length > 0 && totalObjetivo > 0) {
      const sum = pessoas.reduce((s, p) => s + (p.valorInicial ?? 0), 0);
      if (sum === 0) {
        const perPerson = totalObjetivo / pessoas.length;
        setPessoas(prev => prev.map(p => ({ ...p, valorInicial: perPerson })));
      }
    }
  }, [pessoas.length, totalObjetivo, setPessoas]);

  useEffect(() => {
    if (pessoas.length === 0 && user && planoId) {
      const defaultPessoa: Pessoa = {
        id: "user-" + user.id,
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
  }, [user, pessoas.length, setPessoas, planoId, saveDraft]);

  const prosseguir = async () => {
    const success = await saveDraft();
    if (success) {
      router.push("/app/planejamento");
    } else {
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
    gastos_detalhados: [] as GastoDetalhado[]
  });
  const [novoGastoForm, setNovoGastoForm] = useState({ nome: "", valor: 0 as number | "" });
  const [pessoaParaRemover, setPessoaParaRemover] = useState<string | null>(null);

  const sobraTotal = pessoas.reduce((s, p) => s + (Number(p.renda_mensal) + Number(p.renda_complementar || 0) - calcularGastos(p)), 0);

  const adicionarGastoForm = () => {
    if (!novoGastoForm.nome || !novoGastoForm.valor) return;
    setForm({
      ...form,
      gastos_detalhados: [
        ...form.gastos_detalhados,
        { id: Math.random().toString(), nome: novoGastoForm.nome, valor: Number(novoGastoForm.valor) || 0 }
      ]
    });
    setNovoGastoForm({ nome: "", valor: 0 });
  };

  const removerGastoForm = (id: string) => {
    setForm({
      ...form,
      gastos_detalhados: form.gastos_detalhados.filter(g => g.id !== id)
    });
  };

  const atualizarGastoForm = (gId: string, patch: Partial<GastoDetalhado>) => {
    const newGastos = form.gastos_detalhados.map(g => g.id === gId ? { ...g, ...patch } : g);
    setForm({ ...form, gastos_detalhados: newGastos });
  };

  const adicionar = () => {
    if (!form.nome) return;
    const gastosTotais = calcularGastos(form);
    const sobra = Math.max(0, (Number(form.renda_mensal) || 0) + (Number(form.renda_complementar) || 0) - gastosTotais);
    
    const allPeople = [...pessoas];
    const perPerson = (allPeople.length + 1) > 0 ? totalObjetivo / (allPeople.length + 1) : 0;
    
    const updatedPeople = allPeople.map(p => ({ ...p, valorInicial: perPerson }));
    
    const novaPessoa: Pessoa = {
      id: Math.random().toString(),
      nome: form.nome,
      renda_mensal: Number(form.renda_mensal) || 0,
      renda_complementar: Number(form.renda_complementar) || 0,
      gastos_mensais: form.usar_gastos_detalhados ? gastosTotais : (Number(form.gastos_mensais) || 0),
      usar_gastos_detalhados: form.usar_gastos_detalhados,
      gastos_detalhados: form.gastos_detalhados,
      aporte_mensal: Math.round(sobra * 0.5),
      valorInicial: perPerson,
    };
    
    setPessoas([...updatedPeople, novaPessoa]);
    setForm({ nome: "", renda_mensal: 0, renda_complementar: 0, gastos_mensais: 0, usar_gastos_detalhados: false, gastos_detalhados: [] });
    setNovoGastoForm({ nome: "", valor: 0 });
    setShowAddForm(false);
  };

  const confirmarRemocao = (id: string) => {
    setPessoaParaRemover(id);
  };

  const efetivarRemocao = () => {
    if (pessoaParaRemover) {
      const remainingPeople = pessoas.filter((p) => p.id !== pessoaParaRemover);
      const perPerson = remainingPeople.length > 0 ? totalObjetivo / remainingPeople.length : 0;
      
      setPessoas(remainingPeople.map(p => ({ ...p, valorInicial: perPerson })));
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
      
      if (patch.valorInicial !== undefined) {
         updated.valorInicial = patch.valorInicial;
         const newSum = arr.reduce((s, p, i) => s + (i === idx ? patch.valorInicial! : (p.valorInicial || 0)), 0);
         setObjetivo(prev => prev ? { ...prev, valorJaGuardado: newSum } : null);
      }
      
      arr[idx] = updated;
      return arr;
    });
  };

  const handleUpdateTotal = (novoTotal: number | "") => {
    const val = novoTotal === "" ? 0 : novoTotal;
    setObjetivo(prev => prev ? { ...prev, valorJaGuardado: val } : null);
    
    const currentTotal = pessoas.reduce((s, p) => s + (p.valorInicial ?? 0), 0) || 1;
    setPessoas(pessoas.map(p => {
       const perc = (p.valorInicial ?? 0) / currentTotal;
       return { ...p, valorInicial: val * perc };
    }));
  };

  const gastosTotaisForm = calcularGastos(form);
  const sobraForm = ((Number(form.renda_mensal) || 0) + (Number(form.renda_complementar) || 0)) - gastosTotaisForm;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in-up">
      <div>
        <p className="text-xs uppercase tracking-widest text-accent font-medium mb-2">Etapa 2 de 4</p>
        <h1 className="font-display text-4xl md:text-5xl mb-2">Quem está nessa?</h1>
        <p className="text-muted-foreground text-lg">Cadastre você e seu par. Peça mais informações e detalhe os gastos para maior precisão.</p>
      </div>

      {/* Nova Barra de Resumo de Valor Guardado */}
      <Card className="p-5 shadow-soft border-border/60 bg-secondary/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-hidden relative group">
        <div className="absolute -left-10 -bottom-10 h-32 w-32 bg-accent/10 rounded-full blur-2xl group-hover:bg-accent/20 transition-colors duration-700" />
        
        <div className="relative z-10 flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Total Já Guardado (Vindo da Etapa 1)
            </span>
            <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-foreground" onClick={() => setIsEditingTotal(!isEditingTotal)}>
              <Pencil className="h-3 w-3" />
            </Button>
          </div>
          {isEditingTotal ? (
            <div className="flex items-center gap-2 mt-1">
              <MoneyInput 
                variant="money" 
                min={0} 
                value={totalObjetivo} 
                onChange={handleUpdateTotal} 
                className="font-display text-3xl font-semibold h-10 w-48"
              />
              <Button onClick={() => setIsEditingTotal(false)} size="sm" className="bg-primary text-primary-foreground">
                <Check className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <span className="font-display text-3xl text-foreground font-semibold">
              {brl(totalObjetivo)}
            </span>
          )}
          {Math.abs(diffTotal) > 0.01 && !isEditingTotal && pessoas.length > 2 && (
            <span className="text-xs text-destructive mt-2 font-medium bg-destructive/10 px-2 py-0.5 rounded-full inline-flex w-fit">
              A soma difere do total em {brl(Math.abs(diffTotal))}
            </span>
          )}
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3 w-full md:w-auto">
          {pessoas.map((p, idx) => {
            const perc = totalObjetivo > 0 ? ((p.valorInicial ?? 0) / totalObjetivo) * 100 : 0;
            return (
              <div key={p.id} className="flex items-center gap-2 bg-background/80 border border-border/50 px-4 py-2.5 rounded-xl shadow-sm backdrop-blur-md transition-all hover:border-accent/40 hover:shadow-md">
                <div className="h-7 w-7 rounded-full bg-secondary grid place-items-center">
                  <span className="font-display text-xs font-bold">{p.nome.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-muted-foreground leading-tight">{p.nome}</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-semibold text-sm num">{brl(p.valorInicial ?? 0)}</span>
                    <span className="text-[10px] text-accent font-medium">({perc.toFixed(1)}%)</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {pessoas.map((p, index) => (
          <PessoaCard 
            key={p.id} 
            p={p} 
            index={index}
            totalGuardadoObjetivo={totalObjetivo}
            remover={confirmarRemocao} 
            atualizarPessoa={atualizarPessoa} 
          />
        ))}

        {!showAddForm ? (
          <Card 
            onClick={() => setShowAddForm(true)}
            className="glass p-8 border-2 border-dashed border-border/60 hover:border-accent/50 hover:bg-secondary/20 cursor-pointer transition-all flex flex-col items-center justify-center min-h-[360px] text-muted-foreground hover:text-foreground group rounded-xl"
          >
            <div className="h-14 w-14 rounded-full bg-secondary/80 group-hover:bg-accent/10 grid place-items-center mb-4 transition-colors">
              <Plus className="h-6 w-6 text-muted-foreground group-hover:text-accent transition-colors" />
            </div>
            <h3 className="font-display text-xl font-semibold text-foreground">Adicionar participante</h3>
            <p className="text-sm text-center mt-2 max-w-[260px] text-muted-foreground">
              Adicione outra pessoa para somar renda e planejar juntos a entrada do imóvel.
            </p>
          </Card>
        ) : (
          <Card className="p-6 border-dashed shadow-none space-y-4 relative animate-fade-in-up">
            <button 
              onClick={() => {
                setShowAddForm(false);
                setForm({ nome: "", renda_mensal: 0, renda_complementar: 0, gastos_mensais: 0, usar_gastos_detalhados: false, gastos_detalhados: [] });
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            <div>
              <h3 className="font-display text-lg">Adicionar pessoa</h3>
              <p className="text-xs text-muted-foreground mt-1 mb-3">
                Preencha a renda e escolha se prefere informar as despesas de forma direta ou detalhada.
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="text-xs">Nome</Label>
                <Input placeholder="Ex: João" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Renda Principal</Label>
                  <MoneyInput variant="money" min={0} value={form.renda_mensal}
                    onChange={(v) => setForm({ ...form, renda_mensal: v })} placeholder="Salário" />
                </div>
                <div>
                  <Label className="text-xs">Renda Extra</Label>
                  <MoneyInput variant="money" min={0} value={form.renda_complementar}
                    onChange={(v) => setForm({ ...form, renda_complementar: v })} placeholder="Freelance, etc" />
                </div>
              </div>

              <div className="pt-2 border-t border-border/50">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium">Como informar as despesas?</Label>
                  <div className="flex bg-secondary rounded-lg p-1">
                    <button 
                      onClick={() => setForm({ ...form, usar_gastos_detalhados: false })}
                      className={`text-xs px-3 py-1.5 rounded-md transition-colors ${!form.usar_gastos_detalhados ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground'}`}
                    >
                      Valor Direto
                    </button>
                    <button 
                      onClick={() => setForm({ ...form, usar_gastos_detalhados: true })}
                      className={`text-xs px-3 py-1.5 rounded-md transition-colors ${form.usar_gastos_detalhados ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground'}`}
                    >
                      Detalhado
                    </button>
                  </div>
                </div>

                {!form.usar_gastos_detalhados ? (
                  <div>
                    <Label className="text-xs">Despesas Mensais (Total)</Label>
                    <MoneyInput variant="money" min={0} value={form.gastos_mensais}
                      onChange={(v) => setForm({ ...form, gastos_mensais: v })} placeholder="Contas, lazer..." />
                  </div>
                ) : (
                  <div className="space-y-3 bg-secondary/30 p-3 rounded-xl border border-border/50">
                    {form.gastos_detalhados.map(g => (
                      <div key={g.id} className="flex items-center gap-2 bg-background p-2 rounded-lg border border-border/50">
                        <Input 
                          value={g.nome} 
                          onChange={(e) => atualizarGastoForm(g.id, { nome: e.target.value })} 
                          className="h-8 text-xs flex-1 bg-transparent"
                          placeholder="Nome do gasto"
                        />
                        <div className="w-24">
                          <MoneyInput 
                            variant="money" 
                            min={0} 
                            value={g.valor} 
                            onChange={(v) => atualizarGastoForm(g.id, { valor: Number(v) || 0 })} 
                            className="h-8 text-xs"
                          />
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removerGastoForm(g.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Descrição</Label>
                        <Input placeholder="Ex: Aluguel" className="h-9 text-sm" value={novoGastoForm.nome} onChange={e => setNovoGastoForm({...novoGastoForm, nome: e.target.value})} />
                      </div>
                      <div className="w-32">
                        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Valor</Label>
                        <MoneyInput variant="money" min={0} placeholder="R$" className="h-9 text-sm" value={novoGastoForm.valor} onChange={v => setNovoGastoForm({...novoGastoForm, valor: v})} />
                      </div>
                      <Button size="icon" className="h-9 w-9 bg-primary" onClick={adicionarGastoForm} disabled={!novoGastoForm.nome || !novoGastoForm.valor}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex justify-between items-center pt-2 px-1">
                      <span className="text-xs text-muted-foreground">Total das despesas</span>
                      <span className="font-display text-lg">{brl(gastosTotaisForm)}</span>
                    </div>
                  </div>
                )}
              </div>

              {form.nome && (
                <div className={`p-3 rounded-xl flex justify-between items-center transition-colors ${sobraForm >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                  <span className="text-xs font-medium uppercase tracking-wider">Sobra Estimada</span>
                  <span className="font-display text-xl num">{brl(sobraForm)}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3 pt-2">
              <Button 
                onClick={() => {
                  setShowAddForm(false);
                  setForm({ nome: "", renda_mensal: 0, renda_complementar: 0, gastos_mensais: 0, usar_gastos_detalhados: false, gastos_detalhados: [] });
                }} 
                variant="outline" 
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button onClick={adicionar} className="flex-1 bg-gradient-warm text-accent-foreground hover:opacity-90 shadow-glow" disabled={!form.nome}>
                <Plus className="h-4 w-4 mr-1" /> Adicionar
              </Button>
            </div>
          </Card>
        )}
      </div>

      {pessoas.length > 0 && (
        <Card className="p-6 bg-gradient-ink text-primary-foreground shadow-elevated flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest opacity-70">Sobra total projetada</p>
            <p className="font-display text-3xl md:text-4xl num mt-1">{brl(sobraTotal)}</p>
            <p className="text-xs opacity-70 mt-1">Este valor será usado como base para os aportes no plano.</p>
          </div>
          <Button onClick={prosseguir} className="bg-gradient-warm text-accent-foreground hover:opacity-90 w-full sm:w-auto h-12 px-6">
            Ir para o Plano <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Card>
      )}

      {pessoaParaRemover && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <Card className="max-w-md w-full p-6 shadow-xl border-border/50 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <Trash2 className="h-6 w-6 text-destructive" />
              </div>
              <div className="space-y-2">
                <h3 className="font-display text-xl">Remover pessoa?</h3>
                <p className="text-sm text-muted-foreground">
                  Tem certeza que deseja remover <strong>{pessoas.find(p => p.id === pessoaParaRemover)?.nome || "esta pessoa"}</strong> do planejamento? Esta ação não poderá ser desfeita.
                </p>
              </div>
              <div className="flex items-center gap-3 w-full pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setPessoaParaRemover(null)}>
                  Cancelar
                </Button>
                <Button variant="destructive" className="flex-1" onClick={efetivarRemocao}>
                  Remover
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
