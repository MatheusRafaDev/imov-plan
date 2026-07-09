"use client";

import React from "react";
import { ChartDataPoint, SimulacaoSummary } from "@/types/simulacao";
import { Card } from "@/components/ui/card";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine, Legend } from "recharts";
import { formatCurrency } from "@/utils/formatters";

interface InvestmentChartProps {
  data: ChartDataPoint[];
  summary: SimulacaoSummary | null;
}

export function InvestmentChart({ data, summary }: InvestmentChartProps) {
  if (!data || data.length === 0 || !summary) return null;

  return (
    <Card className="p-6 border-border/50">
      <h3 className="font-display text-lg font-medium mb-6">Projeção de Crescimento</h3>
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorInvestido" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="label" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} 
              dy={10} 
            />
            <YAxis 
              tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} 
            />
            <Tooltip
              formatter={(value: any) => [formatCurrency(Number(value)), ""]}
              labelStyle={{ color: "hsl(var(--foreground))", fontWeight: "bold", marginBottom: "8px" }}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                borderColor: "hsl(var(--border))",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "12px" }} />
            
            <ReferenceLine 
              y={summary.totalNecessario} 
              stroke="hsl(var(--destructive))" 
              strokeDasharray="4 4" 
              label={{ 
                value: `Meta: ${formatCurrency(summary.totalNecessario)}`, 
                position: 'insideTopLeft', 
                fill: 'hsl(var(--destructive))', 
                fontSize: 12 
              }} 
            />

            {summary.atingiuMeta && (
              <ReferenceLine
                x={data.find(d => d.mes === summary.mesesParaAtingir)?.label}
                stroke="hsl(var(--primary))"
                strokeDasharray="3 3"
              />
            )}

            <Area 
              type="monotone" 
              dataKey="investido" 
              name="Total Investido" 
              stroke="#10B981" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorInvestido)" 
            />
            <Area 
              type="monotone" 
              dataKey="saldo" 
              name="Patrimônio Total" 
              stroke="#4F46E5" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorSaldo)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
