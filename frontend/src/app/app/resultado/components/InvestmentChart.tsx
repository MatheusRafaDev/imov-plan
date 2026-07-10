"use client";

import React from "react";
import { ChartDataPoint, SimulacaoSummary } from "@/types/simulacao";
import { Card } from "@/components/ui/card";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import { formatCurrency } from "@/utils/formatters";

interface InvestmentChartProps {
  data: ChartDataPoint[];
  summary: SimulacaoSummary | null;
}

function formatDateLabel(isoDate: string): string {
  try {
    const d = new Date(isoDate.includes("T") ? isoDate : isoDate + "T12:00:00");
    return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  } catch {
    return isoDate;
  }
}

function formatAxisDate(isoDate: string): string {
  try {
    const d = new Date(isoDate.includes("T") ? isoDate : isoDate + "T12:00:00");
    const year = d.getFullYear().toString().slice(2);
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    return `${month}/${year}`;
  } catch {
    return isoDate;
  }
}

interface TooltipPayloadItem {
  name: string;
  value: number;
  dataKey: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const dateLabel = label ? formatDateLabel(label) : "";
  const investidoItem = payload.find((p) => p.dataKey === "investido");
  const saldoItem = payload.find((p) => p.dataKey === "saldo");
  const lucro =
    investidoItem && saldoItem ? saldoItem.value - investidoItem.value : null;

  return (
    <div
      style={{
        backgroundColor: "hsl(var(--card))",
        border: "1px solid hsl(var(--border))",
        borderRadius: "12px",
        padding: "12px 16px",
        boxShadow: "0 8px 24px -8px rgba(0,0,0,0.18)",
        minWidth: 230,
      }}
    >
      <p
        style={{
          color: "hsl(var(--foreground))",
          fontWeight: 600,
          fontSize: 13,
          marginBottom: 10,
          textTransform: "capitalize",
        }}
      >
        {dateLabel}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {investidoItem && (
          <div style={{ display: "flex", justifyContent: "space-between", gap: 24, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: "#86efac",
                  display: "inline-block",
                }}
              />
              <span style={{ color: "hsl(var(--muted-foreground))", fontSize: 12 }}>Total Aportado</span>
            </div>
            <span style={{ color: "hsl(var(--foreground))", fontSize: 13, fontWeight: 500 }}>
              {formatCurrency(investidoItem.value)}
            </span>
          </div>
        )}
        {saldoItem && (
          <div style={{ display: "flex", justifyContent: "space-between", gap: 24, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: "hsl(var(--primary))",
                  display: "inline-block",
                }}
              />
              <span style={{ color: "hsl(var(--muted-foreground))", fontSize: 12 }}>Patrimônio Total</span>
            </div>
            <span style={{ color: "hsl(var(--foreground))", fontSize: 13, fontWeight: 500 }}>
              {formatCurrency(saldoItem.value)}
            </span>
          </div>
        )}
        {lucro !== null && lucro > 0 && (
          <div
            style={{
              marginTop: 4,
              paddingTop: 8,
              borderTop: "1px solid hsl(var(--border))",
              display: "flex",
              justifyContent: "space-between",
              gap: 24,
              alignItems: "center",
            }}
          >
            <span style={{ color: "hsl(var(--muted-foreground))", fontSize: 12 }}>Rendimento Líquido</span>
            <span style={{ color: "hsl(var(--success))", fontSize: 13, fontWeight: 600 }}>
              +{formatCurrency(lucro)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function InvestmentChart({ data, summary }: InvestmentChartProps) {
  if (!data || data.length === 0 || !summary) return null;

  // Mostrar ~6 ticks no eixo X sem poluir
  const step = Math.max(1, Math.floor(data.length / 6));
  const tickIndices = new Set<number>(
    data
      .map((_, i) => i)
      .filter((i) => i === 0 || i === data.length - 1 || i % step === 0)
  );

  return (
    <Card className="p-6 border-border/50">
      {/* Header com legenda inline */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display text-lg font-medium">Projeção de Crescimento</h3>
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: "#86efac" }} />
            Total Aportado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />
            Patrimônio Total
          </span>
        </div>
      </div>

      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 16, right: 8, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.22} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.01} />
              </linearGradient>
              <linearGradient id="colorInvestido" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#86efac" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#86efac" stopOpacity={0.01} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="hsl(var(--border))"
              strokeOpacity={0.6}
            />

            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              tick={(props: any) => {
                const { x, y, payload, index } = props;
                if (!tickIndices.has(index)) return <g />;
                return (
                  <text
                    x={x}
                    y={y + 12}
                    textAnchor="middle"
                    fill="hsl(var(--muted-foreground))"
                    fontSize={11}
                  >
                    {formatAxisDate(payload.value)}
                  </text>
                );
              }}
            />

            <YAxis
              tickFormatter={(value: number) =>
                value >= 1_000_000
                  ? `R$ ${(value / 1_000_000).toFixed(1)}M`
                  : `R$ ${(value / 1000).toFixed(0)}k`
              }
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              width={72}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1.5 }}
            />

            <ReferenceLine
              y={summary.totalNecessario}
              stroke="hsl(var(--destructive))"
              strokeDasharray="4 4"
              strokeOpacity={0.7}
              label={{
                value: `Meta: ${formatCurrency(summary.totalNecessario)}`,
                position: "insideTopLeft",
                fill: "hsl(var(--destructive))",
                fontSize: 11,
                opacity: 0.8,
              }}
            />

            {summary.atingiuMeta && (
              <ReferenceLine
                x={data.find((d) => d.mes === summary.mesesParaAtingir)?.label}
                stroke="hsl(var(--primary))"
                strokeDasharray="3 3"
                strokeOpacity={0.5}
              />
            )}

            <Area
              type="monotone"
              dataKey="investido"
              name="Total Aportado"
              stroke="#86efac"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorInvestido)"
              dot={false}
              activeDot={{ r: 4, fill: "#86efac", strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="saldo"
              name="Patrimônio Total"
              stroke="hsl(var(--primary))"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorSaldo)"
              dot={false}
              activeDot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
