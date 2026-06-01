"use client";

import { useMemo, useState } from "react";
import React from "react";
import { usePlanContext } from "@/context/PlanContext";
import { Card } from "@/components/ui/card";
import { brl, simular } from "@/lib/finance";
import { useRouter } from "next/navigation";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine, ReferenceDot, Legend } from "recharts";
import { CalendarCheck, Coins, TrendingUp, Wallet, Info, User, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

function EditableAporte({ value, onSave, isEdited }: { value: number, onSave: (v: number) => void, isEdited: boolean }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value.toString());

  React.useEffect(() => { setVal(value.toString()); }, [value]);

  if (editing) {
    return (
      <input
        autoFocus
        type="number"
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={() => {
          setEditing(false);
          const num = Number(val);
          if (!isNaN(num) && num >= 0) onSave(num);
          else setVal(value.toString());
        }}
        onKeyDown={e => {
          if (e.key === 'Enter') e.currentTarget.blur();
          if (e.key === 'Escape') {
            setVal(value.toString());
            setEditing(false);
          }
        }}
        className="w-20 text-right bg-background border border-border rounded px-1 py-0.5 outline-none text-foreground text-sm font-medium"
      />
    );
  }

  return (
    <div 
      onClick={() => setEditing(true)} 
      className={`cursor-pointer hover:bg-accent/10 px-1.5 py-0.5 rounded transition-colors border border-transparent hover:border-accent/20 flex justify-end items-center ${isEdited ? "text-accent font-bold" : ""}`}
      title="Clique para editar o aporte"
    >
      {brl(value)}
    </div>
  );
}

