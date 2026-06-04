"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import React from "react";
import { createPortal } from "react-dom";
import { usePlanContext } from "@/context/PlanContext";
import { Card } from "@/components/ui/card";
import { brl, simular } from "@/lib/finance";
import { useRouter } from "next/navigation";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine, ReferenceDot, Legend } from "recharts";
import { CalendarCheck, Coins, TrendingUp, Wallet, Info, User, Check, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SimulacaoService } from "@/services/SimulacaoService";

// ─── Editable Aporte Cell ────────────────────────────────────────────────────
function EditableAporte({ value, onSave, isEdited }: { value: number; onSave: (v: number) => void; isEdited: boolean }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value.toFixed(2));
  useEffect(() => { setVal(value.toFixed(2)); }, [value]);

  if (editing) {
    return (
      <input
        autoFocus
        type="number"
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={() => {
          setEditing(false);
          const num = parseFloat(val);
          if (!isNaN(num) && num >= 0) onSave(num);
          else setVal(value.toFixed(2));
        }}
        onKeyDown={e => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") { setVal(value.toFixed(2)); setEditing(false); }
        }}
        className="w-24 text-right bg-background border border-border rounded px-1.5 py-0.5 outline-none text-foreground text-xs font-medium"
      />
    );
  }

  return (
    <div
      onClick={() => setEditing(true)}
      className={`cursor-pointer hover:bg-accent/10 px-1.5 py-0.5 rounded transition-colors border border-transparent hover:border-accent/20 text-right ${isEdited ? "text-accent font-bold" : ""}`}
      title="Clique para editar"
    >
      {brl(value)}
    </div>
  );
}

// ─── Extras Cell (context aportes) ────────────────────────
type ContextExtra = { origem: string; valor: number; pessoaNome?: string };
type PessoaAporte = { nome: string; aporte: number };

