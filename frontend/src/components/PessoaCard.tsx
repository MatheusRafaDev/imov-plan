import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/MoneyInput";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { usePlanContext } from "@/context/PlanContext";
import { brl, nomeTipoInvestimento, percentualCdiPorTipoInvestimento, rendimentoEstimadoMensal } from "@/lib/finance";
import { User, Pencil, Trash2, Plus, Check, Wallet, Briefcase, TrendingDown } from "lucide-react";
import { useState } from "react";
import type { Pessoa, GastoDetalhado } from "@/context/PlanContext";

const calcularGastos = (p: Partial<Pessoa>) =>
  p.usar_gastos_detalhados
    ? (p.gastos_detalhados || []).reduce((acc, g) => acc + Number(g.valor), 0)
    : Number(p.gastos_mensais || 0);

export default function PessoaCard({
  p,
  index,
  totalGuardadoObjetivo,
  remover,
  atualizarPessoa
}: {
  p: Pessoa;
  index: number;
  totalGuardadoObjetivo: number;
  remover: (id: string) => void;
  atualizarPessoa: (id: string, patch: Partial<Pessoa>) => void
}) {
  const isNew = !p.renda_mensal && !p.aporte_mensal && !p.gastos_mensais && !p.valorInicial;
  const [isEditing, setIsEditing] = useState(isNew);
  const [novoGasto, setNovoGasto] = useState({ nome: "", valor: 0 });
  const gastosTotais = calcularGastos(p);
  const sobra = Number(p.renda_mensal) + Number(p.renda_complementar || 0) - gastosTotais;

  const role = index === 0 ? "Titular" : "Participante";
  const valorInicial = p.valorInicial ?? 0;
  const percent = totalGuardadoObjetivo > 0 ? Math.min(100, Math.max(0, (valorInicial / totalGuardadoObjetivo) * 100)) : 0;
  const { objetivo } = usePlanContext();
  const cdiPercent = percentualCdiPorTipoInvestimento(p.tipoInvestimento);
  const retornoMensalEstimado = rendimentoEstimadoMensal(valorInicial, Number(objetivo?.taxaCdiAnual ?? 10.5), p.tipoInvestimento);

  const handleAddGasto = () => {
    if (!novoGasto.nome || !novoGasto.valor) return;
    const newGastos = [...(p.gastos_detalhados || []), { id: Math.random().toString(), nome: novoGasto.nome, valor: novoGasto.valor }];
    const updatedGastos = newGastos.reduce((acc, g) => acc + Number(g.valor), 0);
    const novaSobra = Number(p.renda_mensal) + Number(p.renda_complementar || 0) - updatedGastos;
    atualizarPessoa(p.id, { gastos_detalhados: newGastos, aporte_mensal: Math.max(0, novaSobra) });
    setNovoGasto({ nome: "", valor: 0 });
  };

  const handleRemoveGasto = (id: string) => {
    const newGastos = (p.gastos_detalhados || []).filter(g => g.id !== id);
    const updatedGastos = newGastos.reduce((acc, g) => acc + Number(g.valor), 0);
    const novaSobra = Number(p.renda_mensal) + Number(p.renda_complementar || 0) - updatedGastos;
    atualizarPessoa(p.id, { gastos_detalhados: newGastos, aporte_mensal: Math.max(0, novaSobra) });
  };

  const handleUpdateGasto = (gId: string, patch: Partial<GastoDetalhado>) => {
    const newGastos = (p.gastos_detalhados || []).map(g => g.id === gId ? { ...g, ...patch } : g);
    const updatedGastos = newGastos.reduce((acc, g) => acc + Number(g.valor), 0);
    const novaSobra = Number(p.renda_mensal) + Number(p.renda_complementar || 0) - updatedGastos;
    atualizarPessoa(p.id, { gastos_detalhados: newGastos, aporte_mensal: Math.max(0, novaSobra) });
  };

  const handleUpdateRenda = (field: 'renda_mensal' | 'renda_complementar', value: number) => {
    const gastosTotais = p.usar_gastos_detalhados
      ? (p.gastos_detalhados || []).reduce((acc, g) => acc + Number(g.valor), 0)
      : Number(p.gastos_mensais || 0);
    const novaSobra = (field === 'renda_mensal' ? value : Number(p.renda_mensal)) +
                      (field === 'renda_complementar' ? value : Number(p.renda_complementar || 0)) -
                      gastosTotais;
    atualizarPessoa(p.id, { [field]: value, aporte_mensal: Math.max(0, novaSobra) });
  };

  const handleUpdateGastosDiretos = (value: number) => {
    const novaSobra = Number(p.renda_mensal) + Number(p.renda_complementar || 0) - value;
    atualizarPessoa(p.id, { gastos_mensais: value, aporte_mensal: Math.max(0, novaSobra) });
  };

  if (!isEditing) {
    const rendaTotal = Number(p.renda_mensal) + Number(p.renda_complementar || 0);
    return (
      <Card className="glass p-6 shadow-soft space-y-4 transition-all hover:shadow-elevated border-border/60 relative overflow-hidden group">
        <div className="absolute -right-12 -top-12 h-32 w-32 bg-accent/5 rounded-full blur-2xl group-hover:bg-accent/10 transition-colors duration-700" />

        {/* Header */}
        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 shrink-0 rounded-full bg-secondary grid place-items-center border border-border/50 shadow-sm">
              <span className="font-display font-bold text-lg text-foreground/80">{p.nome.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-foreground leading-tight">{p.nome}</h3>
              <p className="text-[10px] uppercase tracking-widest text-accent font-medium mt-0.5">{role}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary/80">
              <Pencil className="h-4 w-4" />
            </Button>
            {index > 0 && (
              <Button variant="ghost" size="icon" onClick={() => remover(p.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="relative z-10 space-y-3">
          {/* Renda */}
          <div className="bg-secondary/30 rounded-xl p-3 border border-border/40">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium flex items-center gap-1.5 mb-2">
              <Briefcase className="h-3 w-3" /> Renda
            </p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Principal</span>
                <span className="num font-medium">{brl(Number(p.renda_mensal))}</span>
              </div>
              {Number(p.renda_complementar) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Extra</span>
                  <span className="num font-medium">{brl(Number(p.renda_complementar))}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-semibold pt-1.5 border-t border-border/40 mt-1">
                <span>Total</span>
                <span className="num">{brl(rendaTotal)}</span>
              </div>
            </div>
          </div>

          {/* Gastos */}
          <div className="bg-destructive/5 rounded-xl p-3 border border-destructive/10">
            <p className="text-[10px] uppercase tracking-widest text-destructive/70 font-medium flex items-center gap-1.5 mb-2">
              <TrendingDown className="h-3 w-3" /> Gastos
            </p>
            <div className="space-y-1.5">
              {p.usar_gastos_detalhados && (p.gastos_detalhados || []).length > 0 ? (
                <>
                  {(p.gastos_detalhados || []).map(g => (
                    <div key={g.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground truncate mr-2">{g.nome}</span>
                      <span className="num text-destructive/80 shrink-0">{brl(g.valor)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-semibold pt-1.5 border-t border-destructive/10 mt-1">
                    <span>Total</span>
                    <span className="num text-destructive">{brl(gastosTotais)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-sm font-semibold">
                  <span>Total</span>
                  <span className="num text-destructive">{brl(gastosTotais)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Sobra */}
          <div className={`rounded-xl p-3 border flex items-center justify-between ${sobra >= 0 ? "bg-[#3B6D11]/5 border-[#3B6D11]/15" : "bg-destructive/5 border-destructive/15"}`}>
            <span className="text-sm font-medium flex items-center gap-1.5 text-muted-foreground">
              <Wallet className="h-3.5 w-3.5" /> Sobra mensal
            </span>
            <span className={`font-display text-xl num font-semibold ${sobra >= 0 ? "text-[#3B6D11] dark:text-[#80B551]" : "text-destructive"}`}>
              {brl(sobra)}
            </span>
          </div>

          {/* Aporte mensal */}
          <div className="bg-primary/5 rounded-xl p-3 border border-primary/15">
            <span className="text-sm font-medium flex items-center gap-1.5 text-primary">
              <Wallet className="h-3.5 w-3.5" /> Aporte mensal
            </span>
            <span className="font-display text-xl num font-semibold text-primary">
              {brl(Number(p.aporte_mensal || 0))}
            </span>
          </div>

          {/* Valor guardado */}
          <div className="bg-secondary/50 rounded-xl p-3 border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Valor guardado</span>
              <span className="text-xs font-display text-accent font-semibold bg-accent/10 px-2 py-0.5 rounded-full">
                {percent.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-secondary/80 rounded-full h-1.5 overflow-hidden mb-2">
              <div className="bg-accent h-full rounded-full transition-all duration-300 ease-out" style={{ width: `${percent}%` }} />
            </div>
            <div className="flex items-end justify-between">
              <span className="font-display text-2xl num font-semibold">{brl(valorInicial)}</span>
                {valorInicial > 0 && (
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                  {p.tipoInvestimento === "poupanca" ? "Poupança" :
                   p.tipoInvestimento === "cdb_100" ? "CDB / Renda Fixa" :
                   p.tipoInvestimento === "cdb_120" ? "CDB 120% CDI" :
                   p.tipoInvestimento === "tesouro_selic" ? "Tesouro Selic" :
                   p.tipoInvestimento === "lci_lca" ? "LCI / LCA" :
                   p.tipoInvestimento === "fundo_di" ? "Fundo DI" :
                   p.tipoInvestimento === "conta_corrente" ? "Conta Corrente" : "Investimento"}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Edit Mode
  return (
    <Card className="glass p-6 shadow-soft border-accent/40 animate-fade-in-up flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 w-full">
          <div className="h-12 w-12 shrink-0 rounded-full bg-gradient-to-br from-secondary to-secondary/50 grid place-items-center shadow-inner">
            <User className="h-5 w-5 text-muted-foreground" />
          </div>
          <Input 
            value={p.nome} 
            onChange={e => atualizarPessoa(p.id, { nome: e.target.value })} 
            className="font-display text-2xl font-semibold border-none px-0 focus-visible:ring-0 h-auto bg-transparent" 
            placeholder="Nome do participante"
          />
        </div>
        {index > 0 && (
          <Button variant="ghost" size="icon" onClick={() => remover(p.id)} className="shrink-0 hover:bg-destructive/10 hover:text-destructive transition-colors">
            <Trash2 className="h-5 w-5" />
          </Button>
        )}
      </div>

      <div className="space-y-5">
        {/* Rendas */}
        <div className="bg-secondary/20 rounded-xl p-4 border border-border/50">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium flex items-center gap-1.5 mb-3">
            <Briefcase className="h-3 w-3" /> Receitas
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Principal</Label>
              <MoneyInput variant="money" min={0} value={Number(p.renda_mensal)} onChange={v => handleUpdateRenda('renda_mensal', v === "" ? 0 : v)} className="bg-background" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Extra</Label>
              <MoneyInput variant="money" min={0} value={Number(p.renda_complementar || 0)} onChange={v => handleUpdateRenda('renda_complementar', v === "" ? 0 : v)} className="bg-background" />
            </div>
          </div>
        </div>

        {/* Despesas */}
        <div className="bg-destructive/5 rounded-xl p-4 border border-destructive/10">
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 mb-3">
            <p className="text-[10px] uppercase tracking-widest text-destructive/80 font-medium flex items-center gap-1.5">
              <TrendingDown className="h-3 w-3" /> Despesas
            </p>
            <Button variant="outline" size="sm" className="h-7 text-[10px] px-2.5 bg-background/50 hover:bg-background" onClick={() => {
              const novoModo = !p.usar_gastos_detalhados;
              atualizarPessoa(p.id, { usar_gastos_detalhados: novoModo });
              const gastosTotais = novoModo
                ? (p.gastos_detalhados || []).reduce((acc, g) => acc + Number(g.valor), 0)
                : Number(p.gastos_mensais || 0);
              const novaSobra = Number(p.renda_mensal) + Number(p.renda_complementar || 0) - gastosTotais;
              atualizarPessoa(p.id, { aporte_mensal: Math.max(0, novaSobra) });
            }}>
              {p.usar_gastos_detalhados ? "Usar Valor Direto" : "Detalhar Gastos"}
            </Button>
          </div>
          
          {!p.usar_gastos_detalhados ? (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Despesa Mensal Total</Label>
              <MoneyInput variant="money" min={0} value={Number(p.gastos_mensais)} onChange={v => handleUpdateGastosDiretos(v === "" ? 0 : v)} className="bg-background" />
            </div>
          ) : (
            <div className="space-y-3">
              {(p.gastos_detalhados || []).map(g => (
                <div key={g.id} className="flex items-center gap-2 bg-background p-1.5 rounded-lg border border-border/40 shadow-sm">
                  <Input value={g.nome} onChange={e => handleUpdateGasto(g.id, { nome: e.target.value })} className="h-9 text-sm flex-1 bg-transparent border-none focus-visible:ring-0" placeholder="Ex: Aluguel" />
                  <div className="w-28 shrink-0">
                    <MoneyInput variant="money" min={0} value={g.valor} onChange={v => handleUpdateGasto(g.id, { valor: v === "" ? 0 : v })} className="h-9 text-sm bg-transparent border-none focus-visible:ring-0 text-right" />
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleRemoveGasto(g.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex flex-wrap sm:flex-nowrap gap-2 items-end pt-1">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Novo Gasto</Label>
                  <Input placeholder="Ex: Mercado" className="h-9 text-sm bg-background" value={novoGasto.nome} onChange={e => setNovoGasto({ ...novoGasto, nome: e.target.value })} />
                </div>
                <div className="w-28 shrink-0 space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Valor</Label>
                  <MoneyInput variant="money" min={0} placeholder="R$" className="h-9 text-sm bg-background" value={novoGasto.valor} onChange={v => setNovoGasto({ ...novoGasto, valor: v === "" ? 0 : v })} />
                </div>
                <Button size="icon" className="h-9 w-9 bg-primary text-primary-foreground shrink-0 shadow-sm hover:shadow-md transition-all" onClick={handleAddGasto} disabled={!novoGasto.nome || !novoGasto.valor}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {gastosTotais > 0 && (
                <div className="flex justify-between items-center pt-3 px-1 border-t border-destructive/10 mt-3">
                  <span className="text-[10px] uppercase tracking-widest text-destructive/80 font-medium">Total Despesas</span>
                  <span className="font-semibold text-destructive">{brl(gastosTotais)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Investimentos & Aportes */}
        <div className="grid grid-cols-2 gap-4">
          <div className={`bg-accent/5 rounded-xl p-4 border border-accent/10 space-y-2 flex flex-col justify-between ${valorInicial > 0 ? "col-span-2 sm:col-span-1" : ""}`}>
            <Label className="text-xs font-medium text-accent flex items-center gap-1.5">
              <Wallet className="h-3 w-3" /> Já Guardado
            </Label>
            <div className="flex gap-2">
              <MoneyInput
                variant="money"
                min={0}
                value={valorInicial}
                onChange={v => atualizarPessoa(p.id, { valorInicial: v === "" ? 0 : v })}
                className="bg-background font-medium flex-1"
              />
            </div>
            {valorInicial > 0 && (
              <div className="mt-2 space-y-1.5 animate-in slide-in-from-top-1 fade-in duration-200">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Onde está guardado?</Label>
                <select
                  value={p.tipoInvestimento || ""}
                  onChange={(e) => atualizarPessoa(p.id, { tipoInvestimento: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Selecione o tipo</option>
                  <option value="poupanca">Poupança</option>
                  <option value="cdb_100">CDB 100%</option>
                </select>

              </div>
            )}
          </div>
          <div className="bg-primary/5 rounded-xl p-4 border border-primary/10 space-y-2 flex flex-col justify-between">
            <Label className="text-xs font-medium text-primary flex items-center gap-1.5">
              <TrendingDown className="h-3 w-3 rotate-180" /> Aporte Mensal
            </Label>
            <MoneyInput
              variant="money"
              min={0}
              value={Number(p.aporte_mensal || 0)}
              onChange={v => atualizarPessoa(p.id, { aporte_mensal: v === "" ? 0 : v })}
              className="bg-background font-medium"
            />
          </div>
        </div>

        {/* Sobra */}
        <div className={`rounded-xl p-4 flex items-center justify-between transition-colors border shadow-sm ${sobra >= 0 ? "bg-[#3B6D11]/10 border-[#3B6D11]/20 text-[#3B6D11] dark:text-[#80B551]" : "bg-destructive/10 border-destructive/20 text-destructive"}`}>
          <span className="text-sm font-medium">Sobra Mensal Estimada</span>
          <span className="font-display text-xl num font-bold">{brl(sobra)}</span>
        </div>
      </div>

      <Button onClick={() => setIsEditing(false)} className="w-full bg-gradient-warm text-accent-foreground hover:opacity-95 shadow-glow h-12 text-base mt-2">
        <Check className="h-5 w-5 mr-2" /> Salvar Alterações
      </Button>
    </Card>
  );
}
