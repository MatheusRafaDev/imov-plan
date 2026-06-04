"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePlanContext } from "@/context/PlanContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/MoneyInput";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { brl } from "@/lib/finance";
import { FinanciamentoService } from "@/services/FinanciamentoService";
import { PlanoService } from "@/services/PlanoService";
import { Calculator, ArrowRight, Info, TrendingDown, Wallet, Key } from "lucide-react";

export default function ProntoPage() {
  const { objetivo, planoId, pessoas: pessoasPlan } = usePlanContext();
  const router = useRouter();

  const valorImovel = Number(objetivo?.valorImovel) || 0;
  const valorEntradaCalc = valorImovel * ((Number(objetivo?.percentualEntrada) || 20) / 100);

  const [form, setForm] = useState({
    valorImovel: valorImovel || ("" as number | ""),
    valorEntrada: valorEntradaCalc || ("" as number | ""),
    taxaAnual: 9.5 as number | "",
    prazoMeses: 360 as number | "",
  });

  const valorFinanciado = Math.max(0, Number(form.valorImovel || 0) - Number(form.valorEntrada || 0));

  const [resultado, setResultado] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [sistemaAtivo, setSistemaAtivo] = useState<"sac" | "price">("sac");

  // Simulate automatically when all fields are filled
  useEffect(() => {
    const { valorImovel, valorEntrada, taxaAnual, prazoMeses } = form;
    if (valorImovel && taxaAnual && prazoMeses && Number(valorFinanciado) > 0) {
      simular();
    }
  }, [form.valorImovel, form.valorEntrada, form.taxaAnual, form.prazoMeses]);

  const simular = async () => {
    if (!form.taxaAnual || !form.prazoMeses || valorFinanciado <= 0) return;
    setLoading(true);
    try {
      const raw = await FinanciamentoService.simular({
        valorFinanciado,
        taxaAnual: Number(form.taxaAnual),
        prazoMeses: Number(form.prazoMeses),
      });
      // Backend returns PascalCase (SAC.Parcelas[].Mes, etc.) — normalize
      const normalize = (obj: any) => ({
        parcelas: (obj?.Parcelas ?? obj?.parcelas ?? []).map((p: any) => ({
          mes: p.Mes ?? p.mes,
          amortizacao: p.Amortizacao ?? p.amortizacao,
          juros: p.Juros ?? p.juros,
          parcela: p.Parcela ?? p.parcela,
          saldoDevedor: p.SaldoDevedor ?? p.saldoDevedor,
        })),
      });
      setResultado({
        sac: normalize(raw.SAC ?? raw.sac),
        price: normalize(raw.PRICE ?? raw.price),
      });
    } catch (e) {
      console.error("Erro ao simular:", e);
    } finally {
      setLoading(false);
    }
  };

  const dadosAtivos = resultado ? resultado[sistemaAtivo] : null;
  const parcelas = dadosAtivos?.parcelas ?? [];
  const primeiraParcela = parcelas[0]?.parcela ?? 0;
  const ultimaParcela = parcelas[parcelas.length - 1]?.parcela ?? 0;
  const totalPago = parcelas.reduce((acc: number, p: any) => acc + (p.parcela ?? 0), 0);
  const totalJuros = totalPago - valorFinanciado;

  // Max parcel rule (30% of income)
  const rendaMensal = (pessoasPlan || []).reduce((acc, p) => acc + (Number(p.renda_mensal) || 0) + (Number(p.renda_complementar) || 0), 0);
  const parcelaMaxima = rendaMensal * 0.3;
  const parcelaCompativel = primeiraParcela <= parcelaMaxima || parcelaMaxima === 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in-up">
      <div>
        <p className="text-xs uppercase tracking-widest text-accent font-medium mb-2 flex items-center gap-2">
          <Key className="h-4 w-4" /> Simulação — Imóvel Pronto
        </p>
        <h1 className="font-display text-4xl md:text-5xl mb-3">Financiamento bancário</h1>
        <p className="text-muted-foreground">Preencha os dados do imóvel e veja a tabela SAC e PRICE atualizar automaticamente.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Form */}
        <Card className="p-6 space-y-5 shadow-soft border-border/60">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Valor do imóvel</Label>
            <MoneyInput variant="money" min={0} value={form.valorImovel}
              onChange={(v) => setForm({ ...form, valorImovel: v })} placeholder="Ex: R$ 450.000" />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Valor da entrada</Label>
            <MoneyInput variant="money" min={0} value={form.valorEntrada}
              onChange={(v) => setForm({ ...form, valorEntrada: v })} placeholder="Ex: R$ 90.000" />
            {form.valorImovel && form.valorEntrada !== "" && (
              <p className="text-xs text-accent">
                Financiado: {brl(valorFinanciado)} ({((valorFinanciado / Number(form.valorImovel)) * 100).toFixed(0)}%)
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Taxa de juros a.a. (%)</Label>
            <MoneyInput variant="percent" min={1} max={30} value={form.taxaAnual}
              onChange={(v) => setForm({ ...form, taxaAnual: v })} />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Prazo (meses)</Label>
            <MoneyInput variant="decimal" decimals={0} min={12} max={420} value={form.prazoMeses}
              onChange={(v) => setForm({ ...form, prazoMeses: v })} />
            {form.prazoMeses && (
              <p className="text-xs text-muted-foreground">{(Number(form.prazoMeses) / 12).toFixed(0)} anos</p>
            )}
          </div>
          <Button onClick={simular} disabled={loading || valorFinanciado <= 0}
            className="w-full h-11 bg-gradient-warm text-accent-foreground hover:opacity-90 shadow-glow">
            {loading ? "Calculando..." : <><Calculator className="mr-2 h-4 w-4" /> Recalcular</>}
          </Button>
        </Card>

        {/* Results */}
        <div className="lg:col-span-2 space-y-4">
          {resultado ? (
            <>
              {/* Compatibility Alert */}
              {rendaMensal > 0 && (
                <div className={`rounded-xl p-4 flex items-start gap-3 text-sm border ${parcelaCompativel ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300" : "bg-destructive/10 border-destructive/30 text-destructive"}`}>
                  <Info className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    {parcelaCompativel
                      ? `✓ Primeira parcela de ${brl(primeiraParcela)} é compatível com sua renda (limite de 30% = ${brl(parcelaMaxima)}).`
                      : `⚠ Primeira parcela de ${brl(primeiraParcela)} excede 30% da sua renda (${brl(parcelaMaxima)}). Os bancos podem recusar o crédito.`}
                  </span>
                </div>
              )}

              {/* KPIs */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Valor Financiado", value: brl(valorFinanciado), icon: <Wallet className="h-4 w-4" /> },
                  { label: "Total a Pagar", value: brl(totalPago), icon: <Calculator className="h-4 w-4" /> },
                  { label: "Primeira Parcela", value: brl(primeiraParcela), accent: true, icon: <ArrowRight className="h-4 w-4" /> },
                  { label: "Total em Juros", value: brl(totalJuros), warn: true, icon: <TrendingDown className="h-4 w-4" /> },
                ].map((k) => (
                  <Card key={k.label} className={`p-4 shadow-soft border-border/60 ${k.accent ? "bg-gradient-ink text-primary-foreground" : ""}`}>
                    <p className={`text-xs uppercase tracking-widest flex items-center gap-1.5 mb-1 ${k.accent ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {k.icon} {k.label}
                    </p>
                    <p className={`font-display text-2xl ${k.warn ? "text-destructive" : ""}`}>{k.value}</p>
                  </Card>
                ))}
              </div>

              {/* SAC / PRICE Toggle */}
              <Card className="p-5 shadow-soft border-border/60">
                <div className="flex items-center gap-2 mb-4">
                  <Button variant={sistemaAtivo === "sac" ? "default" : "outline"} size="sm"
                    className={sistemaAtivo === "sac" ? "bg-gradient-warm text-accent-foreground" : ""}
                    onClick={() => setSistemaAtivo("sac")}>Tabela SAC</Button>
                  <Button variant={sistemaAtivo === "price" ? "default" : "outline"} size="sm"
                    className={sistemaAtivo === "price" ? "bg-gradient-warm text-accent-foreground" : ""}
                    onClick={() => setSistemaAtivo("price")}>Tabela PRICE</Button>
                  <span className="text-xs text-muted-foreground ml-2">
                    {sistemaAtivo === "sac" ? "Parcelas decrescentes — começa mais caro, termina mais barato." : "Parcelas fixas — mais previsível, mais juros totais."}
                  </span>
                </div>
                <div className="overflow-auto border rounded-xl max-h-80">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/60 text-muted-foreground sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left">Mês</th>
                        <th className="px-3 py-2 text-right">Amortização</th>
                        <th className="px-3 py-2 text-right">Juros</th>
                        <th className="px-3 py-2 text-right font-semibold text-foreground">Parcela</th>
                        <th className="px-3 py-2 text-right">Saldo Devedor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parcelas.map((p: any) => (
                        <tr key={p.mes} className="border-t border-border/50 hover:bg-secondary/20">
                          <td className="px-3 py-2 text-muted-foreground">{p.mes}</td>
                          <td className="px-3 py-2 text-right num">{brl(p.amortizacao)}</td>
                          <td className="px-3 py-2 text-right num text-destructive">{brl(p.juros)}</td>
                          <td className="px-3 py-2 text-right num font-medium">{brl(p.parcela)}</td>
                          <td className="px-3 py-2 text-right num">{brl(p.saldoDevedor)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <div className="flex justify-end">
                <Button onClick={async () => {
                    if (planoId && !planoId.startsWith("local-draft-")) {
                      try {
                        await PlanoService.concluirPlano(planoId);
                      } catch (e) {
                        console.error("Erro ao concluir plano:", e);
                      }
                    }
                    router.push("/app/planejamento");
                  }}
                  className="h-12 px-8 bg-gradient-warm text-accent-foreground hover:opacity-90 shadow-glow">
                  Ir para o Plano <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="h-64 border border-dashed rounded-2xl flex items-center justify-center text-muted-foreground text-sm">
              Preencha os dados ao lado para ver a simulação
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
