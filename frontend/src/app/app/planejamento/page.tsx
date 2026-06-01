"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlanContext, type Pessoa } from "@/context/PlanContext";
import { type Aporte } from "@/lib/finance";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/MoneyInput";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { brl, calcularMeta, mesesParaMeta, aporteNecessarioParaPrazo, mesesEntre } from "@/lib/finance";
import { DateInput } from "@/components/DateInput";
import { ArrowRight, Plus, Trash2, Sparkles, X, AlertCircle } from "lucide-react";

const ORIGENS = ["FGTS", "Bônus / 13º", "Freelance", "Restituição IR", "Presente", "Outro"];

export default function PlanejamentoPage() {
  const { objetivo, pessoas, setPessoas, aportesExtras, setAportesExtras, saveDraft } = usePlanContext();
  const router = useRouter();

  const prosseguir = async () => {
    const success = await saveDraft();
    if (success) {
      router.push("/app/resultado");
    } else {
      toast.error("Erro ao salvar os dados. Tente novamente.");
    }
  };
  
  const [isAportesExtrasModalOpen, setIsAportesExtrasModalOpen] = useState(false);
  
  const [novoAporte, setNovoAporte] = useState({
    data: new Date().toISOString().slice(0, 10),
    valor: 0,
    origem: "Bônus / 13º",
    pessoa_id: "",
  });

  const aporteTotal = pessoas.reduce((s, p) => s + Number(p.aporte_mensal ?? 0), 0);
  const pessoasGuardadoSum = pessoas.reduce((s, p) => s + (p.valorInicial ?? 0), 0);
  const totalGuardado = pessoasGuardadoSum > 0 ? pessoasGuardadoSum : Number(objetivo?.valorJaGuardado ?? 0);
  const pessoaGuardado = pessoas.map(p => ({
    id: p.id,
    nome: p.nome,
    valor: p.valorInicial ?? 0,
    percent: totalGuardado ? ((p.valorInicial ?? 0) / totalGuardado) * 100 : 0,
  }));

  const baseSim = useMemo(() => ({
    valorImovel: Number(objetivo?.valorImovel ?? 0),
    percentualEntrada: Number(objetivo?.percentualEntrada ?? 0),
    percentualCustosExtras: Number(objetivo?.percentualCustosExtras ?? 0),
    valorJaGuardado: totalGuardado,
    taxaCdiAnual: Number(objetivo?.taxaCdiAnual ?? 0),
    percentualCdi: Number(objetivo?.percentualCdi ?? 100),
    dataInicio: objetivo?.dataInicio ?? new Date(),
    aportesExtras,
  }), [objetivo, aportesExtras, totalGuardado]);
  
  const meta = calcularMeta({
    valorImovel: Number(objetivo?.valorImovel ?? 0),
    percentualEntrada: Number(objetivo?.percentualEntrada ?? 0),
    percentualCustosExtras: Number(objetivo?.percentualCustosExtras ?? 0),
  });

  const prazoMeses = objetivo?.prazoMaxMeses ?? 36;
  const mesesEstimados = mesesParaMeta({ ...baseSim, aporteMensalTotal: aporteTotal });
  
  const rendaTotal = pessoas.reduce((acc, p) => acc + Number(p.renda_mensal) + Number(p.renda_complementar || 0), 0);
  const aporteSugerido = rendaTotal * 0.4; // 40% da renda total

  // Cálculo de sobras e limites individuais
  const sobras = pessoas.map((p) => Math.max(1, Number(p.renda_mensal) + Number(p.renda_complementar || 0) - Number(p.gastos_mensais)));
  const tSobras = sobras.reduce((a, b) => a + b, 0);

  const pessoasComMinimo = pessoas.map((p, i) => {
    const sobra = Math.max(0, Number(p.renda_mensal) + Number(p.renda_complementar || 0) - Number(p.gastos_mensais));
    const sobraProporcional = sobras[i];
    const minimoSugerido = Math.round((sobraProporcional / tSobras) * aporteSugerido);
    const aporteAtual = Number(p.aporte_mensal || 0);
    const falta = Math.max(0, minimoSugerido - aporteAtual);
    const isAbaixo = aporteAtual < minimoSugerido;
    return { ...p, sobra, minimoSugerido, falta, isAbaixo, aporteAtual };
  });

  const totalSobras = pessoas.reduce((acc, p) => acc + Math.max(0, Number(p.renda_mensal) + Number(p.renda_complementar || 0) - Number(p.gastos_mensais)), 0);
  const progressoPercent = Math.min(100, (totalGuardado / meta) * 100);

  const atualizarPessoa = (pId: string, valor: number) => {
    setPessoas(pessoas.map((p) => p.id === pId ? { ...p, aporte_mensal: valor } : p));
  };

  const distribuirSugerido = () => {
    setPessoas(pessoas.map((p, i) => ({
      ...p,
      aporte_mensal: Math.round((sobras[i] / tSobras) * aporteSugerido),
    })));
  };

  const distribuirTudo = () => {
    setPessoas(pessoas.map((p) => ({
      ...p,
      aporte_mensal: Math.max(0, Number(p.renda_mensal) + Number(p.renda_complementar || 0) - Number(p.gastos_mensais)),
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
    <div className="max-w-6xl mx-auto space-y-10">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-2">Etapa 3 de 4</p>
        <h1 className="font-display text-4xl md:text-5xl mb-3 font-light">Monte o plano mensal</h1>
        <p className="text-muted-foreground text-lg">Defina quanto cada um aporta e adicione entradas extras.</p>
      </div>

      {/* Top Cards */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-6 border-border/50 bg-primary/5 flex flex-col justify-center items-center text-center">
          <p className="text-sm font-medium text-muted-foreground mb-2">Tempo para a meta</p>
          <p className="font-display text-6xl text-primary num">{mesesEstimados ? `${mesesEstimados}` : "—"}</p>
          <p className="text-sm text-muted-foreground mt-2">{mesesEstimados ? "meses" : "Indefinido"}</p>
        </Card>

        <Card className="p-6 border-border/50 flex flex-col justify-center">
          <p className="text-sm font-medium text-muted-foreground mb-4">Progresso da meta</p>
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <span className="font-display text-3xl num leading-none">{brl(totalGuardado)}</span>
              <span className="text-sm text-muted-foreground mb-1">de {brl(meta)}</span>
            </div>
            <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500 ease-in-out" 
                style={{ width: `${progressoPercent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-right">{progressoPercent.toFixed(1)}% alcançado</p>
          </div>
        </Card>

        <Card className="p-6 border-border/50 flex flex-col justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Aporte mensal total</p>
            <p className="font-display text-4xl num mt-2 leading-none">{brl(aporteTotal)}</p>
          </div>
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Sugestão segura</span>
              <Button size="sm" variant="outline" onClick={distribuirSugerido} className="h-8 text-xs px-3 bg-background">
                Aplicar {brl(aporteSugerido)}
              </Button>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Sugestão agressiva</span>
              <Button size="sm" variant="outline" onClick={distribuirTudo} className="h-8 text-xs px-3 bg-background">
                Aplicar {brl(totalSobras)}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Valor Já Guardado */}
      <Card className="p-6 border-border/50">
        <h2 className="font-display text-2xl mb-6 font-light">Valor já guardado</h2>
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-1 w-full space-y-2 md:border-r md:border-border/50 md:pr-6">
            <p className="text-sm text-muted-foreground">Total em caixa</p>
            <p className="font-display text-4xl num">{brl(totalGuardado)}</p>
          </div>
          <div className="flex-[2] w-full space-y-5">
            {pessoaGuardado.map(p => (
              <div key={p.id} className="space-y-2">
                <div className="flex justify-between text-sm items-end">
                  <span className="font-medium text-base">{p.nome}</span>
                  <span className="num">{brl(p.valor)} <span className="text-muted-foreground ml-1">({p.percent.toFixed(1)}%)</span></span>
                </div>
                <div className="h-2.5 w-full bg-secondary/50 rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-500 ease-in-out" style={{ width: `${p.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Aporte de cada pessoa */}
      <div className="space-y-4">
        <h2 className="font-display text-2xl font-light">Aporte de cada pessoa</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {pessoasComMinimo.map((p) => (
            <Card key={p.id} className={`p-6 border transition-colors ${p.isAbaixo ? 'border-destructive/40 bg-destructive/5' : 'border-border/50'}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="font-medium text-lg">{p.nome}</span>
                  <p className="text-xs text-muted-foreground mt-1">Sobra disponível: {brl(p.sobra)}</p>
                </div>
                {p.isAbaixo && (
                  <div className="flex items-center text-xs text-destructive bg-destructive/10 px-2.5 py-1 rounded-md font-medium">
                    <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
                    Abaixo do ideal
                  </div>
                )}
              </div>
              
              <div className="mb-3">
                <MoneyInput variant="money" value={p.aporteAtual}
                  onChange={(v) => atualizarPessoa(p.id, v)}
                  className="font-display text-3xl num h-14 bg-background border-border/60" />
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Sugerido: <span className="num">{brl(p.minimoSugerido)}</span></span>
                {p.isAbaixo && (
                  <span className="text-destructive font-medium">Faltam {brl(p.falta)}</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Modal Aportes Extras */}
      {isAportesExtrasModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-card text-card-foreground rounded-2xl shadow-xl p-8 relative max-h-[90vh] overflow-y-auto border border-border/50">
            <Button variant="ghost" size="icon" className="absolute top-4 right-4 rounded-full" onClick={() => setIsAportesExtrasModalOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
            
            <h2 className="font-display text-3xl mb-2 font-light">Novo aporte extra</h2>
            <p className="text-muted-foreground mb-8 text-sm">Registre entradas como FGTS, bônus, freelances e restituições.</p>

            <div className="space-y-8">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Valor do aporte</Label>
                  <MoneyInput variant="money" value={novoAporte.valor} onChange={(v) => setNovoAporte({ ...novoAporte, valor: v })} className="text-2xl h-14" />
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Data do aporte</Label>
                  <DateInput value={novoAporte.data} onChange={(v) => setNovoAporte({ ...novoAporte, data: v })} />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Origem do dinheiro</Label>
                <div className="flex flex-wrap gap-2">
                  {ORIGENS.map((o) => (
                    <button
                      key={o}
                      type="button"
                      onClick={() => setNovoAporte({ ...novoAporte, origem: o })}
                      className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all border ${novoAporte.origem === o ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-transparent text-muted-foreground border-border hover:border-primary/50 hover:bg-secondary/20'}`}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Quem contribuiu?</Label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setNovoAporte({ ...novoAporte, pessoa_id: "" })}
                    className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all border ${novoAporte.pessoa_id === "" ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-transparent text-muted-foreground border-border hover:border-primary/50 hover:bg-secondary/20'}`}
                  >
                    Conjunto
                  </button>
                  {pessoas.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setNovoAporte({ ...novoAporte, pessoa_id: p.id })}
                      className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all border ${novoAporte.pessoa_id === p.id ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-transparent text-muted-foreground border-border hover:border-primary/50 hover:bg-secondary/20'}`}
                    >
                      {p.nome}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-border/50 flex justify-end gap-3 mt-4">
                <Button variant="ghost" onClick={() => setIsAportesExtrasModalOpen(false)}>Cancelar</Button>
                <Button onClick={() => { adicionarAporte(); setIsAportesExtrasModalOpen(false); }} className="bg-primary text-primary-foreground px-6" disabled={novoAporte.valor <= 0}>
                  <Plus className="h-4 w-4 mr-2" /> Adicionar Aporte
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Aportes Extras */}
      <div className="space-y-4 pt-4">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h2 className="font-display text-2xl font-light">Aportes extras programados</h2>
            <p className="text-sm text-muted-foreground mt-1">Valores adicionais que ajudam a acelerar a meta.</p>
          </div>
          <Button variant="outline" onClick={() => setIsAportesExtrasModalOpen(true)} className="bg-background">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </div>
        
        <div className="border border-border/50 rounded-xl bg-card overflow-hidden shadow-sm">
          {/* Header Row */}
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-border/50 bg-secondary/30 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <div className="col-span-3 md:col-span-2">Data</div>
            <div className="col-span-4 md:col-span-4">Origem</div>
            <div className="col-span-3 md:col-span-3">Pessoa</div>
            <div className="col-span-2 md:col-span-2 text-right">Valor</div>
            <div className="hidden md:block col-span-1"></div>
          </div>
          
          {/* Body */}
          {aportesExtras.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              <p className="text-sm">Nenhum aporte extra adicionado.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {aportesExtras.map((a, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 p-4 items-center text-sm transition-colors hover:bg-secondary/10">
                  <div className="col-span-3 md:col-span-2 num">{new Date(a.data + "T12:00:00").toLocaleDateString("pt-BR")}</div>
                  <div className="col-span-4 md:col-span-4 font-medium flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] hidden sm:flex">
                      {a.origem.substring(0, 2).toUpperCase()}
                    </div>
                    {a.origem}
                  </div>
                  <div className="col-span-3 md:col-span-3 text-muted-foreground truncate">{a.pessoaNome ?? "Conjunto"}</div>
                  <div className="col-span-2 md:col-span-2 text-right num font-medium">{brl(Number(a.valor))}</div>
                  <div className="col-span-12 md:col-span-1 flex justify-end mt-2 md:mt-0">
                    <Button size="icon" variant="ghost" onClick={() => removerAporte(index)} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Botão Prosseguir */}
      <div className="flex justify-end pt-8">
        <Button onClick={prosseguir} size="lg" className="bg-primary text-primary-foreground px-8 h-12 text-base">
          Ver resultado <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
