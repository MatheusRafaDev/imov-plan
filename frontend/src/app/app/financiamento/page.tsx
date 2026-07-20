"use client";

import { useState } from "react";
import { usePlanContext } from "@/context/PlanContext";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MoneyInput } from "@/components/MoneyInput";
import { brl } from "@/lib/finance";
import { FinanciamentoService } from "@/services/FinanciamentoService";
import { toast } from "sonner";
import { Calculator, Landmark, ArrowRight } from "lucide-react";

export default function FinanciamentoPage() {
  const { objetivo, bancoEscolhido } = usePlanContext();

  const [form, setForm] = useState<{valorFinanciado: number | ""; taxaAnual: number | ""; prazoMeses: number | ""}>({
    valorFinanciado: (objetivo?.valorImovel || 500000) - (objetivo?.valorImovel && objetivo?.percentualEntrada ? objetivo.valorImovel * (objetivo.percentualEntrada / 100) : 100000),
    taxaAnual: bancoEscolhido?.taxa ?? 9.5,
    prazoMeses: objetivo?.prazoMaxMeses || 360,
  });

  const [resultado, setResultado] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [sistemaAtivo, setSistemaAtivo] = useState<"sac" | "price">("sac");

  const simular = async () => {
    setLoading(true);
    try {
      const data = await FinanciamentoService.simular(form);
      setResultado(data);
    } catch (e: any) {
      toast.error("Erro ao simular financiamento");
    } finally {
      setLoading(false);
    }
  };

  const dadosAtivos = resultado ? resultado[sistemaAtivo] : null;
  const parcelas = dadosAtivos?.parcelas ?? [];
  const primeiraParcela = parcelas[0]?.parcela ?? 0;
  const ultimaParcela = parcelas[parcelas.length - 1]?.parcela ?? 0;
  const totalPago = parcelas.reduce((acc: number, p: any) => acc + (p.parcela ?? 0), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-accent font-medium mb-2">Etapa 5 de 6</p>
        <h1 className="font-display text-4xl md:text-5xl mb-2">Simulação: {bancoEscolhido?.nome || "Financiamento"}</h1>
        <p className="text-muted-foreground">
          {bancoEscolhido
            ? `Você selecionou ${bancoEscolhido.nome}. Ajuste os valores abaixo se necessário e clique em Simular.`
            : "Saiba como ficarão as parcelas do financiamento usando o método SAC e PRICE."}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 p-6 space-y-4 shadow-soft">
          <div className="space-y-2">
            <Label>Valor Financiado</Label>
            <MoneyInput variant="money" min={0} max={100000000} value={form.valorFinanciado} onChange={(v) => setForm({ ...form, valorFinanciado: v })} />
          </div>
          <div>
            <Label>Taxa de Juros a.a. (%)</Label>
            <MoneyInput variant="percent" min={1} max={30} value={form.taxaAnual} onChange={(v) => setForm({ ...form, taxaAnual: v })} />
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
              <div className="flex flex-col sm:flex-row gap-2 mb-6">
                <Button
                  variant={sistemaAtivo === "sac" ? "default" : "outline"}
                  onClick={() => setSistemaAtivo("sac")}
                  className={sistemaAtivo === "sac" ? "bg-gradient-warm text-accent-foreground" : ""}
                >
                  Tabela SAC
                </Button>
                <Button
                  variant={sistemaAtivo === "price" ? "default" : "outline"}
                  onClick={() => setSistemaAtivo("price")}
                  className={sistemaAtivo === "price" ? "bg-gradient-warm text-accent-foreground" : ""}
                >
                  Tabela PRICE
                </Button>
              </div>

              <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-secondary/40 p-4 rounded-xl border border-border">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1">
                    <Landmark className="h-3 w-3" /> Valor Financiado
                  </p>
                  <p className="font-display text-2xl num">{brl(Number(form.valorFinanciado) || 0)}</p>
                </div>
                <div className="bg-secondary/40 p-4 rounded-xl border border-border">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Total a Pagar ({sistemaAtivo.toUpperCase()})</p>
                  <p className="font-display text-2xl num">{brl(totalPago)}</p>
                </div>
                <div className="bg-secondary/40 p-4 rounded-xl border border-border">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Primeira Parcela</p>
                  <p className="font-display text-2xl num text-accent">{brl(primeiraParcela)}</p>
                </div>
                <div className="bg-secondary/40 p-4 rounded-xl border border-border">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Última Parcela</p>
                  <p className="font-display text-2xl num text-success">{brl(ultimaParcela)}</p>
                </div>
              </div>

              <div className="flex-1 overflow-auto border rounded-xl max-h-[400px]">
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
                    {parcelas.map((p: any) => (
                      <tr key={p.mes} className="border-t border-border/50 hover:bg-secondary/20">
                        <td className="px-4 py-2 text-muted-foreground">{p.mes}</td>
                        <td className="px-4 py-2 text-right num">{brl(p.amortizacao)}</td>
                        <td className="px-4 py-2 text-right num text-destructive">{brl(p.juros)}</td>
                        <td className="px-4 py-2 text-right num font-medium">{brl(p.parcela)}</td>
                        <td className="px-4 py-2 text-right num">{brl(p.saldoDevedor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex justify-between items-center border-t border-border pt-6">
                <Button variant="ghost" onClick={() => window.history.back()}>
                  Voltar
                </Button>
                <Button
                  size="lg"
                  className="bg-gradient-warm text-accent-foreground hover:opacity-90 shadow-glow"
                  onClick={() => window.location.href = "/app/planejamento"}
                >
                  Plano de Ação <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
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
