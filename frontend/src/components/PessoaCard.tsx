"use client";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/MoneyInput";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  brl
} from "@/lib/finance";
import { 
  User, 
  Pencil, 
  Trash2, 
  Plus, 
  Check, 
  X,
  Wallet, 
  Briefcase, 
  TrendingDown, 
  TrendingUp, 
  CreditCard,
  ChevronDown,
  Coins,
  Sparkles
} from "lucide-react";
import { useState } from "react";
import type { Pessoa, GastoDetalhado } from "@/context/PlanContext";

const calcularGastos = (p: Partial<Pessoa>) =>
  p.usar_gastos_detalhados
    ? (p.gastos_detalhados || []).reduce((acc, g) => acc + Number(g.valor), 0)
    : Number(p.gastos_mensais || 0);

const TIPOS_INVESTIMENTO = [
  { value: "cdb_100", label: "CDB 100% CDI (Recomendado)" },
  { value: "tesouro_selic", label: "Tesouro Selic" },
  { value: "poupanca", label: "Poupança" },
  { value: "lci_lca", label: "LCI / LCA (Isento de IR)" },
  { value: "fundo_di", label: "Fundo DI / Conta Remunerada" },
  { value: "conta_corrente", label: "Conta Corrente (Sem rendimento)" },
];