export default function ResultadoPage() {
  const { objetivo, pessoas, aportesExtras } = usePlanContext();
  const router = useRouter();
  
  const [aportesEditados, setAportesEditados] = useState<Record<number, number>>({});

  const aporteTotal = pessoas.reduce((s, p) => s + Number(p.aporte_mensal ?? 0), 0);

  const pessoasGuardadoSum = pessoas.reduce((s,p) => s + (p.valorInicial ?? 0), 0);
  const totalGuardado = pessoasGuardadoSum > 0 ? pessoasGuardadoSum : Number(objetivo?.valorJaGuardado ?? 0);
  const pessoaPercentages = pessoas.map(p => ({
    id: p.id,
    nome: p.nome,
    valor: p.valorInicial ?? 0,
    percent: totalGuardado ? ((p.valorInicial ?? 0) / totalGuardado) * 100 : 0,
  }));

  const sim = useMemo(() => simular({
    valorImovel: Number(objetivo?.valorImovel ?? 0),
    percentualEntrada: Number(objetivo?.percentualEntrada ?? 0),
    percentualCustosExtras: Number(objetivo?.percentualCustosExtras ?? 0),
    valorJaGuardado: totalGuardado,
    taxaCdiAnual: Number(objetivo?.taxaCdiAnual ?? 0),
    percentualCdi: Number(objetivo?.percentualCdi ?? 100),
    aporteMensalTotal: aporteTotal,
    aportesRegularesEditados: aportesEditados,
    dataInicio: objetivo?.dataInicio ?? new Date(),
    aportesExtras: aportesExtras.map((a) => ({ data: a.data, valor: Number(a.valor), origem: a.origem })),
    prazoMaxMeses: objetivo?.prazoMaxMeses ?? 600,
  }), [objetivo, aportesExtras, aporteTotal, totalGuardado, aportesEditados]);

  const chartData = sim.rows.map((r) => ({
    mes: r.mes,
    label: new Date(r.data).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
    investido: Math.round(r.totalInvestido),
    saldo: Math.round(r.saldoAcumulado),
  }));

  const dataMeta = sim.dataAtingiuMeta ? new Date(sim.dataAtingiuMeta).toLocaleDateString("pt-BR", { month: "long", year: "numeric" }) : null;
  const pontoMeta = chartData.find(d => d.mes === sim.mesAtingiuMeta);
  const dataCross = pontoMeta ? pontoMeta.label : undefined;

  const tableRows = useMemo(() => {
    const saldos = Object.fromEntries(pessoas.map(p => [p.nome, p.valorInicial ?? 0]));
    let saldoConjunto = 0;
    let rentabilidadeAcumulada = 0;
    
    const inicio = objetivo?.dataInicio ? new Date(objetivo.dataInicio) : new Date();
    
    return sim.rows.map(r => {
      const isExtra = r.aportesExtras > 0;
      const atingiu = sim.mesAtingiuMeta === r.mes;
      
      const extrasMes = aportesExtras.filter(a => {
        const d = new Date(a.data);
        const mesOffset = (d.getFullYear() - inicio.getFullYear()) * 12 + (d.getMonth() - inicio.getMonth()) + 1;
        return mesOffset === r.mes;
      });
      
      const extrasPorPessoa: Record<string, number> = {};
      let extrasConjunto = 0;
      extrasMes.forEach(a => {
        if (a.pessoaNome) extrasPorPessoa[a.pessoaNome] = (extrasPorPessoa[a.pessoaNome] || 0) + Number(a.valor);
        else extrasConjunto += Number(a.valor);
      });
      
      const saldoTotalAnterior = r.saldoAcumulado - r.rendimentoLiquido - r.aporteRegular - r.aportesExtras;
      
      const novosSaldos: Record<string, number> = {};
      const defaultAporte = r.mes === 1 ? 0 : aporteTotal;
      const isEdited = r.aporteRegular !== defaultAporte;
      
      pessoas.forEach(p => {
        const proporcao = saldoTotalAnterior > 0 ? (saldos[p.nome] || 0) / saldoTotalAnterior : 0;
        const rendimentoPessoa = proporcao * r.rendimentoLiquido;
        const baseAporte = r.mes === 1 ? 0 : (Number(p.aporte_mensal) || 0);
        
        let aporteFinal = baseAporte;
        if (isEdited) {
          if (defaultAporte > 0) {
            aporteFinal = (baseAporte / defaultAporte) * r.aporteRegular;
          } else {
            aporteFinal = 0;
          }
        }
        
        const extra = extrasPorPessoa[p.nome] || 0;
        novosSaldos[p.nome] = (saldos[p.nome] || 0) + aporteFinal + extra + rendimentoPessoa;
      });
      
      const proporcaoConjunto = saldoTotalAnterior > 0 ? saldoConjunto / saldoTotalAnterior : 0;
      const rendimentoConjunto = proporcaoConjunto * r.rendimentoLiquido;
      
      let diffConjunto = 0;
      if (isEdited && defaultAporte === 0) {
        diffConjunto = r.aporteRegular;
      }
      
      const novoSaldoConjunto = saldoConjunto + extrasConjunto + rendimentoConjunto + diffConjunto;
      
      pessoas.forEach(p => { saldos[p.nome] = novosSaldos[p.nome]; });
      saldoConjunto = novoSaldoConjunto;
      
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
        percentRentabilidade
      };
    });
  }, [sim.rows, pessoas, aportesExtras, objetivo?.dataInicio, sim.mesAtingiuMeta]);

  const targetMonthIndex = sim.mesAtingiuMeta ? sim.mesAtingiuMeta - 1 : sim.rows.length - 1;
  const targetRow = tableRows[targetMonthIndex];
  const inicio = objetivo?.dataInicio ? new Date(objetivo.dataInicio) : new Date();

  return (
    <div className="max-w-[1400px] w-full px-4 md:px-8 mx-auto space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-2">Etapa 4 de 4</p>
          <h1 className="font-display text-4xl md:text-5xl mb-3 font-light">Seu plano em números</h1>
          <p className="text-muted-foreground text-lg">O resultado de tudo o que você preencheu nas etapas anteriores.</p>
        </div>
      </div>

      <div className="bg-secondary/30 border border-border/50 rounded-xl p-6 mb-8">
        <details className="group cursor-pointer">
          <summary className="flex items-center gap-3 font-medium text-foreground select-none">
            <Info className="h-5 w-5 text-accent shrink-0" />
            Como este cálculo é feito?
            <span className="ml-auto text-xs text-muted-foreground group-open:hidden">Clique para ver</span>
          </summary>
          <div className="mt-4 pt-4 border-t border-border/50 space-y-1 text-sm text-muted-foreground pl-8">
            <ul className="list-disc list-outside space-y-2 ml-4">
              <li><strong className="text-foreground">Meta de {brl(sim.meta)}:</strong> É a soma da Entrada do Imóvel + Custos Extras que você definiu na Etapa 1.</li>
              <li><strong className="text-foreground">Aportes de {brl(aporteTotal)}/mês:</strong> É a soma de tudo que você e os participantes inseriram no perfil na Etapa 2.</li>
              <li><strong className="text-foreground">Rendimento:</strong> Seu dinheiro foi projetado rendendo {objetivo?.percentualCdi}% do CDI (aprox. {(Number(objetivo?.taxaCdiAnual) * Number(objetivo?.percentualCdi) / 100).toFixed(2)}% ao ano), já descontando o Imposto de Renda Regressivo (começa em 22,5% e cai para 15% após 2 anos).</li>
            </ul>
          </div>
        </details>
      </div>

      {/* Top Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="p-6 border-border/50 bg-primary/5 flex flex-col justify-center">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary font-medium mb-3">
            <CalendarCheck className="h-4 w-4" />
            Atinge a meta em
          </div>
          <p className="font-display text-4xl xl:text-5xl text-primary leading-tight">{dataMeta ?? "Não no prazo"}</p>
        </Card>
        <Card className="p-6 border-border/50 flex flex-col justify-center">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground mb-3 font-medium">
            <Wallet className="h-4 w-4" />
            Total acumulado
          </div>
          <p className="font-display text-3xl num">{brl(sim.atingiuMeta ? sim.meta : sim.saldoFinal)}</p>
        </Card>
        <Card className="p-6 border-border/50 flex flex-col justify-center">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground mb-3 font-medium">
            <Coins className="h-4 w-4" />
            Total investido
          </div>
          <p className="font-display text-3xl num">{brl(sim.totalInvestido)}</p>
        </Card>
        <Card className="p-6 border-border/50 flex flex-col justify-center bg-[#3B6D11]/5">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#3B6D11] dark:text-[#80B551] mb-3 font-medium">
            <TrendingUp className="h-4 w-4" />
            Lucro líquido
          </div>
          <p className="font-display text-3xl num text-[#3B6D11] dark:text-[#80B551]">+{brl(sim.lucroLiquido)}</p>
        </Card>
      </div>

      <Card className="p-6 border-border/50">
        <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-6 gap-2">
          <h2 className="font-display text-2xl font-light">Evolução do patrimônio</h2>
        </div>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
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
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} tickMargin={10} minTickGap={30} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} width={60} tickMargin={10} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 13, boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                formatter={(value: number, name: string) => [brl(value), name]}
                labelFormatter={(label) => `Período: ${label}`}
              />
              <Legend verticalAlign="top" height={40} iconType="circle" wrapperStyle={{ fontSize: 13, color: "hsl(var(--muted-foreground))" }} />
              <ReferenceLine y={sim.meta} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" label={{ value: "Meta", position: "insideTopLeft", fill: "hsl(var(--muted-foreground))", fontSize: 12, offset: 15 }} />
              {dataCross && (
                <ReferenceDot x={dataCross} y={sim.meta} r={5} fill="hsl(var(--primary))" stroke="hsl(var(--background))" strokeWidth={2} />
              )}
              <Area type="monotone" dataKey="investido" stroke="hsl(var(--primary))" fill="url(#gInv)" strokeWidth={2} name="Total Investido" />
              <Area type="monotone" dataKey="saldo" stroke="hsl(var(--accent))" fill="url(#gSaldo)" strokeWidth={2.5} name="Saldo Acumulado" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="space-y-6">

        <div>
          <h2 className="font-display text-2xl mb-6 font-light">Resumo Financeiro</h2>
          <div className="space-y-4">
            {/* Bloco 1: Valor Inicial */}
            <Card className="p-6 border-border/50">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1 w-full space-y-2 md:border-r md:border-border/50 md:pr-6">
                  <p className="text-sm text-muted-foreground flex items-center gap-2 font-medium"><Wallet className="h-4 w-4" /> Valor inicial</p>
                  <p className="font-display text-4xl num">{brl(totalGuardado)}</p>
                </div>
                <div className="flex-[2] w-full space-y-4">
                  {pessoas.map(p => {
                    const valor = p.valorInicial ?? 0;
                    const percent = totalGuardado > 0 ? (valor / totalGuardado) * 100 : 0;
                    return (
                      <div key={p.id} className="space-y-2">
                        <div className="flex justify-between text-sm items-end">
                          <span className="font-medium text-base flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /> {p.nome}</span>
                          <span className="num">{brl(valor)} <span className="text-muted-foreground ml-1">({percent.toFixed(1)}%)</span></span>
                        </div>
                        <div className="h-2.5 w-full bg-secondary/50 rounded-full overflow-hidden">
                          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>

            {/* Bloco 2: Valor Aportado */}
            <Card className="p-6 border-border/50">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1 w-full space-y-2 md:border-r md:border-border/50 md:pr-6">
                  <p className="text-sm text-muted-foreground flex items-center gap-2 font-medium"><Coins className="h-4 w-4" /> Valor aportado</p>
                  <p className="font-display text-4xl num">
                    {brl(targetRow ? targetRow.totalInvestido - totalGuardado : 0)}
                  </p>
                </div>
                <div className="flex-[2] w-full space-y-4">
                  {(() => {
                    const meses = sim.mesAtingiuMeta ?? sim.rows.length;
                    let totalAportadoConjunto = 0;
                    const extrasMap: Record<string, number> = {};
                    
                    aportesExtras.forEach(a => {
                      const d = new Date(a.data);
                      const mesOffset = (d.getFullYear() - inicio.getFullYear()) * 12 + (d.getMonth() - inicio.getMonth()) + 1;
                      if (mesOffset <= meses) {
                        if (a.pessoaNome) extrasMap[a.pessoaNome] = (extrasMap[a.pessoaNome] || 0) + Number(a.valor);
                        else totalAportadoConjunto += Number(a.valor);
                      }
                    });
                    
                    const aportados = pessoas.map(p => {
                      // Note: month 1 has no aporte by logic
                      const totalMonths = Math.max(0, meses - 1);
                      const mensal = (Number(p.aporte_mensal) || 0) * totalMonths; 
                      const extra = extrasMap[p.nome] || 0;
                      return { nome: p.nome, valor: mensal + extra };
                    });
                    const totalAportadoGeral = targetRow ? targetRow.totalInvestido - totalGuardado : 0;
                    
                    const lista = aportados.map(p => ({ ...p, percent: totalAportadoGeral > 0 ? (p.valor / totalAportadoGeral) * 100 : 0 }));
                    if (totalAportadoConjunto > 0) {
                      lista.push({ nome: "Conjunto", valor: totalAportadoConjunto, percent: totalAportadoGeral > 0 ? (totalAportadoConjunto / totalAportadoGeral) * 100 : 0 });
                    }
                    
                    return lista.map((item, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between text-sm items-end">
                          <span className="font-medium text-base flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /> {item.nome}</span>
                          <span className="num">{brl(item.valor)} <span className="text-muted-foreground ml-1">({item.percent.toFixed(1)}%)</span></span>
                        </div>
                        <div className="h-2.5 w-full bg-secondary/50 rounded-full overflow-hidden">
                          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${item.percent}%` }} />
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </Card>

            {/* Bloco 3: Total Acumulado */}
            <Card className="p-6 border-border/50 bg-[#3B6D11]/5">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1 w-full space-y-2 md:border-r md:border-border/50 md:pr-6">
                  <p className="text-sm text-[#3B6D11] dark:text-[#80B551] flex items-center gap-2 font-medium"><TrendingUp className="h-4 w-4" /> Total acumulado (Valor final)</p>
                  <p className="font-display text-4xl num text-[#3B6D11] dark:text-[#80B551]">{brl(targetRow ? targetRow.saldoAcumulado : 0)}</p>
                </div>
                <div className="flex-[2] w-full space-y-4">
                  {(() => {
                    if (!targetRow) return null;
                    const totalAcumuladoGeral = targetRow.saldoAcumulado;
                    
                    const lista = pessoas.map(p => {
                      const valor = targetRow.saldosIndividuais[p.nome] || 0;
                      return { nome: p.nome, valor, percent: totalAcumuladoGeral > 0 ? (valor / totalAcumuladoGeral) * 100 : 0 };
                    });
                    
                    if (targetRow.saldoConjunto > 0) {
                      lista.push({
                        nome: "Conjunto",
                        valor: targetRow.saldoConjunto,
                        percent: totalAcumuladoGeral > 0 ? (targetRow.saldoConjunto / totalAcumuladoGeral) * 100 : 0
                      });
                    }
                    
                    return lista.map((item, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between text-sm items-end">
                          <span className="font-medium text-base flex items-center gap-2"><User className="h-4 w-4 text-[#3B6D11]/70 dark:text-[#80B551]/70" /> {item.nome}</span>
                          <span className="num">{brl(item.valor)} <span className="text-muted-foreground ml-1">({item.percent.toFixed(1)}%)</span></span>
                        </div>
                        <div className="h-2.5 w-full bg-secondary/50 rounded-full overflow-hidden">
                          <div className="h-full bg-[#3B6D11] dark:bg-[#80B551] transition-all duration-500" style={{ width: `${item.percent}%` }} />
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div>
          <div className="mb-4">
            <h2 className="font-display text-2xl font-light">Tabela mês a mês</h2>
            <p className="text-sm text-muted-foreground mt-1">Aporte regular, extras, rendimento, IR e saldo acumulado detalhados.</p>
          </div>
          
          <div className="overflow-x-auto max-h-[600px] border border-border/50 rounded-xl shadow-sm bg-card relative">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-secondary/95 backdrop-blur-sm text-muted-foreground shadow-sm">
                <tr>
                  <Th>Mês</Th>
                  <Th>Data</Th>
                  <Th right>Aporte</Th>
                  <Th right>Extras</Th>
                  <Th right>Rend. (%)</Th>
                  <Th right>Rend. (R$)</Th>
                  <Th right>IR</Th>
                  <Th right>Rent. Acumulada</Th>
                  {pessoas.map(p => <Th right key={p.id}>{p.nome}</Th>)}
                  <Th right>Patrimônio Total</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {tableRows.map((r) => {
                  const defaultAporte = r.mes === 1 ? 0 : aporteTotal;
                  const isEdited = r.aporteRegular !== defaultAporte;
                  const isPassed = new Date(r.data) < new Date();
                  
                  return (
                    <tr key={r.mes} className={`transition-colors hover:bg-secondary/20 ${r.atingiu ? "bg-primary/10 shadow-[inset_4px_0_0_0_hsl(var(--primary))]" : ""} ${r.isExtra && !r.atingiu ? "bg-accent/5" : ""}`}>
                      <Td className="text-muted-foreground font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-4 flex justify-center">
                            {isPassed ? <Check className="h-3.5 w-3.5 text-teal-600 dark:text-teal-500/80" /> : null}
                          </div>
                          <span className={isPassed ? "text-foreground" : "text-muted-foreground/60"}>{r.mes}</span>
                          {r.atingiu && <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] uppercase font-bold tracking-wider ml-1">Meta Atingida</span>}
                        </div>
                      </Td>
                      <Td suppressHydrationWarning className={isPassed ? "text-foreground" : "text-muted-foreground"}>{new Date(r.data).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}</Td>
                      <Td right>
                        <EditableAporte 
                          value={r.aporteRegular} 
                          isEdited={isEdited} 
                          onSave={(v) => {
                            setAportesEditados(prev => {
                              const copy = { ...prev };
                              if (v === defaultAporte) delete copy[r.mes];
                              else copy[r.mes] = v;
                              return copy;
                            });
                          }} 
                        />
                      </Td>
                      <Td right>{r.isExtra ? <span className="text-accent font-medium bg-accent/10 px-2 py-0.5 rounded-sm">+{brl(r.aportesExtras)}</span> : "—"}</Td>
                      <Td right className="text-[#3B6D11] dark:text-[#80B551]">{r.percentRendimento > 0 ? `+${r.percentRendimento.toFixed(2)}%` : "0,00%"}</Td>
                      <Td right className="text-[#3B6D11] dark:text-[#80B551] font-medium">{r.rendimentoLiquido > 0 ? `+${brl(r.rendimentoLiquido)}` : brl(r.rendimentoLiquido)}</Td>
                      <Td right className="text-rose-500/80 dark:text-rose-400/80">{r.imposto > 0 ? `-${brl(r.imposto)}` : brl(r.imposto)}</Td>
                      <Td right>
                        <div className="flex flex-col items-end">
                          <span className="text-[#3B6D11] dark:text-[#80B551] font-medium">+{brl(r.rentabilidadeAcumulada)}</span>
                          <span className="text-[10px] text-[#3B6D11]/70 dark:text-[#80B551]/70">+{r.percentRentabilidade.toFixed(2)}%</span>
                        </div>
                      </Td>
                      {pessoas.map(p => (
                        <Td right key={p.id} className="font-medium text-muted-foreground">{brl(r.saldosIndividuais[p.nome])}</Td>
                      ))}
                      <Td right className="font-bold text-base text-foreground">{brl(r.saldoAcumulado)}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return <th className={`px-4 py-3.5 text-xs font-medium uppercase tracking-wider ${right ? "text-right" : "text-left"}`}>{children}</th>;
}
function Td({ children, right, className = "" }: { children: React.ReactNode; right?: boolean; className?: string }) {
  return <td className={`px-4 py-3 num ${right ? "text-right" : "text-left"} ${className}`}>{children}</td>;
}
