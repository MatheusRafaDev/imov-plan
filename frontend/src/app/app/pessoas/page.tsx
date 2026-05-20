"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePlanContext, type Pessoa, type GastoDetalhado } from "@/context/PlanContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/MoneyInput";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { brl } from "@/lib/finance";
import { Plus, Trash2, ArrowRight, User, Calculator, ListTodo, Briefcase } from "lucide-react";

const calcularGastos = (p: Partial<Pessoa>) => {
  return p.usar_gastos_detalhados 
    ? (p.gastos_detalhados || []).reduce((acc, g) => acc + Number(g.valor), 0)
    : Number(p.gastos_mensais || 0);
};

export default function PessoasPage() {
  const { pessoas, setPessoas } = usePlanContext();
  const router = useRouter();
  
  const [form, setForm] = useState({ 
    nome: "", 
    renda_mensal: 0, 
    renda_complementar: 0, 
    gastos_mensais: 0,
    usar_gastos_detalhados: false,
    gastos_detalhados: [] as GastoDetalhado[]
  });
  const [novoGastoForm, setNovoGastoForm] = useState({ nome: "", valor: 0 });

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

  const adicionar = () => {
    if (!form.nome) return;
    const gastosTotais = calcularGastos(form);
    const sobra = Math.max(0, form.renda_mensal + form.renda_complementar - gastosTotais);
    const novaPessoa: Pessoa = {
      id: Math.random().toString(),
      ...form,
      gastos_mensais: form.usar_gastos_detalhados ? gastosTotais : form.gastos_mensais,
      aporte_mensal: Math.round(sobra * 0.5),
    };
    setPessoas([...pessoas, novaPessoa]);
    setForm({ nome: "", renda_mensal: 0, renda_complementar: 0, gastos_mensais: 0, usar_gastos_detalhados: false, gastos_detalhados: [] });
    setNovoGastoForm({ nome: "", valor: 0 });
  };

  const remover = (id: string) => {
    setPessoas(pessoas.filter((p) => p.id !== id));
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

  const gastosTotaisForm = calcularGastos(form);
  const sobraForm = (form.renda_mensal + form.renda_complementar) - gastosTotaisForm;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-accent font-medium mb-2">Etapa 2 de 4</p>
        <h1 className="font-display text-4xl md:text-5xl mb-2">Quem está nessa?</h1>
        <p className="text-muted-foreground">Cadastre você e seu par. Peça mais informações e detalhe os gastos para maior precisão.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {pessoas.map((p) => (
          <PessoaCard key={p.id} p={p} remover={remover} atualizarPessoa={atualizarPessoa} />
        ))}

        <Card className="p-6 border-dashed shadow-none space-y-4">
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
                    <div key={g.id} className="flex items-center justify-between text-sm bg-background p-2 rounded-lg border border-border/50">
                      <span className="text-muted-foreground">{g.nome}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{brl(g.valor)}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removerGastoForm(g.id)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
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
              <div className={`p-3 rounded-xl flex justify-between items-center transition-colors ${sobraForm >= 0 ? "bg-success/10 text-success-foreground" : "bg-destructive/10 text-destructive-foreground"}`}>
                <span className="text-xs font-medium uppercase tracking-wider">Sobra Estimada</span>
                <span className="font-display text-xl num">{brl(sobraForm)}</span>
              </div>
            )}
          </div>
          
          <Button onClick={adicionar} className="w-full mt-2" variant="secondary" disabled={!form.nome}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar {form.nome || "Pessoa"}
          </Button>
        </Card>
      </div>

      {pessoas.length > 0 && (
        <Card className="p-6 bg-gradient-ink text-primary-foreground shadow-elevated flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest opacity-70">Sobra total projetada</p>
            <p className="font-display text-3xl md:text-4xl num mt-1">{brl(sobraTotal)}</p>
            <p className="text-xs opacity-70 mt-1">Este valor será usado como base para os aportes no plano.</p>
          </div>
          <Button onClick={() => router.push("/app/consultoria")} className="bg-gradient-warm text-accent-foreground hover:opacity-90 w-full sm:w-auto h-12 px-6">
            Consultar Especialista IA <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Card>
      )}
    </div>
  );
}

