"use client";

import { useMemo } from "react";
import { usePlanContext } from "@/context/PlanContext";
import { Card } from "@/components/ui/card";
import { brl, simular } from "@/lib/finance";
import { useRouter } from "next/navigation";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from "recharts";
import { CalendarCheck, Coins, TrendingUp, Wallet, ArrowRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ResultadoPage() {
  const { objetivo, pessoas, aportesExtras } = usePlanContext();
  const router = useRouter();

  const aporteTotal = pessoas.reduce((s, p) => s + Number(p.aporte_mensal ?? 0), 0);

  const sim = useMemo(() => simular({
    valorImovel: Number(objetivo?.valorImovel ?? 0),
    percentualEntrada: Number(objetivo?.percentualEntrada ?? 0),
    percentualCustosExtras: Number(objetivo?.percentualCustosExtras ?? 0),
    valorJaGuardado: Number(objetivo?.valorJaGuardado ?? 0),
    taxaCdiAnual: Number(objetivo?.taxaCdiAnual ?? 0),
    percentualCdi: Number(objetivo?.percentualCdi ?? 100),
    aporteMensalTotal: aporteTotal,
    dataInicio: objetivo?.dataInicio ?? new Date(),
    aportesExtras: aportesExtras.map((a) => ({ data: a.data, valor: Number(a.valor), origem: a.origem })),
    prazoMaxMeses: 600,
  }), [objetivo, aportesExtras, aporteTotal]);

  const chartData = sim.rows.map((r) => ({
    mes: r.mes,
    label: new Date(r.data).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
    investido: Math.round(r.totalInvestido),
    saldo: Math.round(r.saldoAcumulado),
  }));

  const dataMeta = sim.dataAtingiuMeta ? new Date(sim.dataAtingiuMeta).toLocaleDateString("pt-BR", { month: "long", year: "numeric" }) : null;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-accent font-medium mb-2">Etapa 5 de 5</p>
          <h1 className="font-display text-4xl md:text-5xl mb-2">Seu plano em números</h1>
          <p className="text-muted-foreground">O resultado de tudo o que você preencheu nas etapas anteriores.</p>
        </div>
      </div>

      <div className="bg-secondary/40 border border-border/60 rounded-xl p-5 mb-8">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-accent mt-0.5 shrink-0" />
          <div className="space-y-1 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Como este cálculo é feito?</p>
            <ul className="list-disc list-inside space-y-1 ml-1 opacity-90">
              <li><strong>Meta de {brl(sim.meta)}:</strong> É a soma da Entrada do Imóvel + Custos Extras que você definiu na Etapa 1.</li>
              <li><strong>Aportes de {brl(aporteTotal)}/mês:</strong> É a soma de tudo que você e os participantes inseriram no perfil na Etapa 2.</li>
              <li><strong>Rendimento:</strong> Seu dinheiro foi projetado rendendo {objetivo?.percentualCdi}% do CDI (aprox. {(Number(objetivo?.taxaCdiAnual) * Number(objetivo?.percentualCdi) / 100).toFixed(2)}% ao ano), já descontando o Imposto de Renda Regressivo (começa em 22,5% e cai para 15% após 2 anos).</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <KPI icon={<CalendarCheck className="h-4 w-4" />} label="Atinge a meta" value={dataMeta ?? "Não no prazo"} accent={!!dataMeta} />
        <KPI icon={<Wallet className="h-4 w-4" />} label="Total acumulado" value={brl(sim.atingiuMeta ? sim.meta : sim.saldoFinal)} />
        <KPI icon={<Coins className="h-4 w-4" />} label="Total investido" value={brl(sim.totalInvestido)} />
        <KPI icon={<TrendingUp className="h-4 w-4" />} label="Lucro líquido" value={brl(sim.lucroLiquido)} success />
      </div>

      <Card className="p-6 shadow-soft">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-display text-2xl">Evolução do patrimônio</h2>
          <span className="text-xs text-muted-foreground">Linha tracejada = meta de {brl(sim.meta)}</span>
        </div>
        <div className="h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gSaldo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gInv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} interval="preserveStartEnd" />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }}
                formatter={(v: any) => brl(Number(v))}
                labelFormatter={(l) => `Mês ${l}`}
              />
              <ReferenceLine y={sim.meta} stroke="hsl(var(--accent))" strokeDasharray="4 4" label={{ value: "Meta", position: "right", fill: "hsl(var(--accent))", fontSize: 11 }} />
              <Area type="monotone" dataKey="investido" stroke="hsl(var(--primary))" fill="url(#gInv)" strokeWidth={2} name="Investido" />
              <Area type="monotone" dataKey="saldo" stroke="hsl(var(--accent))" fill="url(#gSaldo)" strokeWidth={2.5} name="Saldo" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-0 shadow-soft overflow-hidden">
        <div className="p-6 pb-3">
          <h2 className="font-display text-2xl">Tabela mês a mês</h2>
          <p className="text-sm text-muted-foreground">Aporte regular, extras, rendimento, IR e saldo acumulado.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-muted-foreground">
              <tr>
                <Th>Mês</Th>
                <Th>Data</Th>
                <Th right>Aporte</Th>
                <Th right>Extras</Th>
                <Th right>Rendimento</Th>
                <Th right>IR</Th>
                <Th right>Saldo</Th>
              </tr>
            </thead>
            <tbody>
              {sim.rows.map((r) => {
                const atingiu = sim.mesAtingiuMeta === r.mes;
                return (
                  <tr key={r.mes} className={`border-t border-border ${atingiu ? "bg-accent/10" : ""}`}>
                    <Td>{r.mes}</Td>
                    <Td>{new Date(r.data).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })}</Td>
                    <Td right>{brl(r.aporteRegular)}</Td>
                    <Td right>{r.aportesExtras > 0 ? <span className="text-accent font-medium">{brl(r.aportesExtras)}</span> : "—"}</Td>
                    <Td right className="text-success">{brl(r.rendimentoBruto)}</Td>
                    <Td right className="text-muted-foreground">{brl(r.imposto)}</Td>
                    <Td right className="font-medium">{brl(r.saldoAcumulado)}</Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
}

function KPI({ icon, label, value, accent, success }: { icon: React.ReactNode; label: string; value: string; accent?: boolean; success?: boolean }) {
  return (
    <Card className={`p-5 shadow-soft ${accent ? "bg-gradient-ink text-primary-foreground" : ""}`}>
      <div className={`flex items-center gap-2 text-xs uppercase tracking-widest ${accent ? "opacity-70" : "text-muted-foreground"}`}>
        {icon}
        {label}
      </div>
      <p className={`font-display text-2xl mt-2 num ${success ? "text-success" : ""}`}>{value}</p>
    </Card>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return <th className={`px-4 py-3 text-xs font-medium uppercase tracking-wider ${right ? "text-right" : "text-left"}`}>{children}</th>;
}
function Td({ children, right, className = "" }: { children: React.ReactNode; right?: boolean; className?: string }) {
  return <td className={`px-4 py-2.5 num ${right ? "text-right" : "text-left"} ${className}`}>{children}</td>;
}
