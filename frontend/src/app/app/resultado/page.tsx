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
import { TabelaMesAMes } from "@/components/TabelaMesAMes";

// ─── Page ────────────────────────────────────────────────────────────────────
export default function ResultadoPage() {
  const { objetivo, pessoas, aportesExtras, aportesRegularesEditados, setAportesRegularesEditados, saveDraft, mesesConcluidos, setMesesConcluidos, planoId, aportesRegularesEditadosPorPessoa } = usePlanContext();
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

  const virtualAportesRegularesEditados = useMemo(() => {
    const virtualMap: Record<number, number> = {};
    const prazoMax = objetivo?.prazoMaxMeses ?? 600;
    
    for (let mes = 1; mes <= prazoMax; mes++) {
      let isEditedInMonth = false;
      let totalForMonth = 0;
      
      pessoas.forEach(p => {
        const editedValue = aportesRegularesEditadosPorPessoa[p.id]?.[mes];
        if (editedValue !== undefined) {
          isEditedInMonth = true;
          totalForMonth += editedValue;
        } else {
          totalForMonth += Number(p.aporte_mensal) || 0;
        }
      });
      
      if (!isEditedInMonth && aportesRegularesEditados[mes] !== undefined) {
          virtualMap[mes] = aportesRegularesEditados[mes];
      } else if (isEditedInMonth) {
          virtualMap[mes] = totalForMonth;
      }
    }
    return virtualMap;
  }, [pessoas, aportesRegularesEditadosPorPessoa, aportesRegularesEditados, objetivo?.prazoMaxMeses]);

  const sim = useMemo(() => simular({
    valorImovel: Number(objetivo?.valorImovel ?? 0),
    percentualEntrada: Number(objetivo?.percentualEntrada ?? 0),
    percentualCustosExtras: Number(objetivo?.percentualCustosExtras ?? 0),
    valorJaGuardado: totalGuardado,
    taxaCdiAnual: Number(objetivo?.taxaCdiAnual ?? 0),
    percentualCdi: Number(objetivo?.percentualCdi ?? 100),
    aporteMensalTotal: aporteTotal,
    aportesRegularesEditados: virtualAportesRegularesEditados,
    dataInicio: objetivo?.dataInicio ?? new Date(),
    aportesExtras: combinedExtras,
    prazoMaxMeses: objetivo?.prazoMaxMeses ?? 600,
  }), [objetivo, combinedExtras, aporteTotal, totalGuardado, virtualAportesRegularesEditados]);

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

  const targetMonthIndex = sim.mesAtingiuMeta ? sim.mesAtingiuMeta - 1 : sim.rows.length - 1;
  const targetRow = tableRows[targetMonthIndex];

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
                  
                  // Re-calculate the final individual balances based on the new logic
                  const saldos = Object.fromEntries(pessoas.map(p => [p.nome, p.valorInicial ?? 0]));
                  let saldoConjunto = 0;
                  let saldoAnterior = totalGuardado;
                  
                  for (let i = 0; i <= targetMonthIndex; i++) {
                    const r = sim.rows[i];
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
                    
                    const saldoTotalAnterior = saldoAnterior;
                    const novosSaldos: Record<string, number> = {};
                    const defaultAporte = r.mes === 1 ? 0 : aporteTotal;
                    const isLegacyEdited = aportesRegularesEditados[r.mes] !== undefined;
                    
                    const aporteFinalPorPessoa: Record<string, number> = {};
                    pessoas.forEach(p => {
                      if (r.mes === 1) {
                        aporteFinalPorPessoa[p.id] = 0;
                      } else {
                        const editedValue = aportesRegularesEditadosPorPessoa[p.id]?.[r.mes];
                        if (editedValue !== undefined) {
                          aporteFinalPorPessoa[p.id] = editedValue;
                        } else if (isLegacyEdited && defaultAporte > 0) {
                          aporteFinalPorPessoa[p.id] = ((Number(p.aporte_mensal) || 0) / defaultAporte) * (aportesRegularesEditados[r.mes] || 0);
                        } else {
                          aporteFinalPorPessoa[p.id] = Number(p.aporte_mensal) || 0;
                        }
                      }
                    });
                    
                    pessoas.forEach(p => {
                      const proporcao = saldoTotalAnterior > 0 ? (saldos[p.nome] || 0) / saldoTotalAnterior : 0;
                      const rendimentoPessoa = proporcao * r.rendimentoLiquido;
                      const aporteFinal = aporteFinalPorPessoa[p.id] || 0;
                      const extra = extrasPorPessoa[p.nome] || 0;
                      novosSaldos[p.nome] = (saldos[p.nome] || 0) + aporteFinal + extra + rendimentoPessoa;
                    });
                    
                    const proporcaoConjunto = saldoTotalAnterior > 0 ? saldoConjunto / saldoTotalAnterior : 0;
                    const rendimentoConjunto = proporcaoConjunto * r.rendimentoLiquido;
                    const diffConjunto = isLegacyEdited && defaultAporte === 0 ? r.aporteRegular : 0;
                    const novoSaldoConjunto = saldoConjunto + extrasConjunto + rendimentoConjunto + diffConjunto;
                    
                    pessoas.forEach(p => { saldos[p.nome] = novosSaldos[p.nome]; });
                    saldoConjunto = novoSaldoConjunto;
                    saldoAnterior = r.saldoAcumulado;
                  }

                  const total = rRow.saldoAcumulado;
                  const lista = pessoas.map(p => {
                    const v = saldos[p.nome] || 0;
                    return { nome: p.nome, valor: v, percent: total > 0 ? (v / total) * 100 : 0 };
                  });
                  if (saldoConjunto > 0) lista.push({ nome: "Conjunto", valor: saldoConjunto, percent: total > 0 ? (saldoConjunto / total) * 100 : 0 });
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
      <TabelaMesAMes />
    </div>
  );
}