function ExtrasCell({ contextItems, total, aporteRegular, pessoasAportes }: {
  contextItems: ContextExtra[];
  total: number;
  aporteRegular: number;
  pessoasAportes: PessoaAporte[];
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [portalPos, setPortalPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPortalPos({
        top: rect.bottom + window.scrollY,
        left: rect.left + rect.width - 288 + window.scrollX,
      });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const hasExtras = (contextItems ?? []).length > 0;
  const hasAporte = aporteRegular > 0;
  const canOpen = hasExtras || hasAporte;

  return (
    <div ref={triggerRef}>
      <div
        onClick={() => { if (canOpen) setOpen(o => !o); }}
        className={`flex items-center justify-end gap-1 px-1.5 py-0.5 rounded transition-colors border border-transparent ${total > 0 ? "cursor-pointer hover:bg-accent/10 hover:border-accent/20 text-accent font-semibold" : "text-muted-foreground/40"}`}
        title={canOpen ? "Clique para ver detalhes" : undefined}
      >
        {total > 0 ? `+${brl(total)}` : "—"}
        {total > 0 && (open ? <ChevronUp className="h-3 w-3 shrink-0" /> : <ChevronDown className="h-3 w-3 shrink-0" />)}
      </div>

      {open && canOpen && typeof document !== "undefined" && createPortal(
        <div
          className="fixed z-50 w-72 bg-card border border-border rounded-xl shadow-xl p-3 space-y-3"
          style={{ top: `${portalPos.top + 4}px`, left: `${Math.max(8, portalPos.left)}px` }}
        >
          {/* Aporte regular por pessoa */}
          {hasAporte && pessoasAportes.length > 0 && (
            <div className="space-y-1">
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Aporte regular</p>
              {pessoasAportes.map((p, i) => (
                <div key={i} className="flex items-center justify-between text-[11px] gap-2 py-0.5">
                  <span className="text-foreground font-medium truncate">{p.nome}</span>
                  <span className="num text-foreground shrink-0">{brl(p.aporte)}</span>
                </div>
              ))}
              <div className="flex justify-between text-[11px] font-semibold pt-1 border-t border-border/50">
                <span className="text-muted-foreground">Total aporte</span>
                <span className="num">{brl(aporteRegular)}</span>
              </div>
            </div>
          )}

          {/* Extras */}
          {hasExtras && (
            <div className="space-y-1">
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Extras do mês</p>
              {contextItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-[11px] gap-2 py-0.5">
                  <div className="flex flex-col min-w-0">
                    <span className="truncate text-foreground font-medium">{item.origem}</span>
                    <span className="text-[10px] text-muted-foreground">{item.pessoaNome || "Conjunto"}</span>
                  </div>
                  <span className="num text-accent shrink-0 font-semibold">+{brl(item.valor)}</span>
                </div>
              ))}
              <div className="flex justify-between text-[11px] font-semibold pt-1 border-t border-border/50">
                <span className="text-muted-foreground">Total extras</span>
                <span className="num text-accent">+{brl(total)}</span>
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function ResultadoPage() {
  const { objetivo, pessoas, aportesExtras, aportesRegularesEditados, setAportesRegularesEditados, saveDraft, mesesConcluidos, setMesesConcluidos, planoId } = usePlanContext();
  const router = useRouter();

  // Salvar registro de simulação no backend ao carregar a página
  const registroSalvo = useRef(false);
  useEffect(() => {
    if (!planoId || planoId.startsWith("local-draft-")) return;
    if (registroSalvo.current) return;
    registroSalvo.current = true;

    const payload = {
      objetivoId: planoId,
      taxaCDI: Number(objetivo?.taxaCdiAnual) || 10.5,
      aportesMensais: pessoas.map(p => ({
        pessoaId: p.id || "",
        valor: Number(p.aporte_mensal) || 0
      })),
      aportesExtras: aportesExtras.map(a => ({
        pessoaId: a.pessoaId || "",
        valor: Number(a.valor) || 0,
        data: a.data || new Date().toISOString(),
        origem: a.origem || "Extra"
      }))
    };

    SimulacaoService.salvarRegistroSimulacao(payload).catch(err => {
      console.error("Erro ao salvar registro de simulação:", err);
    });
  }, [planoId, objetivo, pessoas, aportesExtras]);

  // Convert mesesConcluidos array to Set for easier manipulation
  const mesesConcluidosSet = useMemo(() => new Set(mesesConcluidos), [mesesConcluidos]);

  // Save mesesConcluidos to database when it changes
  const isFirstRender = useRef(true);
  const prevMesesRef = useRef<number[]>(mesesConcluidos);
  
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevMesesRef.current = mesesConcluidos;
      return;
    }
    
    const prev = prevMesesRef.current;
    const curr = mesesConcluidos;
    
    // Evitar save se o conteúdo não mudou
    if (prev.length === curr.length && prev.every((v, i) => v === curr[i])) {
      return;
    }
    
    prevMesesRef.current = curr;
    saveDraft({ mesesConcluidos: curr });
  }, [mesesConcluidos, saveDraft]);

  const aporteTotal = pessoas.reduce((s, p) => s + Number(p.aporte_mensal ?? 0), 0);

  const pessoasGuardadoSum = pessoas.reduce((s, p) => s + (p.valorInicial ?? 0), 0);
  const totalGuardado = pessoasGuardadoSum > 0 ? pessoasGuardadoSum : Number(objetivo?.valorJaGuardado ?? 0);

  // Build combined extras: aportesExtras (from context) + extrasInline
  const inicio = objetivo?.dataInicio ? new Date(objetivo.dataInicio + 'T12:00:00') : new Date();

  const combinedExtras = useMemo(() => {
    return aportesExtras.map(a => ({ ...a, valor: Number(a.valor) }));
  }, [aportesExtras]);

  const sim = useMemo(() => simular({
    valorImovel: Number(objetivo?.valorImovel ?? 0),
    percentualEntrada: Number(objetivo?.percentualEntrada ?? 0),
    percentualCustosExtras: Number(objetivo?.percentualCustosExtras ?? 0),
    valorJaGuardado: totalGuardado,
    taxaCdiAnual: Number(objetivo?.taxaCdiAnual ?? 0),
    percentualCdi: Number(objetivo?.percentualCdi ?? 100),
    aporteMensalTotal: aporteTotal,
    aportesRegularesEditados: aportesRegularesEditados,
    dataInicio: objetivo?.dataInicio ?? new Date(),
    aportesExtras: combinedExtras,
    prazoMaxMeses: objetivo?.prazoMaxMeses ?? 600,
  }), [objetivo, combinedExtras, aporteTotal, totalGuardado, aportesRegularesEditados]);

  const chartData = sim.rows.map(r => ({
    mes: r.mes,
    label: new Date(r.data).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
    investido: Math.round(r.totalInvestido),
    saldo: Math.round(r.saldoAcumulado),
  }));

  const dataMeta = sim.dataAtingiuMeta
    ? new Date(sim.dataAtingiuMeta).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    : null;
  const pontoMeta = chartData.find(d => d.mes === sim.mesAtingiuMeta);
  const dataCross = pontoMeta ? pontoMeta.label : undefined;

  const tableRows = useMemo(() => {
    const saldos = Object.fromEntries(pessoas.map(p => [p.nome, p.valorInicial ?? 0]));
    let saldoConjunto = 0;
    let rentabilidadeAcumulada = 0;
    let saldoAnterior = totalGuardado; // Track saldoAnterior explicitly as mutable variable

    return sim.rows.map(r => {
      const isExtra = r.aportesExtras > 0;
      const atingiu = sim.mesAtingiuMeta === r.mes;

      const extrasMes = combinedExtras.filter(a => {
        const d = new Date(a.data + 'T12:00:00');
        const mesOffset = (d.getFullYear() - inicio.getFullYear()) * 12 + (d.getMonth() - inicio.getMonth()) + 1;
        return mesOffset === r.mes;
      });

      const extrasPorPessoa: Record<string, number> = {};
      let extrasConjunto = 0;
      extrasMes.forEach(a => {
        if (a.pessoaNome) extrasPorPessoa[a.pessoaNome] = (extrasPorPessoa[a.pessoaNome] || 0) + Number(a.valor);
        else extrasConjunto += Number(a.valor);
      });

      const saldoTotalAnterior = saldoAnterior; // Use tracked saldoAnterior instead of reverse calculation
      const novosSaldos: Record<string, number> = {};
      const defaultAporte = r.mes === 1 ? 0 : aporteTotal;
      const isEdited = r.aporteRegular !== defaultAporte;

      pessoas.forEach(p => {
        const proporcao = saldoTotalAnterior > 0 ? (saldos[p.nome] || 0) / saldoTotalAnterior : 0;
        const rendimentoPessoa = proporcao * r.rendimentoLiquido;
        const baseAporte = r.mes === 1 ? 0 : (Number(p.aporte_mensal) || 0);
        let aporteFinal = baseAporte;
        if (isEdited && defaultAporte > 0) aporteFinal = (baseAporte / defaultAporte) * r.aporteRegular;
        else if (isEdited) aporteFinal = 0;
        const extra = extrasPorPessoa[p.nome] || 0;
        novosSaldos[p.nome] = (saldos[p.nome] || 0) + aporteFinal + extra + rendimentoPessoa;
      });

      const proporcaoConjunto = saldoTotalAnterior > 0 ? saldoConjunto / saldoTotalAnterior : 0;
      const rendimentoConjunto = proporcaoConjunto * r.rendimentoLiquido;
      // Edge case: when defaultAporte === 0 (month 1), edited aportes go to saldoConjunto
      // instead of being distributed proportionally to individuals. This is intentional
      // since month 1 has no regular aporte by default, so any edited value is treated
      // as an extra contribution to the joint balance.
      const diffConjunto = isEdited && defaultAporte === 0 ? r.aporteRegular : 0;
      const novoSaldoConjunto = saldoConjunto + extrasConjunto + rendimentoConjunto + diffConjunto;

      pessoas.forEach(p => { saldos[p.nome] = novosSaldos[p.nome]; });
      saldoConjunto = novoSaldoConjunto;
      saldoAnterior = r.saldoAcumulado; // Update saldoAnterior for next iteration

      const percentRendimento = saldoTotalAnterior > 0 ? (r.rendimentoLiquido / saldoTotalAnterior) * 100 : 0;
      rentabilidadeAcumulada += r.rendimentoLiquido;
      const percentRentabilidade = r.totalInvestido > 0 ? (rentabilidadeAcumulada / r.totalInvestido) * 100 : 0;

      return {
        ...r,
        atingiu,
        isExtra,
        percentRendimento,
        saldosIndividuais: novosSaldos,
        saldoConjunto: novoSaldoConjunto,
        rentabilidadeAcumulada,
        percentRentabilidade,
        extrasPorPessoa,
      };
    });
  }, [sim.rows, pessoas, combinedExtras, inicio, sim.mesAtingiuMeta, aporteTotal, totalGuardado]);

  const targetMonthIndex = sim.mesAtingiuMeta ? sim.mesAtingiuMeta - 1 : sim.rows.length - 1;
  const targetRow = tableRows[targetMonthIndex];

  const toggleConcluido = (mes: number) => {
    setMesesConcluidos(prev => {
      if (prev.includes(mes)) {
        return prev.filter(m => m !== mes);
      } else {
        return [...prev, mes];
      }
    });
  };

  return (
    <div className="max-w-[1400px] w-full px-4 md:px-6 mx-auto space-y-7">
      {/* Header */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-1">Etapa 4 de 4</p>
        <h1 className="font-display text-3xl md:text-4xl mb-1.5 font-light">Seu plano em números</h1>
        <p className="text-muted-foreground text-sm">O resultado de tudo o que você preencheu nas etapas anteriores.</p>
      </div>

      {/* Como é calculado */}
      <div className="bg-secondary/30 border border-border/50 rounded-lg p-4">
        <details className="group cursor-pointer">
          <summary className="flex items-center gap-2 font-medium text-sm text-foreground select-none">
            <Info className="h-4 w-4 text-accent shrink-0" />
            Como este cálculo é feito?
            <span className="ml-auto text-xs text-muted-foreground group-open:hidden">Ver</span>
          </summary>
          <div className="mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground pl-6">
            <ul className="list-disc list-outside space-y-1.5 ml-4">
              <li><strong className="text-foreground">Meta de {brl(sim.meta)}:</strong> Entrada + Custos Extras (Etapa 1).</li>
              <li><strong className="text-foreground">Aportes de {brl(aporteTotal)}/mês:</strong> Soma dos participantes (Etapa 2). O mês 1 não tem aporte — apenas o saldo inicial rende.</li>
              <li><strong className="text-foreground">Rendimento:</strong> {objetivo?.percentualCdi}% do CDI (≈ {(Number(objetivo?.taxaCdiAnual) * Number(objetivo?.percentualCdi) / 100).toFixed(2)}% a.a.), com IR regressivo (22,5% → 15%).</li>
            </ul>
          </div>
        </details>
      </div>

      {/* Top Cards — compact */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-4 border-border/50 bg-primary/5 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-primary font-medium mb-2">
            <CalendarCheck className="h-3.5 w-3.5" /> Atinge a meta em
          </div>
          <p className="font-display text-2xl xl:text-3xl text-primary leading-tight">{dataMeta ?? "Não no prazo"}</p>
        </Card>
        <Card className="p-4 border-border/50 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-medium">
            <Wallet className="h-3.5 w-3.5" /> Total acumulado
          </div>
          <p className="font-display text-2xl num">{brl(targetRow ? targetRow.saldoAcumulado : sim.saldoFinal)}</p>
        </Card>
        <Card className="p-4 border-border/50 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-medium">
            <Coins className="h-3.5 w-3.5" /> Total investido
          </div>
          <p className="font-display text-2xl num">{brl(targetRow ? targetRow.totalInvestido : sim.totalInvestido)}</p>
        </Card>
        <Card className="p-4 border-border/50 flex flex-col justify-center bg-[#3B6D11]/5">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-[#3B6D11] dark:text-[#80B551] mb-2 font-medium">
            <TrendingUp className="h-3.5 w-3.5" /> Lucro líquido
          </div>
          <p className="font-display text-2xl num text-[#3B6D11] dark:text-[#80B551]">+{brl(targetRow ? (targetRow.saldoAcumulado - targetRow.totalInvestido) : sim.lucroLiquido)}</p>
        </Card>
      </div>

      {/* Chart */}
      <Card className="p-4 border-border/50">
        <h2 className="font-display text-xl font-light mb-4">Evolução do patrimônio</h2>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height={320} minWidth={0}>
            <AreaChart data={chartData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gSaldo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gInv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickMargin={8} minTickGap={30} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} width={52} tickMargin={8} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                formatter={(value: any, name: any) => [brl(Number(value)), name]}
                labelFormatter={label => `Período: ${label}`}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }} />
              <ReferenceLine y={sim.meta} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" label={{ value: "Meta", position: "insideTopLeft", fill: "hsl(var(--muted-foreground))", fontSize: 11, offset: 12 }} />
              {dataCross && <ReferenceDot x={dataCross} y={sim.meta} r={5} fill="hsl(var(--primary))" stroke="hsl(var(--background))" strokeWidth={2} />}
              <Area type="monotone" dataKey="investido" stroke="hsl(var(--primary))" fill="url(#gInv)" strokeWidth={2} name="Total Investido" />
              <Area type="monotone" dataKey="saldo" stroke="hsl(var(--accent))" fill="url(#gSaldo)" strokeWidth={2.5} name="Saldo Acumulado" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Resumo Financeiro & Aportes Extras */}
      <div className="grid lg:grid-cols-3 gap-6 pt-4 border-t border-border/40">
        {/* Resumo Financeiro (left side: 2 columns) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-display text-xl font-light">Resumo Financeiro</h2>
          <div className="grid md:grid-cols-3 gap-4">

            {/* Valor Inicial */}
            <Card className="p-4 border-border/50 bg-card shadow-soft">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5 mb-2"><Wallet className="h-3.5 w-3.5" /> Valor inicial</p>
              <p className="font-display text-2xl num mb-3">{brl(totalGuardado)}</p>
              <div className="space-y-2">
                {pessoas.map(p => {
                  const valor = p.valorInicial ?? 0;
                  const percent = totalGuardado > 0 ? (valor / totalGuardado) * 100 : 0;
                  return (
                    <div key={p.id} className="space-y-1">
                      <div className="flex justify-between text-xs items-end">
                        <span className="flex items-center gap-1 text-muted-foreground"><User className="h-3 w-3" /> {p.nome}</span>
                        <span className="num font-medium">{brl(valor)} <span className="text-muted-foreground">({percent.toFixed(0)}%)</span></span>
                      </div>
                      <div className="h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Valor Aportado */}
            <Card className="p-4 border-border/50 bg-card shadow-soft">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5 mb-2"><Coins className="h-3.5 w-3.5" /> Valor aportado</p>
              <p className="font-display text-2xl num mb-3">{brl(targetRow ? targetRow.totalInvestido - totalGuardado : 0)}</p>
              <div className="space-y-2">
                {(() => {
                  const meses = sim.mesAtingiuMeta ?? sim.rows.length;
                  const extrasMap: Record<string, number> = {};
                  let conjuntoExtra = 0;
                  aportesExtras.forEach(a => {
                    const d = new Date(a.data + 'T12:00:00');
                    const mesOffset = (d.getFullYear() - inicio.getFullYear()) * 12 + (d.getMonth() - inicio.getMonth()) + 1;
                    if (mesOffset <= meses) {
                      if (a.pessoaNome) extrasMap[a.pessoaNome] = (extrasMap[a.pessoaNome] || 0) + Number(a.valor);
                      else conjuntoExtra += Number(a.valor);
                    }
                  });
                  const totalAportadoGeral = targetRow ? targetRow.totalInvestido - totalGuardado : 0;
                  const lista = pessoas.map(p => {
                    const aportesRegularesSum = sim.rows.slice(0, meses).reduce((sum, row) => {
                      if (row.mes === 1) return sum;
                      const defaultAporte = row.mes === 1 ? 0 : aporteTotal;
                      const isEdited = row.aporteRegular !== defaultAporte;
                      if (isEdited) {
                         const baseAporte = Number(p.aporte_mensal) || 0;
                         const proporcao = defaultAporte > 0 ? baseAporte / defaultAporte : 0;
                         return sum + (proporcao * row.aporteRegular);
                      } else {
                         return sum + (Number(p.aporte_mensal) || 0);
                      }
                    }, 0);
                    const v = aportesRegularesSum + (extrasMap[p.nome] || 0);
                    return { nome: p.nome, valor: v, percent: totalAportadoGeral > 0 ? (v / totalAportadoGeral) * 100 : 0 };
                  });
                  if (conjuntoExtra > 0) lista.push({ nome: "Conjunto", valor: conjuntoExtra, percent: totalAportadoGeral > 0 ? (conjuntoExtra / totalAportadoGeral) * 100 : 0 });
                  return lista.map((item, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs items-end">
                        <span className="flex items-center gap-1 text-muted-foreground"><User className="h-3 w-3" /> {item.nome}</span>
                        <span className="num font-medium">{brl(item.valor)} <span className="text-muted-foreground">({item.percent.toFixed(0)}%)</span></span>
                      </div>
                      <div className="h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${item.percent}%` }} />
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </Card>

            {/* Total Acumulado */}
            <Card className="p-4 border-border/50 bg-[#3B6D11]/5 shadow-soft">
              <p className="text-[10px] uppercase tracking-wider text-[#3B6D11] dark:text-[#80B551] font-medium flex items-center gap-1.5 mb-2"><TrendingUp className="h-3.5 w-3.5" /> Total acumulado</p>
              <p className="font-display text-2xl num text-[#3B6D11] dark:text-[#80B551] mb-3">{brl(targetRow ? targetRow.saldoAcumulado : sim.saldoFinal)}</p>
              <div className="space-y-2">
                {(() => {
                  const rRow = targetRow || sim.rows[sim.rows.length - 1];
                  if (!rRow) return null;
                  const total = rRow.saldoAcumulado;
                  const lista = pessoas.map(p => {
                    const v = rRow.saldosIndividuais[p.nome] || 0;
                    return { nome: p.nome, valor: v, percent: total > 0 ? (v / total) * 100 : 0 };
                  });
                  if (rRow.saldoConjunto > 0) lista.push({ nome: "Conjunto", valor: rRow.saldoConjunto, percent: total > 0 ? (rRow.saldoConjunto / total) * 100 : 0 });
                  return lista.map((item, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs items-end">
                        <span className="flex items-center gap-1 text-[#3B6D11]/70 dark:text-[#80B551]/70"><User className="h-3 w-3" /> {item.nome}</span>
                        <span className="num font-medium">{brl(item.valor)} <span className="text-muted-foreground">({item.percent.toFixed(0)}%)</span></span>
                      </div>
                      <div className="h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden">
                        <div className="h-full bg-[#3B6D11] dark:bg-[#80B551] transition-all duration-500" style={{ width: `${item.percent}%` }} />
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </Card>
          </div>
        </div>

        {/* Aportes Extras Cadastrados (right side: 1 column) */}
        <div className="space-y-4">
          <h2 className="font-display text-xl font-light">Aportes Extras Cadastrados</h2>
          <Card className="p-4 border-border/50 shadow-soft bg-card h-[286px] overflow-y-auto">
            {aportesExtras.length === 0 ? (
              <div className="text-center text-muted-foreground py-12 flex flex-col items-center justify-center h-full">
                <Coins className="h-8 w-8 opacity-20 mb-2" />
                <p className="text-xs">Nenhum aporte extra programado.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {aportesExtras.map((a, i) => (
                  <div key={i} className={`flex items-center justify-between text-xs ${i > 0 ? "pt-3 border-t border-border/40" : ""}`}>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate text-foreground">{a.origem}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {new Date(a.data + "T12:00:00").toLocaleDateString("pt-BR")} · {a.pessoaNome ?? "Conjunto"}
                      </p>
                    </div>
                    <span className="num font-semibold text-accent text-sm shrink-0 ml-2">+{brl(Number(a.valor))}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Tabela mês a mês */}
      <div>
        <div className="mb-3">
          <h2 className="font-display text-xl font-light">Tabela mês a mês</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Clique no mês para marcá-lo como concluído. Clique em Extras para detalhar lançamentos. Aporte é editável.</p>
        </div>

        <div className="overflow-x-auto max-h-[560px] border border-border/50 rounded-xl shadow-sm bg-card relative">
          <table className="w-full text-xs">
            <thead className="sticky top-0 z-10 bg-secondary/95 backdrop-blur-sm text-muted-foreground shadow-sm">
              <tr>
                <Th>Mês</Th>
                <Th>Data</Th>
                <Th right>Aporte</Th>
                <Th right>Extras</Th>
                <Th right>Total Aporte</Th>
                <Th right>Rend. Bruto</Th>
                <Th right>IR</Th>
                <Th right>Rend. Líquido</Th>
                <Th right>Saldo Acumulado</Th>
                <Th right>% Meta</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {tableRows.map(r => {
                const defaultAporte = r.mes === 1 ? 0 : aporteTotal;
                const isEdited = r.aporteRegular !== defaultAporte;
                const isConcluido = mesesConcluidosSet.has(r.mes);
                const totalExtras = r.aportesExtras;
                const totalAporteMes = r.aporteRegular + totalExtras;
                const progressoMeta = sim.meta > 0 ? (r.saldoAcumulado / sim.meta) * 100 : 0;

                return (
                  <tr
                    key={r.mes}
                    className={`transition-colors hover:bg-secondary/20 ${r.atingiu ? "bg-primary/10 shadow-[inset_3px_0_0_0_hsl(var(--primary))]" : ""} ${isConcluido && !r.atingiu ? "bg-teal-500/5" : ""} ${r.isExtra && !r.atingiu && !isConcluido ? "bg-accent/5" : ""}`}
                  >
                    {/* Mês — check manual */}
                    <Td className="font-medium">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => toggleConcluido(r.mes)}
                          title={isConcluido ? "Desmarcar" : "Marcar como concluído"}
                          className={`w-6 h-6 rounded flex items-center justify-center border transition-colors shrink-0 ${isConcluido ? "bg-teal-600/20 border-teal-600/50 text-teal-600 dark:text-teal-400" : "border-border/50 hover:border-teal-500/50 hover:bg-teal-500/10"}`}
                        >
                          {isConcluido && <Check className="h-4 w-4" />}
                        </button>
                        <span className={isConcluido ? "text-teal-700 dark:text-teal-400" : "text-muted-foreground"}>{r.mes}</span>
                        {r.atingiu && <span className="px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[9px] uppercase font-bold tracking-wider">Meta</span>}
                      </div>
                    </Td>

                    <Td suppressHydrationWarning className="text-muted-foreground whitespace-nowrap">
                      {new Date(r.data).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
                    </Td>

                    {/* Aporte editável */}
                    <Td right>
                      <EditableAporte
                        value={r.aporteRegular}
                        isEdited={isEdited}
                        onSave={v => {
                          setAportesRegularesEditados((prev: Record<number, number>) => {
                            const copy = { ...prev };
                            if (v === defaultAporte) delete copy[r.mes];
                            else copy[r.mes] = v;
                            return copy;
                          });
                          const updated = { ...aportesRegularesEditados };
                          if (v === defaultAporte) delete updated[r.mes];
                          else updated[r.mes] = v;
                          saveDraft({ aportesRegularesEditados: updated });
                        }}
                      />
                    </Td>

                    {/* Extras expandíveis — aportes do contexto */}
                    <Td right>
                      {(() => {
                        const ctxItems: ContextExtra[] = aportesExtras
                          .filter(a => {
                            const d = new Date(a.data + 'T12:00:00');
                            const mesOffset = (d.getFullYear() - inicio.getFullYear()) * 12 + (d.getMonth() - inicio.getMonth()) + 1;
                            return mesOffset === r.mes;
                          })
                          .map(a => ({ origem: a.origem, valor: Number(a.valor), pessoaNome: a.pessoaNome }));

                        const pessoasAportes: PessoaAporte[] = pessoas.map(p => {
                          const baseAporte = r.mes === 1 ? 0 : (Number(p.aporte_mensal) || 0);
                          let aporteFinal = baseAporte;
                          if (isEdited && aporteTotal > 0) aporteFinal = (baseAporte / aporteTotal) * r.aporteRegular;
                          else if (isEdited) aporteFinal = 0;
                          return { nome: p.nome, aporte: aporteFinal };
                        }).filter(p => p.aporte > 0);

                        return (
                          <ExtrasCell
                            contextItems={ctxItems}
                            total={totalExtras}
                            aporteRegular={r.aporteRegular}
                            pessoasAportes={pessoasAportes}
                          />
                        );
                      })()}
                    </Td>

                    {/* Total Aporte do Mês */}
                    <Td right className="font-medium text-foreground">
                      {brl(totalAporteMes)}
                    </Td>

                    {/* Rendimento Bruto */}
                    <Td right className="text-muted-foreground">
                      {brl(r.rendimentoBruto)}
                    </Td>

                    {/* IR */}
                    <Td right className="text-muted-foreground/70">
                      {brl(r.imposto)}
                    </Td>

                    {/* Rendimento Líquido */}
                    <Td right className="text-[#3B6D11] dark:text-[#80B551] font-medium">
                      {r.rendimentoLiquido > 0 ? `+${brl(r.rendimentoLiquido)}` : brl(r.rendimentoLiquido)}
                    </Td>

                    {/* Saldo Acumulado */}
                    <Td right className="font-bold text-sm text-foreground">{brl(r.saldoAcumulado)}</Td>

                    {/* Progresso % */}
                    <Td right className="font-medium">
                      <span className={progressoMeta >= 100 ? "text-primary" : "text-muted-foreground"}>
                        {progressoMeta.toFixed(1)}%
                      </span>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return <th className={`px-3 py-2.5 text-[10px] font-medium uppercase tracking-wider whitespace-nowrap ${right ? "text-right" : "text-left"}`}>{children}</th>;
}
function Td({ children, right, className = "", suppressHydrationWarning }: { children: React.ReactNode; right?: boolean; className?: string; suppressHydrationWarning?: boolean }) {
  return <td suppressHydrationWarning={suppressHydrationWarning} className={`px-3 py-[5px] num ${right ? "text-right" : "text-left"} ${className}`}>{children}</td>;
}