export default function PessoaCard({
  p,
  index,
  totalGuardadoObjetivo,
  progressoAtual,
  remover,
  atualizarPessoa
}: {
  p: Pessoa;
  index: number;
  totalGuardadoObjetivo: number;
  progressoAtual: number;
  taxaCdiAnual?: number;
  remover: (id: string) => void;
  atualizarPessoa: (id: string, patch: Partial<Pessoa>) => void;
}) {
  const isNew = !p.renda_mensal && !p.aporte_mensal && !p.gastos_mensais && !p.valorInicial && !p.valorAtual;
  const [isEditing, setIsEditing] = useState(isNew);
  const [novoGasto, setNovoGasto] = useState({ nome: "", valor: 0 });

  const rendaTotal = Number(p.renda_mensal || 0) + Number(p.renda_complementar || 0);
  const gastosTotais = calcularGastos(p);
  const sobra = rendaTotal - gastosTotais;
  const aporteAtual = Number(p.aporte_mensal || 0);

  // O saldo acumulado é o valor do último mês (progresso da simulação) ou o último saldo informado
  const valorBase = Number(p.valorAtual ?? p.valorInicial ?? 0);
  const saldoAcumulado = progressoAtual > 0 ? progressoAtual : valorBase;

  const [saldoEditado, setSaldoEditado] = useState<number | "" | null>(null);
  const displaySaldo = saldoEditado !== null ? saldoEditado : saldoAcumulado;

  const role = index === 0 ? "Titular" : "Participante";
  const percent = totalGuardadoObjetivo > 0 ? Math.min(100, Math.max(0, (saldoAcumulado / totalGuardadoObjetivo) * 100)) : 0;

  const handleAddGasto = () => {
    if (!novoGasto.nome.trim() || !novoGasto.valor) return;
    const newGastos = [...(p.gastos_detalhados || []), { id: Math.random().toString(), nome: novoGasto.nome.trim(), valor: novoGasto.valor }];
    const updatedGastos = newGastos.reduce((acc, g) => acc + Number(g.valor), 0);
    const novaSobra = rendaTotal - updatedGastos;
    atualizarPessoa(p.id, { gastos_detalhados: newGastos, aporte_mensal: Math.max(0, novaSobra) });
    setNovoGasto({ nome: "", valor: 0 });
  };

  const handleRemoveGasto = (id: string) => {
    const newGastos = (p.gastos_detalhados || []).filter(g => g.id !== id);
    const updatedGastos = newGastos.reduce((acc, g) => acc + Number(g.valor), 0);
    const novaSobra = rendaTotal - updatedGastos;
    atualizarPessoa(p.id, { gastos_detalhados: newGastos, aporte_mensal: Math.max(0, novaSobra) });
  };

  const handleUpdateGasto = (gId: string, patch: Partial<GastoDetalhado>) => {
    const newGastos = (p.gastos_detalhados || []).map(g => g.id === gId ? { ...g, ...patch } : g);
    const updatedGastos = newGastos.reduce((acc, g) => acc + Number(g.valor), 0);
    const novaSobra = rendaTotal - updatedGastos;
    atualizarPessoa(p.id, { gastos_detalhados: newGastos, aporte_mensal: Math.max(0, novaSobra) });
  };

  const handleUpdateRenda = (field: 'renda_mensal' | 'renda_complementar', value: number) => {
    const novaRendaTotal = (field === 'renda_mensal' ? value : Number(p.renda_mensal || 0)) +
                          (field === 'renda_complementar' ? value : Number(p.renda_complementar || 0));
    const novaSobra = novaRendaTotal - gastosTotais;
    atualizarPessoa(p.id, { [field]: value, aporte_mensal: Math.max(0, novaSobra) });
  };

  const handleUpdateGastosDiretos = (value: number) => {
    const novaSobra = rendaTotal - value;
    atualizarPessoa(p.id, { gastos_mensais: value, aporte_mensal: Math.max(0, novaSobra) });
  };

  const getTipoInvestimentoLabel = (tipo?: string) => {
    const found = TIPOS_INVESTIMENTO.find(t => t.value === tipo);
    return found ? found.label.split(" (")[0] : "CDB 100% CDI";
  };

  // ───────────────────────────────────────────────────────────────────────────
  // MODO DE VISUALIZAÇÃO (RESUMO)
  // ───────────────────────────────────────────────────────────────────────────
  if (!isEditing) {
    return (
      <Card className="group p-4 sm:p-5 shadow-soft hover:shadow-elevated border-border/60 hover:border-accent/40 transition-all duration-300 bg-white dark:bg-card rounded-2xl animate-fade-in-up space-y-4">
        {/* Header do Card */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-border/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-accent/10 border border-accent/20 text-accent font-display font-bold text-base flex items-center justify-center shadow-xs">
              {p.nome ? p.nome.charAt(0).toUpperCase() : "?"}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display text-base sm:text-lg font-bold text-foreground leading-tight truncate">
                  {p.nome || "Participante"}
                </h3>
                <span className={`inline-flex items-center text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full shrink-0 ${index === 0 ? "text-accent bg-accent/10 border border-accent/20" : "text-muted-foreground bg-secondary border border-border/60"}`}>
                  {role}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {index === 0 ? "Responsável principal pelo planejamento" : "Coparticipante no plano"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setSaldoEditado(null);
                if (saldoAcumulado > 0 && saldoAcumulado !== p.valorAtual) {
                  atualizarPessoa(p.id, {
                    valorInicial: saldoAcumulado,
                    valorAtual: saldoAcumulado,
                    dataValorAtual: p.dataValorAtual ?? new Date().toISOString()
                  });
                }
                setIsEditing(true);
              }} 
              className="h-8 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/80 rounded-lg transition-colors cursor-pointer"
            >
              <Pencil className="h-3.5 w-3.5 text-accent" />
              <span>Editar</span>
            </Button>
            {index > 0 && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => remover(p.id)} 
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
                title="Remover participante"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Métricas: Renda e Gastos */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-secondary/25 rounded-xl p-3 border border-border/40">
            <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-muted-foreground" /> Receitas
            </p>
            <p className="font-display text-base sm:text-lg font-bold num text-foreground">{brl(rendaTotal)}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {Number(p.renda_complementar) > 0 ? "Principal + Extra" : "Salário líquido"}
            </p>
          </div>
          <div className="bg-secondary/25 rounded-xl p-3 border border-border/40">
            <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <TrendingDown className="h-3.5 w-3.5 text-destructive/80" /> Despesas
            </p>
            <p className="font-display text-base sm:text-lg font-bold num text-destructive">{brl(gastosTotais)}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {p.usar_gastos_detalhados && (p.gastos_detalhados || []).length > 0
                ? `${(p.gastos_detalhados || []).length} item(ns) detalhado(s)`
                : "Gastos mensais"}
            </p>
          </div>
        </div>

        {/* Destaque Financeiro */}
        <div className="bg-secondary/20 rounded-xl p-3.5 sm:p-4 space-y-3 border border-border/40">
          <div className="flex justify-between items-center pb-2.5 border-b border-border/40">
            <span className="text-xs sm:text-sm text-muted-foreground font-medium flex items-center gap-1.5">
              <Wallet className="h-4 w-4 text-muted-foreground" /> Sobra livre estimada
            </span>
            <span className={`font-display text-base sm:text-lg font-bold num ${sobra >= 0 ? "text-success" : "text-destructive"}`}>
              {brl(sobra)}
            </span>
          </div>

          <div className="flex justify-between items-center pb-2.5 border-b border-border/40">
            <span className="text-xs sm:text-sm text-muted-foreground font-medium flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-accent" /> Aporte mensal planejado
            </span>
            <span className="font-display text-base sm:text-lg font-bold num text-foreground">
              {brl(aporteAtual)}
            </span>
          </div>

          <div className="pt-0.5 space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                <Coins className="h-4 w-4 text-accent" /> Já guardado hoje
              </span>
              <div className="flex items-center gap-2">
                <span className="font-display text-base font-bold num text-foreground">{brl(saldoAcumulado)}</span>
                {saldoAcumulado > 0 && (
                  <>
                    {percent > 0 && (
                      <span className="text-[10px] font-display font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">
                        {percent.toFixed(0)}% da meta
                      </span>
                    )}
                    <span className="text-[10px] font-display font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                      {getTipoInvestimentoLabel(p.tipoInvestimento)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // MODO DE EDIÇÃO
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <Card className="bg-white dark:bg-card p-4 sm:p-5 shadow-soft hover:shadow-elevated border-border/60 focus-within:border-accent/40 rounded-2xl transition-all duration-300 flex flex-col gap-4 animate-fade-in-up">
      {/* ── CABEÇALHO DO PARTICIPANTE ─────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-border/40">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-accent/10 border border-accent/20 text-accent font-display font-bold text-base flex items-center justify-center shadow-xs">
            {p.nome ? p.nome.charAt(0).toUpperCase() : <User className="h-5 w-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`inline-flex items-center text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${index === 0 ? "text-accent bg-accent/10 border border-accent/20" : "text-muted-foreground bg-secondary border border-border/60"}`}>
                {role}
              </span>
              <span className="text-[11px] text-muted-foreground hidden sm:inline">• Nome do participante</span>
            </div>
            <Input 
              value={p.nome} 
              onChange={e => atualizarPessoa(p.id, { nome: e.target.value })} 
              className="font-display text-lg sm:text-xl font-bold border-none px-0 focus-visible:ring-0 h-auto bg-transparent text-foreground placeholder:text-muted-foreground/40 leading-none" 
              placeholder="Nome da pessoa"
            />
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {index > 0 && (
            <Button 
              type="button"
              variant="ghost" 
              size="icon" 
              onClick={() => remover(p.id)} 
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
              title="Remover participante"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsEditing(false)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary/80 rounded-lg transition-colors cursor-pointer"
            title="Fechar edição (Cancelar)"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-3.5">
        {/* ── SEÇÃO 1: RECEITAS ────────────────────────────────────────────── */}
        <div className="bg-secondary/20 rounded-xl p-3.5 sm:p-4 border border-border/40 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Briefcase className="h-3.5 w-3.5 text-accent" />
              <span>Receitas Mensais</span>
            </p>
            <span className="text-xs font-medium text-muted-foreground">
              Total: <strong className="font-bold text-foreground num">{brl(rendaTotal)}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Renda Principal</Label>
              <MoneyInput 
                variant="money" 
                min={0} 
                value={Number(p.renda_mensal || 0)} 
                onChange={v => handleUpdateRenda('renda_mensal', v === "" ? 0 : v)} 
                placeholder="0,00"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Renda Extra / Bônus</Label>
              <MoneyInput 
                variant="money" 
                min={0} 
                value={Number(p.renda_complementar || 0)} 
                onChange={v => handleUpdateRenda('renda_complementar', v === "" ? 0 : v)} 
                placeholder="0,00"
              />
            </div>
          </div>
        </div>

        {/* ── SEÇÃO 2: DESPESAS ────────────────────────────────────────────── */}
        <div className="bg-secondary/20 rounded-xl p-3.5 sm:p-4 border border-border/40 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <CreditCard className="h-3.5 w-3.5 text-destructive" />
              <span>Despesas Mensais</span>
            </p>
            {/* Toggle elegante para Detalhar ou Valor Direto */}
            <div className="flex bg-secondary border border-border/60 rounded-lg p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => {
                  atualizarPessoa(p.id, { usar_gastos_detalhados: false });
                  const novaSobra = rendaTotal - Number(p.gastos_mensais || 0);
                  atualizarPessoa(p.id, { aporte_mensal: Math.max(0, novaSobra) });
                }}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition-all cursor-pointer ${!p.usar_gastos_detalhados ? "bg-white dark:bg-card text-foreground shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"}`}
              >
                Valor Total
              </button>
              <button
                type="button"
                onClick={() => {
                  atualizarPessoa(p.id, { usar_gastos_detalhados: true });
                  const newGastosTotais = (p.gastos_detalhados || []).reduce((acc, g) => acc + Number(g.valor), 0);
                  const novaSobra = rendaTotal - newGastosTotais;
                  atualizarPessoa(p.id, { aporte_mensal: Math.max(0, novaSobra) });
                }}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition-all cursor-pointer ${p.usar_gastos_detalhados ? "bg-white dark:bg-card text-foreground shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"}`}
              >
                Detalhar Gastos
              </button>
            </div>
          </div>

          {!p.usar_gastos_detalhados ? (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Total de Despesas do Mês</Label>
              <MoneyInput 
                variant="money" 
                min={0} 
                value={Number(p.gastos_mensais || 0)} 
                onChange={v => handleUpdateGastosDiretos(v === "" ? 0 : v)} 
                placeholder="0,00"
              />
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {(p.gastos_detalhados || []).map(g => (
                <div key={g.id} className="flex items-center gap-2 bg-white dark:bg-card p-2 rounded-xl border border-border/60 shadow-2xs">
                  <Input 
                    value={g.nome} 
                    onChange={e => handleUpdateGasto(g.id, { nome: e.target.value })} 
                    className="flex-1 bg-transparent border-none focus-visible:ring-0 text-xs sm:text-sm font-medium px-2 h-8" 
                    placeholder="Ex: Moradia, Alimentação" 
                  />
                  <div className="w-28 sm:w-32 shrink-0">
                    <MoneyInput 
                      variant="money" 
                      min={0} 
                      value={g.valor} 
                      onChange={v => handleUpdateGasto(g.id, { valor: v === "" ? 0 : v })} 
                      className="bg-secondary/40 border-none focus-visible:ring-0 text-right h-8 text-xs sm:text-sm font-semibold" 
                    />
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer" 
                    onClick={() => handleRemoveGasto(g.id)}
                    title="Excluir item"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}

              {/* Linha para adicionar novo gasto */}
              <div className="flex gap-2 items-end pt-1">
                <div className="flex-1 space-y-1">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Adicionar Categoria</Label>
                  <Input 
                    placeholder="Ex: Mercado, Lazer" 
                    className="h-9 text-xs" 
                    value={novoGasto.nome} 
                    onChange={e => setNovoGasto({ ...novoGasto, nome: e.target.value })} 
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddGasto();
                      }
                    }}
                  />
                </div>
                <div className="w-28 sm:w-32 shrink-0 space-y-1">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Valor (R$)</Label>
                  <MoneyInput 
                    variant="money" 
                    min={0} 
                    placeholder="0,00" 
                    className="h-9 text-xs" 
                    value={novoGasto.valor} 
                    onChange={v => setNovoGasto({ ...novoGasto, valor: v === "" ? 0 : v })} 
                  />
                </div>
                <Button 
                  size="icon" 
                  className="h-9 w-9 bg-accent text-accent-foreground shrink-0 rounded-xl shadow-xs hover:bg-accent/90 transition-all cursor-pointer" 
                  onClick={handleAddGasto} 
                  disabled={!novoGasto.nome.trim() || !novoGasto.valor}
                  title="Inserir despesa"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {gastosTotais > 0 && (
                <div className="flex justify-between items-center pt-2 px-1 text-xs">
                  <span className="text-muted-foreground font-medium">Soma dos gastos detalhados:</span>
                  <span className="font-bold text-destructive num">{brl(gastosTotais)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── SEÇÃO 3: FLUXO MENSAL & APORTE PLANEJADO ─────────────────────── */}
        <div className="bg-secondary/20 rounded-xl p-3.5 sm:p-4 border border-border/40 space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-border/40 gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Wallet className="h-3.5 w-3.5 text-accent" />
                <span>Sobra Líquida Estimada</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Receita ({brl(rendaTotal)}) − Despesas ({brl(gastosTotais)})
              </p>
            </div>
            <div className="text-right">
              <span className={`font-display text-lg sm:text-xl font-bold num ${sobra >= 0 ? "text-success" : "text-destructive"}`}>
                {brl(sobra)}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-accent" />
                <span>Aporte Mensal Planejado</span>
              </Label>
              {sobra > 0 && aporteAtual !== sobra && (
                <button
                  type="button"
                  onClick={() => atualizarPessoa(p.id, { aporte_mensal: Math.max(0, sobra) })}
                  className="text-[11px] font-semibold text-accent hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="h-3 w-3" /> Usar sobra ({brl(sobra)})
                </button>
              )}
            </div>
            <MoneyInput
              variant="money"
              min={0}
              value={aporteAtual}
              onChange={v => atualizarPessoa(p.id, { aporte_mensal: v === "" ? 0 : v })}
              placeholder="R$ 0,00"
            />
          </div>
        </div>

        {/* ── SEÇÃO 4: RESERVA ATUAL (JÁ GUARDADO HOJE) ────────────────────── */}
        <div className="bg-secondary/20 rounded-xl p-3.5 sm:p-4 border border-border/40 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Coins className="h-3.5 w-3.5 text-accent" />
              <span>Já Guardado Hoje</span>
            </p>
            <span className="text-[11px] text-muted-foreground">Último saldo do participante</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-foreground">Saldo Atual (R$)</Label>
                {saldoAcumulado > valorBase && (
                  <span className="text-[10px] text-success font-semibold flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Atualizado c/ rendimento
                  </span>
                )}
              </div>
              <MoneyInput
                variant="money"
                min={0}
                value={displaySaldo}
                onChange={v => {
                  const val = v === "" ? "" : Number(v);
                  setSaldoEditado(val);
                  const numVal = val === "" ? 0 : val;
                  atualizarPessoa(p.id, {
                    valorInicial: numVal,
                    valorAtual: numVal,
                    dataValorAtual: new Date().toISOString()
                  });
                }}
                placeholder="0,00"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Onde está aplicado?</Label>
              <div className="relative">
                <select
                  value={p.tipoInvestimento || "cdb_100"}
                  onChange={(e) => atualizarPessoa(p.id, { tipoInvestimento: e.target.value })}
                  className="w-full h-10 rounded-xl border border-border bg-background px-3 pr-8 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 cursor-pointer transition-colors hover:border-accent/40"
                >
                  {TIPOS_INVESTIMENTO.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTÕES DE AÇÃO: CANCELAR E CONCLUIR ────────────────────────────── */}
      <div className="pt-1 flex items-center gap-2.5">
        <Button 
          type="button"
          variant="outline"
          onClick={() => {
            setSaldoEditado(null);
            setIsEditing(false);
          }} 
          className="flex-1 h-10 text-sm font-semibold border-border/80 hover:bg-secondary/60 text-muted-foreground hover:text-foreground rounded-xl transition-all cursor-pointer"
        >
          Cancelar
        </Button>
        <Button 
          type="button"
          onClick={() => {
            if (typeof saldoEditado === "number" && saldoEditado !== p.valorAtual) {
              atualizarPessoa(p.id, {
                valorInicial: saldoEditado,
                valorAtual: saldoEditado,
                dataValorAtual: new Date().toISOString()
              });
            }
            setSaldoEditado(null);
            setIsEditing(false);
          }} 
          className="flex-1 h-10 text-sm font-semibold bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
        >
          <Check className="h-4 w-4" />
          <span>Concluir</span>
        </Button>
      </div>
    </Card>
  );
}
