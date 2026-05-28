import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/MoneyInput";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { brl } from "@/lib/finance";
import { User, Pencil, Trash2, Plus, Check } from "lucide-react";
import { useState } from "react";
import type { Pessoa, GastoDetalhado } from "@/context/PlanContext";

const calcularGastos = (p: Partial<Pessoa>) =>
  p.usar_gastos_detalhados
    ? (p.gastos_detalhados || []).reduce((acc, g) => acc + Number(g.valor), 0)
    : Number(p.gastos_mensais || 0);

export default function PessoaCard({ p, remover, atualizarPessoa }: { p: Pessoa; remover: (id: string) => void; atualizarPessoa: (id: string, patch: Partial<Pessoa>) => void }) {
  const [isEditing, setIsEditing] = useState(false);
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

  const handleUpdateGasto = (gId: string, patch: Partial<GastoDetalhado>) => {
    const newGastos = (p.gastos_detalhados || []).map(g => g.id === gId ? { ...g, ...patch } : g);
    atualizarPessoa(p.id, { gastos_detalhados: newGastos });
  };

  if (!isEditing) {
    return (
      <Card className={`glass p-6 shadow-soft space-y-5 transition-transform hover:scale-105 hover:shadow-elevated`}>/* Header */
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 rounded-full bg-secondary grid place-items-center">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-display text-xl font-semibold text-foreground">{p.nome}</h3>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Participante</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => remover(p.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm pt-2">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground block">Renda Principal</span>
            <span className="font-medium text-foreground block">{brl(Number(p.renda_mensal))}</span>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground block">Renda Extra</span>
            <span className="font-medium text-foreground block">{Number(p.renda_complementar) > 0 ? brl(Number(p.renda_complementar)) : "—"}</span>
          </div>
          <div className="col-span-2 space-y-1.5">
            <span className="text-xs text-muted-foreground block">
              Despesas Mensais {p.usar_gastos_detalhados && <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded-full ml-1 font-medium text-muted-foreground">Detalhado</span>}
            </span>
            <span className="font-medium text-foreground block">{brl(gastosTotais)}</span>
            {p.usar_gastos_detalhados && p.gastos_detalhados && p.gastos_detalhados.length > 0 && (
              <div className="grid grid-cols-2 gap-1.5 bg-secondary/25 p-2.5 rounded-lg border border-border/40 mt-1">
                {p.gastos_detalhados.map(g => (
                  <div key={g.id} className="flex justify-between text-xs text-muted-foreground">
                    <span className="truncate pr-1">{g.nome}</span>
                    <span className="font-medium text-foreground num">{brl(g.valor)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className={`rounded-lg p-3 flex items-center justify-between transition-colors ${sobra >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"} ${sobra > 0 ? "animate-pulse" : ""}`}>
          <span className="text-xs font-medium uppercase tracking-wider">Sobra mensal</span>
          <span className="font-display text-xl num font-semibold">{brl(sobra)}</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="glass p-6 shadow-soft space-y-4 border-accent/40 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 w-full">
          <div className="h-10 w-10 shrink-0 rounded-full bg-secondary grid place-items-center">
            <User className="h-4 w-4" />
          </div>
          <Input value={p.nome} onChange={e => atualizarPessoa(p.id, { nome: e.target.value })} className="font-display text-lg border-none px-0 focus-visible:ring-0 h-auto" />
        </div>
        <Button variant="ghost" size="icon" onClick={() => remover(p.id)} className="shrink-0">
          <Trash2 className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Renda Principal</Label>
          <MoneyInput variant="money" min={0} value={Number(p.renda_mensal)} onChange={v => atualizarPessoa(p.id, { renda_mensal: v })} />
        </div>
        <div>
          <Label className="text-xs">Renda Extra (Opcional)</Label>
          <MoneyInput variant="money" min={0} value={Number(p.renda_complementar || 0)} onChange={v => atualizarPessoa(p.id, { renda_complementar: v })} />
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
      <div className={`rounded-lg p-3 flex items-center justify-between transition-colors ${sobra >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"} ${sobra > 0 ? "animate-pulse" : ""}`}>
        <span className="text-sm">Sobra mensal</span>
        <span className="font-display text-xl num font-semibold">{brl(sobra)}</span>
      </div>
      <Button onClick={() => setIsEditing(false)} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-2">
        <Check className="h-4 w-4 mr-1.5" /> Concluir Edição
      </Button>
    </Card>
  );
}
