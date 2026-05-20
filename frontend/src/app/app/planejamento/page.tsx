"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlanContext, type Pessoa } from "@/context/PlanContext";
import { type Aporte } from "@/lib/finance";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/MoneyInput";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { brl, calcularMeta, mesesParaMeta, aporteNecessarioParaPrazo, mesesEntre } from "@/lib/finance";
import { ArrowRight, Plus, Trash2, Sparkles } from "lucide-react";

const ORIGENS = ["FGTS", "Bônus / 13º", "Freelance", "Restituição IR", "Presente", "Outro"];

export default function PlanejamentoPage() {
  const { objetivo, pessoas, setPessoas, aportesExtras, setAportesExtras } = usePlanContext();
  const router = useRouter();
  
  const [novoAporte, setNovoAporte] = useState({
    data: new Date().toISOString().slice(0, 10),
    valor: 0,
    origem: "Bônus / 13º",
    pessoa_id: "",
  });

  const aporteTotal = pessoas.reduce((s, p) => s + Number(p.aporte_mensal ?? 0), 0);
  const meta = calcularMeta({
    valorImovel: Number(objetivo?.valorImovel ?? 0),
    percentualEntrada: Number(objetivo?.percentualEntrada ?? 0),
    percentualCustosExtras: Number(objetivo?.percentualCustosExtras ?? 0),
  });

  const baseSim = useMemo(() => ({
    valorImovel: Number(objetivo?.valorImovel ?? 0),
    percentualEntrada: Number(objetivo?.percentualEntrada ?? 0),
    percentualCustosExtras: Number(objetivo?.percentualCustosExtras ?? 0),
    valorJaGuardado: Number(objetivo?.valorJaGuardado ?? 0),
    taxaCdiAnual: Number(objetivo?.taxaCdiAnual ?? 0),
    percentualCdi: Number(objetivo?.percentualCdi ?? 100),
    dataInicio: objetivo?.dataInicio ?? new Date(),
    aportesExtras,
  }), [objetivo, aportesExtras]);

  const prazoMeses = objetivo?.prazoMaxMeses ?? 36;
  const mesesEstimados = mesesParaMeta({ ...baseSim, aporteMensalTotal: aporteTotal });
  const aporteSugeridoPrazo = aporteNecessarioParaPrazo({ ...baseSim, prazoMeses });

  const atualizarPessoa = (pId: string, valor: number) => {
    setPessoas(pessoas.map((p) => p.id === pId ? { ...p, aporte_mensal: valor } : p));
  };

  const distribuirSugerido = () => {
    const sobras = pessoas.map((p) => Math.max(1, Number(p.renda_mensal) - Number(p.gastos_mensais)));
    const total = sobras.reduce((a, b) => a + b, 0);
    setPessoas(pessoas.map((p, i) => ({
      ...p,
      aporte_mensal: Math.round((sobras[i] / total) * aporteSugeridoPrazo),
    })));
  };

  const adicionarAporte = () => {
    if (!novoAporte.valor) return;
    const pessoa = pessoas.find(p => p.id === novoAporte.pessoa_id);
    const aporte: Aporte = {
      data: novoAporte.data,
      valor: novoAporte.valor,
      origem: novoAporte.origem,
      pessoaNome: pessoa ? pessoa.nome : undefined,
    };
    setAportesExtras([...aportesExtras, aporte]);
    setNovoAporte({ ...novoAporte, valor: 0 });
  };

  const removerAporte = (index: number) => {
    setAportesExtras(aportesExtras.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-accent font-medium mb-2">Etapa 3 de 4</p>
        <h1 className="font-display text-4xl md:text-5xl mb-2">Monte o plano mensal</h1>
        <p className="text-muted-foreground">Defina quanto cada um aporta e adicione entradas extras.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-5 shadow-soft">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Aporte mensal total</p>
          <p className="font-display text-3xl num mt-1">{brl(aporteTotal)}</p>
        </Card>
        <Card className="p-5 shadow-soft">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Atinge a meta em</p>
          <p className="font-display text-3xl num mt-1">{mesesEstimados ? `${mesesEstimados} meses` : "—"}</p>
          <p className="text-xs text-muted-foreground mt-1">Meta: {brl(meta)}</p>
        </Card>
        <Card className="p-5 shadow-soft bg-secondary/40">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Sugestão p/ {prazoMeses}m</p>
              <p className="font-display text-3xl num mt-1">{brl(aporteSugeridoPrazo)}</p>
            </div>
            <Button size="sm" variant="ghost" onClick={distribuirSugerido} title="Distribuir entre as pessoas">
              <Sparkles className="h-4 w-4 mr-1" /> Aplicar
            </Button>
          </div>
        </Card>
      </div>

      <Card className="p-6 shadow-soft">
        <h2 className="font-display text-2xl mb-4">Aporte de cada pessoa</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {pessoas.map((p) => (
            <div key={p.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{p.nome}</span>
                <span className="text-xs text-muted-foreground">sobra {brl(Number(p.renda_mensal) - Number(p.gastos_mensais))}</span>
              </div>
              <MoneyInput variant="money" value={Number(p.aporte_mensal)}
                onChange={(v) => atualizarPessoa(p.id, v)}
                className="font-display text-2xl num h-12" />
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 shadow-soft">
        <h2 className="font-display text-2xl mb-1">Aportes extras</h2>
        <p className="text-sm text-muted-foreground mb-4">FGTS, bônus, freelances, restituição — tudo que entra fora do mês.</p>

        <div className="grid md:grid-cols-5 gap-3 items-end mb-4">
          <div>
            <Label className="text-xs">Data</Label>
            <Input type="date" value={novoAporte.data} onChange={(e) => setNovoAporte({ ...novoAporte, data: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Valor</Label>
            <MoneyInput variant="money" value={novoAporte.valor}
              onChange={(v) => setNovoAporte({ ...novoAporte, valor: v })} />
          </div>
          <div>
            <Label className="text-xs">Origem</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={novoAporte.origem}
              onChange={(e) => setNovoAporte({ ...novoAporte, origem: e.target.value })}
            >
              {ORIGENS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-xs">Pessoa</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={novoAporte.pessoa_id}
              onChange={(e) => setNovoAporte({ ...novoAporte, pessoa_id: e.target.value })}
            >
              <option value="">Conjunto</option>
              {pessoas.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>
          <Button onClick={adicionarAporte} className="bg-gradient-warm text-accent-foreground hover:opacity-90">
            <Plus className="h-4 w-4 mr-1" /> Adicionar
          </Button>
        </div>

        {aportesExtras.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center border border-dashed rounded-lg">Nenhum aporte extra ainda.</p>
        ) : (
          <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
            {aportesExtras.map((a, index) => (
              <div key={index} className="grid grid-cols-12 items-center gap-2 px-4 py-3 text-sm">
                <span className="col-span-3 num">{new Date(a.data).toLocaleDateString("pt-BR")}</span>
                <span className="col-span-3">{a.origem}</span>
                <span className="col-span-3 text-muted-foreground">{a.pessoaNome ?? "Conjunto"}</span>
                <span className="col-span-2 num font-medium">{brl(Number(a.valor))}</span>
                <Button size="icon" variant="ghost" onClick={() => removerAporte(index)} className="col-span-1 justify-self-end">
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => router.push("/app/resultado")} className="bg-gradient-warm text-accent-foreground hover:opacity-90 shadow-glow">
          Ver resultado <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
