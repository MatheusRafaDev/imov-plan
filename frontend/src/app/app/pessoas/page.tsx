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
import { Plus, Trash2, ArrowRight, User, Calculator, ListTodo, Briefcase, Pencil, X, Check } from "lucide-react";

const calcularGastos = (p: Partial<Pessoa>) => {
  return p.usar_gastos_detalhados 
    ? (p.gastos_detalhados || []).reduce((acc, g) => acc + Number(g.valor), 0)
    : Number(p.gastos_mensais || 0);
};

export default function PessoasPage() {
  const { pessoas, setPessoas, saveDraft, objetivo, cenario, planoId } = usePlanContext();
  // Valor já guardado calculations
  const totalGuardado = pessoas.reduce((s, p) => s + (p.valorInicial ?? 0), 0);
  const pessoaGuardado = pessoas.map(p => ({
    id: p.id,
    nome: p.nome,
    valor: p.valorInicial ?? 0,
    percent: totalGuardado ? ((p.valorInicial ?? 0) / totalGuardado) * 100 : 0,
  }));
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Só pode ir para a parte de perfil (pessoas) se preencher o que foi colocado no imóvel (objetivo)
    if (planoId && (!objetivo || !objetivo.valorImovel || objetivo.valorImovel === 0)) {
      toast.warning("Por favor, preencha as informações do imóvel primeiro.");
      const paths: Record<string, string> = {
        entrada: "/app/objetivo",
        pronto: "/app/pronto",
        planta: "/app/planta"
      };
      router.replace(paths[cenario] || "/app/objetivo");
    }
  }, [planoId, objetivo, cenario, router]);

  useEffect(() => {
    if (pessoas.length === 0 && user) {
      const defaultPessoa: Pessoa = {
        id: "user-" + user.id,
        nome: user.name || "Eu",
        renda_mensal: 0,
        renda_complementar: 0,
        gastos_mensais: 0,
        usar_gustos_detalhados: false,
        gastos_detalhados: [],
        aporte_mensal: 0,
        // Split the already saved amount (valorJaGuardado) equally; if only one person, give all
        valorInicial: objetivo?.valorJaGuardado ? Number(objetivo.valorJaGuardado) / 2 : 0,
      };
      setPessoas([defaultPessoa]);
      saveDraft({ pessoas: [defaultPessoa] });
    }
  }, [user, pessoas.length, setPessoas]);

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
    renda_mensal: 0, 
    renda_complementar: 0, 
    gastos_mensais: 0,
    usar_gastos_detalhados: false,
    gastos_detalhados: [] as GastoDetalhado[]
  });
  const [novoGastoForm, setNovoGastoForm] = useState({ nome: "", valor: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [pessoaParaRemover, setPessoaParaRemover] = useState<string | null>(null);

  const sobraTotal = pessoas.reduce((s, p) => s + (Number(p.renda_mensal) + Number(p.renda_complementar || 0) - calcularGastos(p)), 0);

  const adicionarGastoForm = () => {
    if (!novoGastoForm.nome || !novoGastoForm.valor) return;
    setForm({
      ...form,
      gastos_detalhados: [
        ...form.gastos_detalhados,
        { id: Math.random().toString(), nome: novoGastoForm.nome, valor: novoGastoForm.valor }
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
    const sobra = Math.max(0, form.renda_mensal + form.renda_complementar - gastosTotais);
    const novaPessoa: Pessoa = {
      id: Math.random().toString(),
      ...form,
      gastos_mensais: form.usar_gastos_detalhados ? gastosTotais : form.gastos_mensais,
      aporte_mensal: Math.round(sobra * 0.5),
      valorInicial: 0,
    };
    // Distribute the already saved amount (valorJaGuardado) equally among all participants
    const totalSaved = objetivo?.valorJaGuardado ? Number(objetivo.valorJaGuardado) : 0;
    const allPeople = [...pessoas, novaPessoa];
    const perPerson = allPeople.length > 0 ? totalSaved / allPeople.length : 0;
    const updatedPeople = allPeople.map(p => ({ ...p, valorInicial: perPerson }));
    setPessoas(updatedPeople);
    setForm({ nome: "", renda_mensal: 0, renda_complementar: 0, gastos_mensais: 0, usar_gastos_detalhados: false, gastos_detalhados: [] });
    setNovoGastoForm({ nome: "", valor: 0 });
    setShowAddForm(false);
  };

  const confirmarRemocao = (id: string) => {
    setPessoaParaRemover(id);
  };

  const efetivarRemocao = () => {
    if (pessoaParaRemover) {
      setPessoas(pessoas.filter((p) => p.id !== pessoaParaRemover));
      setPessoaParaRemover(null);
    }
  };

  const atualizarPessoa = (pId: string, patch: Partial<Pessoa>) => {
    setPessoas(pessoas.map((p) => {
      if (p.id === pId) {
        const updated = { ...p, ...patch };
        // Sync gastos_mensais if using detailed expenses
        if (updated.usar_gastos_detalhados) {
          updated.gastos_mensais = calcularGastos(updated);
        }
        return updated;
      }
      return p;
    }));
  };

  // Handlers for editing a person's detailed expenses
  const handleUpdateGasto = (gId: string, patch: Partial<GastoDetalhado>) => {
    const updated = (p?.gastos_detalhados || []).map(g => g.id === gId ? { ...g, ...patch } : g);
    atualizarPessoa(p.id, { gastos_detalhados: updated });
  };

  const handleRemoveGasto = (gId: string) => {
    const updated = (p?.gastos_detalhados || []).filter(g => g.id !== gId);
    atualizarPessoa(p.id, { gastos_detalhados: updated });
  };

  const handleAddGasto = () => {
    if (!novoGasto.nome || !novoGasto.valor) return;
    const newGasto = { id: Math.random().toString(), ...novoGasto };
    const updated = [...(p?.gastos_detalhados || []), newGasto];
    atualizarPessoa(p.id, { gastos_detalhados: updated });
    setNovoGasto({ nome: "", valor: 0 });
  };

  const gastosTotaisForm = calcularGastos(form);
  const sobraForm = (form.renda_mensal + form.renda_complementar) - gastosTotaisForm;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-accent font-medium mb-2">Etapa 2 de 4</p>
        <h1 className="font-display text-4xl md:text-5xl mb-2">Quem está nessa?</h1>
        <p className="text-muted-foreground">Cadastre você e seu par. Peça mais informações e detalhe os gastos para maior precisão.</p>
      </div>

      {/* Valor já guardado */}
      <Card className="p-6 shadow-soft mb-6">
        <h2 className="font-display text-2xl mb-2">Valor já guardado</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">Total</span>
            <MoneyInput variant="money" min={0} value={totalGuardado} onChange={(v) => {
              // distribute proportionally based on current percentages
              const newTotal = v;
              const updatedPeople = pessoaGuardado.map(p => ({
                ...p,
                valor: totalGuardado ? (p.percent / 100) * newTotal : 0,
              }));
              setPessoas(pessoas.map(p => {
                const upd = updatedPeople.find(up => up.id === p.id);
                return upd ? { ...p, valorInicial: upd.valor } : p;
              }));
            }} className="font-display text-2xl num" />
          </div>
          {pessoaGuardado.map(p => (
            <div key={p.id} className="flex justify-between items-center">
              <span className="font-medium">{p.nome}</span>
              <MoneyInput variant="money" min={0} value={p.valor} onChange={(v) => atualizarPessoa(p.id, { valorInicial: v })} className="font-display text-lg" />
              <span>({p.percent.toFixed(1)}%)</span>
            </div>
          ))}
        </div>
      </Card>
      <div className="grid lg:grid-cols-2 gap-4">
        {pessoas.map((p) => (
          <PessoaCard key={p.id} p={p} remover={confirmarRemocao} atualizarPessoa={atualizarPessoa} />
        ))}

        {!showAddForm ? (
          <Card 
            onClick={() => setShowAddForm(true)}
            className="glass p-6 border-2 border-dashed hover:border-accent/50 hover:bg-secondary/20 cursor-pointer transition-all flex flex-col items-center justify-center min-h-[300px] text-muted-foreground hover:text-foreground group"
          >
            <div className="h-12 w-12 rounded-full bg-secondary group-hover:bg-accent/10 grid place-items-center mb-3 transition-colors">
              <Plus className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground">Adicionar participante</h3>
            <p className="text-xs text-center mt-1 max-w-[240px] text-muted-foreground">
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
                            onChange={(v) => atualizarGastoForm(g.id, { valor: v })} 
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
