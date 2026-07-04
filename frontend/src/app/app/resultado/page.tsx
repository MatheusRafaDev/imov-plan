"use client";

import { useMemo, useRef, useEffect } from "react";
import React from "react";
import { usePlanContext } from "@/context/PlanContext";
import { Card } from "@/components/ui/card";
import { brl, simular, nomeTipoInvestimento, percentualCdiPorTipoInvestimento, type SimInput, type SimResult, type SimRow } from "@/lib/finance";
import { useRouter } from "next/navigation";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine, ReferenceDot, Legend } from "recharts";
import { CalendarCheck, Coins, TrendingUp, Wallet, Info, User, Check, Plus, Trash2, ChevronDown, ChevronUp, RefreshCw, Database, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type BackendSimulacaoResult } from "@/services/SimulacaoService";
import { TabelaMesAMes } from "@/components/TabelaMesAMes";

/** Converte resposta do backend para SimResult */
function backendToSimResult(backend: BackendSimulacaoResult, objetivo: Partial<SimInput> | null): SimResult {
  const rows: SimRow[] = backend.detalhesMensais.map(d => ({
    mes: d.mes,
    data: new Date(d.dataReferencia).toISOString(),
    aporteRegular: d.aporteMensal,
    aportesExtras: d.aportesExtras,
    rendimentoBruto: d.rendimentoBruto,
    imposto: d.imposto,
    rendimentoLiquido: d.rendimentoLiquido,
    saldoAcumulado: d.totalAcumulado,
    totalInvestido: 0, // will be computed
  }));

  // Compute totalInvestido for each row
  let totalInvestido = backend.valorJaGuardado;
  for (const row of rows) {
    if (row.mes === 0) {
      row.totalInvestido = totalInvestido;
    } else {
      totalInvestido += row.aporteRegular + row.aportesExtras;
      row.totalInvestido = totalInvestido;
    }
  }

  return {
    meta: backend.totalNecessario,
    custosExtras: (Number(objetivo?.valorImovel) || 0) * (Number(objetivo?.percentualCustosExtras) || 0) / 100,
    valorEntrada: (Number(objetivo?.valorImovel) || 0) * (Number(objetivo?.percentualEntrada) || 0) / 100,
    faltava: Math.max(0, backend.totalNecessario - backend.valorJaGuardado),
    rows,
    atingiuMeta: backend.atingiuMeta,
    mesAtingiuMeta: backend.atingiuMeta ? backend.mesesParaAtingir : undefined,
    dataAtingiuMeta: backend.atingiuMeta ? backend.dataPrevistaAlvo : undefined,
    saldoFinal: backend.totalAcumulado,
    totalInvestido: backend.totalInvestido,
    lucroLiquido: backend.lucroLiquido,
  };
}

type PessoaBreakdown = {
  id: string;
  nome: string;
  valorInicial: number;
  aportado: number; // aportes regulares + extras da pessoa, até o mês da meta
  retorno: number;  // rendimento líquido atribuído à pessoa, até o mês da meta
  saldo: number;    // saldo final da pessoa no mês da meta
};

