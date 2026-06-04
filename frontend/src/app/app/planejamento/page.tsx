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
import { ArrowRight, Plus, Trash2, Sparkles, X, AlertCircle, Pencil } from "lucide-react";

const ORIGENS = ["FGTS", "13º Salário", "Bônus", "Hora Extra", "Férias", "Freelance", "Restituição IR", "PLR", "Venda de bem", "Herança", "Presente", "Outro"];

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
  const [editingAporteIndex, setEditingAporteIndex] = useState<number | null>(null);
  
  const [novoAporte, setNovoAporte] = useState({
    data: new Date().toISOString().slice(0, 10),
    valor: 0 as number | "",
    origem: "13º Salário",
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
    dataInicio: objetivo?.dataInicio ? new Date(objetivo.dataInicio + 'T12:00:00') : new Date(),
    aportesExtras,
  }), [objetivo, aportesExtras, totalGuardado]);
  
  const meta = calcularMeta({
    valorImovel: Number(objetivo?.valorImovel ?? 0),
    percentualEntrada: Number(objetivo?.percentualEntrada ?? 0),
    percentualCustosExtras: Number(objetivo?.percentualCustosExtras ?? 0),
  });

  const prazoMeses = objetivo?.prazoMaxMeses ?? 36;
  const mesesEstimados = mesesParaMeta({ ...baseSim, aporteMensalTotal: aporteTotal });
  
  const progressoPercent = Math.min(100, (totalGuardado / meta) * 100);

  const adicionarAporte = () => {
    if (!novoAporte.valor) return;
    const pessoa = pessoas.find(p => p.id === novoAporte.pessoa_id);
    const aporte: Aporte = {
      data: novoAporte.data,
      valor: novoAporte.valor,
      origem: novoAporte.origem,
      pessoaNome: pessoa ? pessoa.nome : undefined,
    };
    
    if (editingAporteIndex !== null) {
      const updated = [...aportesExtras];
      updated[editingAporteIndex] = aporte;
      setAportesExtras(updated);
      setEditingAporteIndex(null);
    } else {
      setAportesExtras([...aportesExtras, aporte]);
    }
    setNovoAporte({ ...novoAporte, valor: 0 });
  };

  const editarAporte = (index: number) => {
    const aporte = aportesExtras[index];
    setNovoAporte({
      data: aporte.data,
      valor: Number(aporte.valor),
      origem: aporte.origem,
      pessoa_id: "",
    });
    setEditingAporteIndex(index);
    setIsAportesExtrasModalOpen(true);
  };

  const removerAporte = (index: number) => {
    setAportesExtras(aportesExtras.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-2">Etapa 3 de 4</p>
        <h1 className="font-display text-4xl md:text-5xl mb-3 font-light">Acelere seu plano</h1>
        <p className="text-muted-foreground text-lg">Confira o resumo do seu tempo de preparo e adicione entradas extras para chegar lá mais rápido.</p>
      </div>

      {/* Top Cards */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-6 border-border/50 bg-primary/5 flex flex-col justify-center items-center text-center">
          <p className="text-sm font-medium text-muted-foreground mb-2">Tempo estimado</p>
          <p className="font-display text-6xl text-primary num">{mesesEstimados ? `${mesesEstimados}` : "—"}</p>
          <p className="text-sm text-muted-foreground mt-2">{mesesEstimados ? "meses" : "Indefinido"}</p>
        </Card>

        <Card className="p-6 border-border/50 flex flex-col justify-center">
          <p className="text-sm font-medium text-muted-foreground mb-4">Progresso inicial da meta</p>
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

        <Card className="p-6 border-border/50 flex flex-col justify-center">
          <p className="text-sm font-medium text-muted-foreground">Aporte mensal total (Programado)</p>
          <p className="font-display text-4xl num mt-2 leading-none text-accent">{brl(aporteTotal)}</p>
          
          <div className="mt-6 space-y-2">
            {pessoas.map(p => (
              <div key={p.id} className="flex justify-between text-sm items-center border-b border-border/40 pb-2 last:border-0 last:pb-0">
                <span className="text-muted-foreground">{p.nome}</span>
                <span className="num font-medium bg-background px-2 py-1 rounded-md border border-border/50">{brl(Number(p.aporte_mensal || 0))}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Modal Aportes Extras */}
      {isAportesExtrasModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-card text-card-foreground rounded-2xl shadow-xl p-8 relative max-h-[90vh] overflow-y-auto border border-border/50">
            <Button variant="ghost" size="icon" className="absolute top-4 right-4 rounded-full" onClick={() => setIsAportesExtrasModalOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
            
            <h2 className="font-display text-3xl mb-2 font-light">{editingAporteIndex !== null ? "Editar aporte extra" : "Novo aporte extra"}</h2>
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
                <Button variant="ghost" onClick={() => { setIsAportesExtrasModalOpen(false); setEditingAporteIndex(null); }}>Cancelar</Button>
                <Button onClick={() => { adicionarAporte(); setIsAportesExtrasModalOpen(false); }} className="bg-primary text-primary-foreground px-6" disabled={novoAporte.valor === "" || novoAporte.valor <= 0}>
                  <Plus className="h-4 w-4 mr-2" /> {editingAporteIndex !== null ? "Salvar" : "Adicionar Aporte"}
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
                  <div className="col-span-12 md:col-span-1 flex justify-end gap-1 mt-2 md:mt-0">
                    <Button size="icon" variant="ghost" onClick={() => editarAporte(index)} className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary/80">
                      <Pencil className="h-4 w-4" />
                    </Button>
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
