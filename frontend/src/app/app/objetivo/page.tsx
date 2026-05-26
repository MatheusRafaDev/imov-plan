"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlanContext } from "@/context/PlanContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/MoneyInput";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { brl, calcularEntrada, calcularCustosExtras, calcularMeta, mesesEntre } from "@/lib/finance";
import { Building2, Calendar, Percent, Wallet, ArrowRight } from "lucide-react";

const todayISO = () => {
  if (typeof window !== "undefined") {
    return new Date().toISOString().slice(0, 10);
  }
  return "2026-01-01";
};

const addMonthsISO = (iso: string, months: number) => {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
};

export default function ObjetivoPage() {
  const { objetivo, setObjetivo, saveDraft } = usePlanContext();
  const router = useRouter();



  const [form, setForm] = useState({
    nome: "Meu apê dos sonhos",
    valor_imovel: objetivo?.valorImovel ?? 500000,
    percentual_entrada: objetivo?.percentualEntrada ?? 20,
    data_inicio: objetivo?.dataInicio?.toISOString().slice(0, 10) ?? todayISO(),
    data_fim: addMonthsISO(objetivo?.dataInicio?.toISOString().slice(0, 10) ?? todayISO(), objetivo?.prazoMaxMeses ?? 36),
    valor_ja_guardado: objetivo?.valorJaGuardado ?? 10000,
    taxa_cdi_anual: objetivo?.taxaCdiAnual ?? 13.65,
    percentual_cdi: objetivo?.percentualCdi ?? 100,
    percentual_custos_extras: objetivo?.percentualCustosExtras ?? 5,
  });

  const prazoMeses = mesesEntre(form.data_inicio, form.data_fim);

  const meta = calcularMeta({ valorImovel: form.valor_imovel, percentualEntrada: form.percentual_entrada, percentualCustosExtras: form.percentual_custos_extras });
  const entrada = calcularEntrada(form.valor_imovel, form.percentual_entrada);
  const custos = calcularCustosExtras(form.valor_imovel, form.percentual_custos_extras);
  const falta = Math.max(0, meta - form.valor_ja_guardado);

  const salvar = async (avancar = false) => {
    const novoObjetivo = {
      valorImovel: form.valor_imovel,
      percentualEntrada: form.percentual_entrada,
      percentualCustosExtras: form.percentual_custos_extras,
      valorJaGuardado: form.valor_ja_guardado,
      taxaCdiAnual: form.taxa_cdi_anual,
      percentualCdi: form.percentual_cdi,
      dataInicio: new Date(form.data_inicio),
      prazoMaxMeses: prazoMeses,
    };
    setObjetivo(novoObjetivo);
    await saveDraft({ objetivo: novoObjetivo });
    if (avancar) router.push("/app/pessoas");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-accent font-medium mb-2">Etapa 1 de 4</p>
        <h1 className="font-display text-4xl md:text-5xl mb-2">Qual é o imóvel?</h1>
        <p className="text-muted-foreground">Defina o valor, a entrada e o prazo. Calculamos a meta automaticamente.</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3 p-6 md:p-8 space-y-5 shadow-soft">
          <div>
            <Label htmlFor="nome">Apelido do plano</Label>
            <Input id="nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Valor do imóvel</Label>
              <MoneyInput variant="money" min={50000} max={100000000} value={form.valor_imovel} onChange={(v) => setForm({ ...form, valor_imovel: v })} />
            </div>
            <div>
              <Label>% de entrada</Label>
              <MoneyInput variant="percent" min={0} max={100} value={form.percentual_entrada} onChange={(v) => setForm({ ...form, percentual_entrada: v })} />
            </div>
            <div>
              <Label>Data de início</Label>
              <Input type="date" value={form.data_inicio} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })} />
            </div>
            <div>
              <Label>Data limite (quero comprar até…)</Label>
              <Input type="date" value={form.data_fim} min={form.data_inicio} onChange={(e) => setForm({ ...form, data_fim: e.target.value })} />
            </div>
            <div>
              <Label>Já guardado</Label>
              <MoneyInput variant="money" min={0} max={form.valor_imovel} value={form.valor_ja_guardado} onChange={(v) => setForm({ ...form, valor_ja_guardado: v })} />
            </div>
            <div>
              <Label>CDI anual (%)</Label>
              <MoneyInput variant="percent" min={0} max={30} value={form.taxa_cdi_anual} onChange={(v) => setForm({ ...form, taxa_cdi_anual: v })} />
            </div>
            <div>
              <Label>% do CDI do investimento</Label>
              <MoneyInput variant="percent" min={50} max={200} value={form.percentual_cdi} onChange={(v) => setForm({ ...form, percentual_cdi: v })} />
            </div>
            <div className="sm:col-span-2">
              <Label>Custos extras (ITBI + escritura + registro) — % do imóvel</Label>
              <MoneyInput variant="percent" min={0} max={20} value={form.percentual_custos_extras} onChange={(v) => setForm({ ...form, percentual_custos_extras: v })} />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button onClick={() => salvar(false)} variant="secondary">Salvar</Button>
            <Button onClick={() => salvar(true)} className="bg-gradient-warm text-accent-foreground hover:opacity-90 shadow-glow">
              Salvar e seguir <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <Card className="p-6 bg-gradient-ink text-primary-foreground shadow-elevated">
            <p className="text-xs uppercase tracking-widest opacity-70">Meta total</p>
            <p className="font-display text-4xl mt-1 num">{brl(meta)}</p>
            <p className="text-xs opacity-70 mt-2">Entrada + custos extras</p>
            <div className="mt-5 grid grid-cols-2 gap-4 pt-5 border-t border-white/10">
              <div>
                <p className="text-xs opacity-70">Entrada ({form.percentual_entrada}%)</p>
                <p className="font-display text-xl num">{brl(entrada)}</p>
              </div>
              <div>
                <p className="text-xs opacity-70">Custos ({form.percentual_custos_extras}%)</p>
                <p className="font-display text-xl num">{brl(custos)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6 shadow-soft">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Falta juntar</p>
            <p className="font-display text-3xl mt-1 num text-accent">{brl(falta)}</p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Stat icon={<Building2 className="h-4 w-4" />} label="Imóvel" value={brl(form.valor_imovel)} />
              <Stat icon={<Calendar className="h-4 w-4" />} label="Prazo" value={`${prazoMeses} meses`} />
              <Stat icon={<Percent className="h-4 w-4" />} label="CDI ef." value={`${(form.taxa_cdi_anual * form.percentual_cdi / 100).toFixed(2)}% a.a.`} />
              <Stat icon={<Wallet className="h-4 w-4" />} label="Já tem" value={brl(form.valor_ja_guardado)} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium num">{value}</p>
      </div>
    </div>
  );
}
