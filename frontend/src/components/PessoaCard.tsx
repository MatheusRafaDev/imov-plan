import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/MoneyInput";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { brl } from "@/lib/finance";
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
  const [isEditing, setIsEditing] = useState(false);
  const [novoGasto, setNovoGasto] = useState({ nome: "", valor: 0 });
  const gastosTotais = calcularGastos(p);
  const sobra = Number(p.renda_mensal) + Number(p.renda_complementar || 0) - gastosTotais;

  const role = index === 0 ? "Titular" : "Participante";
  const valorInicial = p.valorInicial ?? 0;
  const percent = totalGuardadoObjetivo > 0 ? Math.min(100, Math.max(0, (valorInicial / totalGuardadoObjetivo) * 100)) : 0;

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

  const handleUpdateGasto = (gId: string, patch: Partial<GastoDetalhado>) => {
    const newGastos = (p.gastos_detalhados || []).map(g => g.id === gId ? { ...g, ...patch } : g);
    atualizarPessoa(p.id, { gastos_detalhados: newGastos });
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
            <span className="font-display text-2xl num font-semibold">{brl(valorInicial)}</span>
          </div>
        </div>
      </Card>
    );
  }

  // Edit Mode
  return (
    <Card className="glass p-6 shadow-soft space-y-4 border-accent/40 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 w-full">
          <div className="h-10 w-10 shrink-0 rounded-full bg-secondary grid place-items-center">
            <User className="h-4 w-4" />
          </div>
          <Input value={p.nome} onChange={e => atualizarPessoa(p.id, { nome: e.target.value })} className="font-display text-lg border-none px-0 focus-visible:ring-0 h-auto bg-transparent" />
        </div>
        {index > 0 && (
          <Button variant="ghost" size="icon" onClick={() => remover(p.id)} className="shrink-0 hover:bg-destructive/10 hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Renda Principal</Label>
          <MoneyInput variant="money" min={0} value={Number(p.renda_mensal)} onChange={v => atualizarPessoa(p.id, { renda_mensal: v })} />
        </div>
        <div>
          <Label className="text-xs">Renda Extra</Label>
          <MoneyInput variant="money" min={0} value={Number(p.renda_complementar || 0)} onChange={v => atualizarPessoa(p.id, { renda_complementar: v })} />
        </div>
        <div className="col-span-2">
          <Label className="text-xs text-accent">Valor Já Guardado</Label>
          <MoneyInput
            variant="money"
            min={0}
            value={valorInicial}
            onChange={v => atualizarPessoa(p.id, { valorInicial: v })}
          />
        </div>
        <div className="col-span-2">
          <Label className="text-xs text-primary font-medium">Aporte Mensal Programado</Label>
          <MoneyInput
            variant="money"
            min={0}
            value={Number(p.aporte_mensal || 0)}
            onChange={v => atualizarPessoa(p.id, { aporte_mensal: v })}
          />
        </div>
        <div className="col-span-2 pt-2">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs font-medium">Despesas Mensais</Label>
            <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => atualizarPessoa(p.id, { usar_gastos_detalhados: !p.usar_gastos_detalhados })}>
              {p.usar_gastos_detalhados ? "Mudar para Valor Direto" : "Detalhar Gastos"}
            </Button>
          </div>
          {!p.usar_gastos_detalhados ? (
            <MoneyInput variant="money" min={0} value={Number(p.gastos_mensais)} onChange={v => atualizarPessoa(p.id, { gastos_mensais: v })} />
          ) : (
            <div className="space-y-2 bg-secondary/20 p-3 rounded-lg border border-border/40">
              {(p.gastos_detalhados || []).map(g => (
                <div key={g.id} className="flex items-center gap-2 bg-background p-1.5 rounded-md border border-border/40">
                  <Input value={g.nome} onChange={e => handleUpdateGasto(g.id, { nome: e.target.value })} className="h-8 text-xs flex-1 bg-transparent" placeholder="Nome do gasto" />
                  <div className="w-24">
                    <MoneyInput variant="money" min={0} value={g.valor} onChange={v => handleUpdateGasto(g.id, { valor: v })} className="h-8 text-xs" />
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveGasto(g.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2 items-end pt-1">
                <div className="flex-1">
                  <Input placeholder="Ex: Mercado" className="h-8 text-xs" value={novoGasto.nome} onChange={e => setNovoGasto({ ...novoGasto, nome: e.target.value })} />
                </div>
                <div className="w-24">
                  <MoneyInput variant="money" min={0} placeholder="R$" className="h-8 text-xs" value={novoGasto.valor} onChange={v => setNovoGasto({ ...novoGasto, valor: v })} />
                </div>
                <Button size="icon" className="h-8 w-8 bg-primary text-primary-foreground" onClick={handleAddGasto} disabled={!novoGasto.nome || !novoGasto.valor}>
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
      <div className={`rounded-lg p-3 flex items-center justify-between transition-colors border ${sobra >= 0 ? "bg-success/5 border-success/10 text-success" : "bg-destructive/5 border-destructive/10 text-destructive"}`}>
        <span className="text-sm font-medium">Sobra mensal</span>
        <span className="font-display text-xl num font-semibold">{brl(sobra)}</span>
      </div>
      <Button onClick={() => setIsEditing(false)} className="w-full bg-gradient-warm text-accent-foreground hover:opacity-90 mt-2 shadow-sm">
        <Check className="h-4 w-4 mr-1.5" /> Concluir Edição
      </Button>
    </Card>
  );
}