// ─── Page ────────────────────────────────────────────────────────────────────
export default function ResultadoPage() {
  const { objetivo, pessoas, aportesExtras, aportesRegularesEditados, setAportesRegularesEditados, saveDraft, mesesConcluidos, setMesesConcluidos, planoId, aportesRegularesEditadosPorPessoa, dadosCalculados, backendData, loadingBackend, calculating, backendError, simSource, calcularBackend } = usePlanContext();
  const router = useRouter();

  // Usar dados calculados centralizados do contexto
  const { effectivePercentualCdi, aporteTotal, totalGuardado, combinedExtras, virtualAportesRegularesEditados, simResult, perPersonStats } = dadosCalculados;

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

  const inicio = objetivo?.dataInicio
    ? (typeof objetivo.dataInicio === "string"
      ? new Date(objetivo.dataInicio + "T12:00:00")
      : new Date(objetivo.dataInicio))
    : new Date();

  // Construir o simResult: prioriza backend, fallback client-side
  const sim = useMemo((): SimResult | null => {
    if (backendData && simSource === "backend") {
      return backendToSimResult(backendData, objetivo);
    }

    // Usar simResult centralizado do contexto quando não há dados do backend
    return simResult;
  }, [backendData, simSource, objetivo, simResult]);

  const chartData = sim?.rows.map(r => ({
    mes: r.mes,
    label: new Date(r.data).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
    investido: Math.round(r.totalInvestido),
    saldo: Math.round(r.saldoAcumulado),
  })) ?? [];

  const dataMeta = sim?.dataAtingiuMeta
    ? new Date(sim.dataAtingiuMeta).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    : null;
  const pontoMeta = chartData.find(d => d.mes === sim?.mesAtingiuMeta);
  const dataCross = pontoMeta ? pontoMeta.label : undefined;

  // Antes cortava no mês em que a meta era atingida (sim.mesAtingiuMeta).
  // Agora sempre olha até o fim do planejamento (última linha da tabela) —
  // "Atinge a meta em" continua mostrando a data da meta separadamente,
  // mas os cards de resumo (Total acumulado, Retorno, etc.) refletem o
  // planejamento inteiro.
  const targetMonthIndex = (sim?.rows.length ?? 1) - 1;
  const targetRow = sim?.rows[targetMonthIndex];

  const totalCompra = pessoas.reduce((s, p) => s + Number(p.valorInicial ?? 0), 0);

  /**
   * Breakdown único por pessoa (aportado / retorno / saldo), sempre cortado
   * em targetMonthIndex (mês da meta). Substitui os 3 loops que antes
   * existiam separadamente em "Valor aportado", "Retorno de investimento"
   * e "Total acumulado" — que haviam divergido entre si (o de Retorno
   * usava perPersonStats, que soma a tabela inteira, e não o corte da meta).
   */
  const breakdown = useMemo((): { porPessoa: PessoaBreakdown[]; conjunto: { aportado: number; retorno: number; saldo: number } } => {
    if (!sim || !targetRow) {
      return { porPessoa: [], conjunto: { aportado: 0, retorno: 0, saldo: 0 } };
    }

    const saldos = Object.fromEntries(pessoas.map(p => [p.id, p.valorInicial ?? 0]));
    const aportados = Object.fromEntries(pessoas.map(p => [p.id, 0]));
    const retornos = Object.fromEntries(pessoas.map(p => [p.id, 0]));
    let saldoConjunto = 0;
    let aportadoConjunto = 0;
    let retornoConjunto = 0;
    let saldoAnterior = totalGuardado;

    for (let i = 0; i <= targetMonthIndex; i++) {
      const r = sim.rows[i];
      const saldoTotalAnterior = saldoAnterior;

      const extrasMes = combinedExtras.filter(a => {
        const d = new Date(a.data + 'T12:00:00');
        const mesOffset = (d.getFullYear() - inicio.getFullYear()) * 12 + (d.getMonth() - inicio.getMonth()) + 1;
        return mesOffset === r.mes;
      });
      const extrasPorPessoa: Record<string, number> = {};
      let extrasConjunto = 0;
      extrasMes.forEach(a => {
        if (a.pessoaId) extrasPorPessoa[a.pessoaId] = (extrasPorPessoa[a.pessoaId] || 0) + Number(a.valor);
        else extrasConjunto += Number(a.valor);
      });

      const defaultAporte = r.mes === 0 ? 0 : aporteTotal;
      const isLegacyEdited = aportesRegularesEditados[r.mes] !== undefined;
      const aporteFinalPorPessoa: Record<string, number> = {};
      pessoas.forEach(p => {
        if (r.mes === 0) {
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
        const proporcao = saldoTotalAnterior > 0 ? (saldos[p.id] || 0) / saldoTotalAnterior : 0;
        const rendimentoPessoa = proporcao * r.rendimentoLiquido;
        const aporteFinal = aporteFinalPorPessoa[p.id] || 0;
        const extra = extrasPorPessoa[p.id] || 0;

        retornos[p.id] = (retornos[p.id] || 0) + rendimentoPessoa;
        aportados[p.id] = (aportados[p.id] || 0) + aporteFinal + extra;
        saldos[p.id] = (saldos[p.id] || 0) + aporteFinal + extra + rendimentoPessoa;
      });

      const proporcaoConjunto = saldoTotalAnterior > 0 ? saldoConjunto / saldoTotalAnterior : 0;
      const rendimentoConjunto = proporcaoConjunto * r.rendimentoLiquido;
      const diffConjunto = isLegacyEdited && defaultAporte === 0 ? r.aporteRegular : 0;

      retornoConjunto += rendimentoConjunto;
      aportadoConjunto += extrasConjunto + diffConjunto;
      saldoConjunto = saldoConjunto + extrasConjunto + rendimentoConjunto + diffConjunto;
      saldoAnterior = r.saldoAcumulado;
    }

    const porPessoa = pessoas.map(p => ({
      id: p.id,
      nome: p.nome,
      valorInicial: p.valorInicial ?? 0,
      aportado: aportados[p.id] || 0,
      retorno: retornos[p.id] || 0,
      saldo: saldos[p.id] || 0,
    }));

    return {
      porPessoa,
      conjunto: { aportado: aportadoConjunto, retorno: retornoConjunto, saldo: saldoConjunto },
    };
  }, [sim, targetRow, targetMonthIndex, pessoas, totalGuardado, aporteTotal, combinedExtras, aportesRegularesEditados, aportesRegularesEditadosPorPessoa, inicio]);

  // Se não tem nenhum dado, mostrar estado vazio
  if (!sim) {
    return (
      <div className="max-w-screen-2xl w-full px-4 md:px-6 mx-auto space-y-7">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-1">Etapa 4 de 4</p>
          <h1 className="font-display text-3xl md:text-4xl mb-1.5 font-light">Seu plano em números</h1>
          <p className="text-muted-foreground text-sm">Preencha as etapas anteriores para ver o resultado.</p>
        </div>
        <Card className="p-8 text-center border-border/50">
          <p className="text-muted-foreground">Complete as etapas 1 a 3 primeiro.</p>
          <Button onClick={() => router.push("/app/imovel")} className="mt-4">Ir para Etapa 1</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-screen-2xl w-full px-4 md:px-6 mx-auto space-y-7">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium mb-1">Etapa 4 de 4</p>
          <h1 className="font-display text-3xl md:text-4xl mb-1.5 font-light">Seu plano em números</h1>
          <p className="text-muted-foreground text-sm">O resultado de tudo o que você preencheu nas etapas anteriores.</p>
        </div>

        {/* Botão Calcular */}
        <div className="flex items-center gap-3 shrink-0">
          <Button
            onClick={() => calcularBackend()}
            disabled={calculating || loadingBackend}
            className="flex items-center gap-2"
            size="lg"
          >
            {calculating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {calculating ? "Calculando..." : "Calcular"}
          </Button>
        </div>
      </div>

      {/* Erro do backend */}
      {backendError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-xs text-red-700 dark:text-red-400">
          {backendError}
        </div>
      )}

      {/* Loading */}
      {loadingBackend && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Carregando simulação salva...</span>
        </div>
      )}

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
              <li><strong className="text-foreground">Aportes de {brl(aporteTotal)}/mês:</strong> Soma dos participantes (Etapa 2). O mês 0 (início) não tem aporte — apenas o saldo inicial.</li>
              <li><strong className="text-foreground">Rendimento:</strong> {objetivo?.percentualCdi}% do CDI (≈ {(Number(objetivo?.taxaCdiAnual) * Number(objetivo?.percentualCdi) / 100).toFixed(2)}% a.a.), com IR regressivo (22,5% → 15%).</li>
            </ul>
          </div>
        </details>
      </div>

      {/* Top Cards — compact */}
      <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-4">
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
        <Card className="p-4 border-border/50 bg-card shadow-soft">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-medium">
            <User className="h-3.5 w-3.5" /> Valor de compra por participante
          </div>
          <p className="font-display text-2xl num mb-3">{brl(totalCompra)}</p>
          <div className="space-y-2">
            {pessoas.map(p => {
              const valor = Number(p.valorInicial ?? 0);
              const percent = totalCompra > 0 ? (valor / totalCompra) * 100 : 0;
              return (
                <div key={p.id} className="space-y-1">
                  <div className="flex justify-between text-xs items-end">
                    <span className="text-muted-foreground">{p.nome}</span>
                    <span className="num font-medium">{brl(valor)} <span className="text-muted-foreground">({percent.toFixed(0)}%)</span></span>
                  </div>
                </div>
              );
            })}
          </div>
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
          <div className="grid md:grid-cols-4 gap-4">
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

            {/* Valor Aportado — agora lê do breakdown único */}
            <Card className="p-4 border-border/50 bg-card shadow-soft">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5 mb-2"><Coins className="h-3.5 w-3.5" /> Valor aportado</p>
              <p className="font-display text-2xl num mb-3">{brl(targetRow ? targetRow.totalInvestido - totalGuardado : 0)}</p>
              <div className="space-y-2">
                {(() => {
                  const totalAportadoGeral = breakdown.porPessoa.reduce((s, p) => s + p.aportado, 0) + breakdown.conjunto.aportado;
                  const lista = breakdown.porPessoa.map(p => ({
                    nome: p.nome,
                    valor: p.aportado,
                    percent: totalAportadoGeral > 0 ? (p.aportado / totalAportadoGeral) * 100 : 0,
                  }));
                  if (breakdown.conjunto.aportado > 0) {
                    lista.push({ nome: "Conjunto", valor: breakdown.conjunto.aportado, percent: totalAportadoGeral > 0 ? (breakdown.conjunto.aportado / totalAportadoGeral) * 100 : 0 });
                  }
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

            {/* Retorno de investimento — CORRIGIDO: antes somava perPersonStats
                (12 meses inteiros, R$ 3.930,03); agora usa breakdown, cortado
                em targetMonthIndex, igual ao Lucro líquido (R$ 977,61) */}
            <Card className="p-4 border-border/50 bg-card shadow-soft">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5 mb-2"><TrendingUp className="h-3.5 w-3.5" /> Retorno de investimento</p>
              <p className="font-display text-2xl num mb-3">
                +{brl(breakdown.porPessoa.reduce((sum, p) => sum + p.retorno, 0) + breakdown.conjunto.retorno)}
              </p>
              <div className="space-y-3">
                {breakdown.porPessoa.map((item) => {
                  const stats = perPersonStats.find(s => s.id === item.id);
                  return (
                    <div key={item.id} className="space-y-1">
                      <div className="flex justify-between text-xs items-end">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-muted-foreground">{item.nome}</span>
                          {stats && (
                            <span className="text-[10px] text-muted-foreground">
                              {nomeTipoInvestimento(stats.tipoInvestimento)} • {stats.percentualCdiInvestimento}% do CDI
                            </span>
                          )}
                        </div>
                        <span className="num font-medium">{brl(item.retorno)}</span>
                      </div>
                      <div className="h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${stats?.percentualCdiInvestimento ?? 0}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Total Acumulado — agora lê do breakdown único */}
            <Card className="p-4 border-border/50 bg-[#3B6D11]/5 shadow-soft">
              <p className="text-[10px] uppercase tracking-wider text-[#3B6D11] dark:text-[#80B551] font-medium flex items-center gap-1.5 mb-2"><TrendingUp className="h-3.5 w-3.5" /> Total acumulado</p>
              <p className="font-display text-2xl num text-[#3B6D11] dark:text-[#80B551] mb-3">{brl(targetRow ? targetRow.saldoAcumulado : sim.saldoFinal)}</p>
              <div className="space-y-2">
                {(() => {
                  const total = targetRow ? targetRow.saldoAcumulado : sim.saldoFinal;
                  const lista = breakdown.porPessoa.map(p => ({
                    nome: p.nome,
                    valor: p.saldo,
                    percent: total > 0 ? (p.saldo / total) * 100 : 0,
                  }));
                  if (breakdown.conjunto.saldo > 0) {
                    lista.push({ nome: "Conjunto", valor: breakdown.conjunto.saldo, percent: total > 0 ? (breakdown.conjunto.saldo / total) * 100 : 0 });
                  }
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


      <TabelaMesAMes
        percentualCdiOverride={effectivePercentualCdi}
      />

    </div>
  );
}