function PessoaCard({ p, remover, atualizarPessoa }: { p: Pessoa, remover: (id: string) => void, atualizarPessoa: (id: string, patch: Partial<Pessoa>) => void }) {
  const [novoGasto, setNovoGasto] = useState({ nome: "", valor: 0 });
  const gastosTotais = calcularGastos(p);
  const sobra = Number(p.renda_mensal) + Number(p.renda_complementar || 0) - gastosTotais;

  const handleAddGasto = () => {
    if (!novoGasto.nome || !novoGasto.valor) return;
    const newGastos = [...(p.gastos_detalhados || []), { id: Math.random().toString(), nome: novoGasto.nome, valor: novoGasto.valor }];
    atualizarPessoa(p.id, { gastos_detalhados: newGastos });
    setNovoGasto({ nome: "", valor: 0 });
  };

  const handleRemoveGasto = (id: string) => {
    const newGastos = (p.gastos_detalhados || []).filter(g => g.id !== id);
    atualizarPessoa(p.id, { gastos_detalhados: newGastos });
  };

  return (
    <Card className="p-6 shadow-soft space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 w-full">
          <div className="h-10 w-10 shrink-0 rounded-full bg-secondary grid place-items-center">
            <User className="h-4 w-4" />
          </div>
          <Input
            value={p.nome}
            onChange={(e) => atualizarPessoa(p.id, { nome: e.target.value })}
            className="font-display text-lg border-none px-0 focus-visible:ring-0 h-auto"
          />
        </div>
        <Button variant="ghost" size="icon" onClick={() => remover(p.id)} className="shrink-0">
          <Trash2 className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Renda Principal</Label>
          <MoneyInput variant="money" min={0} value={Number(p.renda_mensal)}
            onChange={(v) => atualizarPessoa(p.id, { renda_mensal: v })} />
        </div>
        <div>
          <Label className="text-xs">Renda Extra (Opcional)</Label>
          <MoneyInput variant="money" min={0} value={Number(p.renda_complementar || 0)}
            onChange={(v) => atualizarPessoa(p.id, { renda_complementar: v })} />
        </div>
        
        <div className="col-span-2 pt-2">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs font-medium">Despesas Mensais</Label>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 text-[10px] px-2"
              onClick={() => atualizarPessoa(p.id, { usar_gastos_detalhados: !p.usar_gastos_detalhados })}
            >
              {p.usar_gastos_detalhados ? "Mudar para Valor Direto" : "Detalhar Gastos"}
            </Button>
          </div>

          {!p.usar_gastos_detalhados ? (
            <MoneyInput variant="money" min={0} value={Number(p.gastos_mensais)}
              onChange={(v) => atualizarPessoa(p.id, { gastos_mensais: v })} />
          ) : (
            <div className="space-y-2 bg-secondary/20 p-3 rounded-lg border border-border/40">
              {(p.gastos_detalhados || []).map(g => (
                <div key={g.id} className="flex items-center justify-between text-sm bg-background p-1.5 rounded-md border border-border/40">
                  <span className="text-muted-foreground text-xs pl-1">{g.nome}</span>
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-xs">{brl(g.valor)}</span>
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleRemoveGasto(g.id)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="flex gap-2 items-end pt-1">
                <div className="flex-1">
                  <Input placeholder="Ex: Mercado" className="h-8 text-xs" value={novoGasto.nome} onChange={e => setNovoGasto({...novoGasto, nome: e.target.value})} />
                </div>
                <div className="w-24">
                  <MoneyInput variant="money" min={0} placeholder="R$" className="h-8 text-xs" value={novoGasto.valor} onChange={v => setNovoGasto({...novoGasto, valor: v})} />
                </div>
                <Button size="icon" className="h-8 w-8 bg-primary" onClick={handleAddGasto} disabled={!novoGasto.nome || !novoGasto.valor}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex justify-between items-center pt-2 px-1 border-t border-border/40 mt-2">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Total</span>
                <span className="font-medium">{brl(gastosTotais)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className={`rounded-lg p-3 flex items-center justify-between transition-colors ${sobra >= 0 ? "bg-success/10" : "bg-destructive/10"}`}>
        <span className={`text-sm ${sobra >= 0 ? "text-success" : "text-destructive"}`}>Sobra mensal</span>
        <span className={`font-display text-xl num ${sobra >= 0 ? "text-success" : "text-destructive"}`}>{brl(sobra)}</span>
      </div>
    </Card>
  );
}
