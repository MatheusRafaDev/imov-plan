"use client";

import { useState } from "react";
import { usePlanContext } from "@/context/PlanContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MoneyInput } from "@/components/MoneyInput";
import { brl } from "@/lib/finance";
import api from "@/lib/api";
import { toast } from "sonner";
import { Calculator, Landmark } from "lucide-react";

export default function FinanciamentoPage() {
  const { objetivo } = usePlanContext();
  
  const valorImovel = objetivo?.valorImovel ?? 500000;
  const valorEntrada = (valorImovel * (objetivo?.percentualEntrada ?? 20)) / 100;

  const [form, setForm] = useState({
    valorImovel: valorImovel,
    valorEntrada: valorEntrada,
    taxaJurosAnual: 9.5,
    prazoMeses: 360,
  });

  const [resultado, setResultado] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const simular = async () => {
    setLoading(true);
    try {
      const response = await api.post("/financiamento/simular", form);
      setResultado(response.data);
    } catch (e: any) {
      toast.error("Erro ao simular financiamento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-accent font-medium mb-2">Simulação Extra</p>
        <h1 className="font-display text-4xl md:text-5xl mb-2">Financiamento (SAC)</h1>
        <p className="text-muted-foreground">Saiba como ficarão as parcelas do financiamento usando o método SAC.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 p-6 space-y-4 shadow-soft">
          <div>
            <Label>Valor do Imóvel</Label>
            <MoneyInput variant="money" min={50000} max={100000000} value={form.valorImovel} onChange={(v) => setForm({ ...form, valorImovel: v })} />
          </div>
          <div>
            <Label>Valor da Entrada</Label>
            <MoneyInput variant="money" min={0} max={form.valorImovel} value={form.valorEntrada} onChange={(v) => setForm({ ...form, valorEntrada: v })} />
          </div>
          <div>
            <Label>Taxa de Juros a.a. (%)</Label>
            <MoneyInput variant="percent" min={0} max={30} value={form.taxaJurosAnual} onChange={(v) => setForm({ ...form, taxaJurosAnual: v })} />
          </div>
          <div>
            <Label>Prazo (meses)</Label>
            <MoneyInput variant="decimal" decimals={0} min={12} max={420} value={form.prazoMeses} onChange={(v) => setForm({ ...form, prazoMeses: v })} />
          </div>
          <Button onClick={simular} disabled={loading} className="w-full bg-gradient-warm text-accent-foreground hover:opacity-90 shadow-glow">
            {loading ? "Calculando..." : "Simular"}
            <Calculator className="ml-2 h-4 w-4" />
          </Button>
        </Card>

        <div className="md:col-span-2">
          {resultado ? (
            <Card className="p-6 shadow-soft h-full flex flex-col">
              <div className="mb-6 grid grid-cols-2 gap-4">
                <div className="bg-secondary/40 p-4 rounded-xl border border-border">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1">
                    <Landmark className="h-3 w-3" /> Valor Financiado
                  </p>
                  <p className="font-display text-2xl num">{brl(resultado.valorFinanciado)}</p>
                </div>
                <div className="bg-secondary/40 p-4 rounded-xl border border-border">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Total a Pagar</p>
                  <p className="font-display text-2xl num">{brl(resultado.valorTotalPago)}</p>
                </div>
                <div className="bg-secondary/40 p-4 rounded-xl border border-border">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Primeira Parcela</p>
                  <p className="font-display text-2xl num text-accent">{brl(resultado.parcelas[0]?.valorParcela ?? 0)}</p>
                </div>
                <div className="bg-secondary/40 p-4 rounded-xl border border-border">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Última Parcela</p>
                  <p className="font-display text-2xl num text-success">{brl(resultado.parcelas[resultado.parcelas.length - 1]?.valorParcela ?? 0)}</p>
                </div>
              </div>

              <div className="flex-1 overflow-auto border rounded-xl">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/60 text-muted-foreground sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left">Mês</th>
                      <th className="px-4 py-2 text-right">Amortização</th>
                      <th className="px-4 py-2 text-right">Juros</th>
                      <th className="px-4 py-2 text-right text-foreground">Parcela</th>
                      <th className="px-4 py-2 text-right">Saldo Devedor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultado.parcelas.map((p: any) => (
                      <tr key={p.mes} className="border-t border-border/50 hover:bg-secondary/20">
                        <td className="px-4 py-2 text-muted-foreground">{p.mes}</td>
                        <td className="px-4 py-2 text-right num">{brl(p.amortizacao)}</td>
                        <td className="px-4 py-2 text-right num text-destructive">{brl(p.juros)}</td>
                        <td className="px-4 py-2 text-right num font-medium">{brl(p.valorParcela)}</td>
                        <td className="px-4 py-2 text-right num">{brl(p.saldoDevedor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <div className="h-full border border-dashed rounded-xl flex items-center justify-center text-muted-foreground">
              Preencha os dados e clique em Simular
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
