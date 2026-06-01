"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlanContext } from "@/context/PlanContext";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/MoneyInput";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { brl, calcularEntrada, calcularCustosExtras, calcularMeta, mesesEntre } from "@/lib/finance";
import { DateInput } from "@/components/DateInput";
import { Building2, Calendar, Percent, Wallet, ArrowRight, Settings2, ChevronDown, ChevronUp, Sparkles } from "lucide-react";

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

  const [showAdvanced, setShowAdvanced] = useState(false);

  const [form, setForm] = useState({
    nome: "Imóvel",
    valor_imovel: "" as number | "",
    percentual_entrada: "" as number | "",
    data_inicio: todayISO(),
    data_fim: "",
    valor_ja_guardado: "" as number | "",
    taxa_cdi_anual: "" as number | "",
    percentual_cdi: "" as number | "",
    percentual_custos_extras: 0 as number,
  });

  useEffect(() => {
    if (objetivo && objetivo.valorImovel) {
      setForm((prev) => ({
        ...prev,
        nome: (objetivo as any).nomePlano || "Imóvel",
        valor_imovel: objetivo.valorImovel || "",
        percentual_entrada: objetivo.percentualEntrada || "",
        data_inicio: objetivo.dataInicio ? new Date(objetivo.dataInicio).toISOString().slice(0, 10) : prev.data_inicio,
        valor_ja_guardado: objetivo.valorJaGuardado || "",
        taxa_cdi_anual: objetivo.taxaCdiAnual || "",
        percentual_cdi: objetivo.percentualCdi || "",
        percentual_custos_extras: objetivo.percentualCustosExtras || "",
        data_fim: objetivo.prazoMaxMeses ? addMonthsISO(objetivo.dataInicio ? new Date(objetivo.dataInicio).toISOString().slice(0, 10) : todayISO(), objetivo.prazoMaxMeses) : prev.data_fim,
      }));
    }
  }, [objetivo]);

  const isFormValid = form.valor_imovel !== "" && form.percentual_entrada !== "" && form.data_inicio !== "" && form.data_fim !== "";

  const prazoMeses = form.data_fim ? mesesEntre(form.data_inicio, form.data_fim) : 0;
  const meta = calcularMeta({ valorImovel: Number(form.valor_imovel) || 0, percentualEntrada: Number(form.percentual_entrada) || 0, percentualCustosExtras: Number(form.percentual_custos_extras) || 0 });
  const entrada = calcularEntrada(Number(form.valor_imovel) || 0, Number(form.percentual_entrada) || 0);
  const custos = calcularCustosExtras(Number(form.valor_imovel) || 0, Number(form.percentual_custos_extras) || 0);
  const falta = Math.max(0, meta - (Number(form.valor_ja_guardado) || 0));

  const salvar = async (avancar = false) => {
    if (!isFormValid) return;
    const nomePlanoFinal = form.nome.trim() === "" ? "Imóvel" : form.nome.trim();
    const novoObjetivo = {
      nomePlano: nomePlanoFinal,
      valorImovel: Number(form.valor_imovel),
      percentualEntrada: Number(form.percentual_entrada),
      percentualCustosExtras: Number(form.percentual_custos_extras),
      valorJaGuardado: Number(form.valor_ja_guardado) || 0,
      taxaCdiAnual: Number(form.taxa_cdi_anual),
      percentualCdi: Number(form.percentual_cdi),
      dataInicio: form.data_inicio ? new Date(form.data_inicio).toISOString() : undefined,
      prazoMaxMeses: prazoMeses,
    };
    setObjetivo(novoObjetivo);
    const success = await saveDraft({ objetivo: novoObjetivo });
    if (success) {
      setForm((prev) => ({ ...prev, nome: nomePlanoFinal }));
      if (avancar) {
        router.push("/app/pessoas");
      } else {
        toast.success("Rascunho salvo com sucesso!");
      }
    } else {
      toast.error("Erro ao salvar os dados. Tente novamente.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in-up">
      <div>
        <p className="text-xs uppercase tracking-widest text-accent font-medium mb-2 flex items-center gap-2">
          <Building2 className="h-4 w-4" /> Etapa 1 de 4
        </p>
        <h1 className="font-display text-4xl md:text-5xl mb-3">Qual é o imóvel?</h1>
        <p className="text-muted-foreground text-lg">Defina o valor e a entrada. Calculamos sua meta automaticamente.</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <Card className="p-6 md:p-8 space-y-6 shadow-soft border-border/60">
            {/* Campos Básicos */}
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-muted-foreground">Apelido do plano</Label>
                <Input 
                  id="nome" 
                  value={form.nome} 
                  placeholder="Imóvel"
                  onChange={(e) => setForm({ ...form, nome: e.target.value })} 
                  className="text-lg py-6"
                />
              </div>
              
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Valor do imóvel</Label>
                  <MoneyInput 
                    variant="money" 
                    min={50000} 
                    max={100000000} 
                    value={form.valor_imovel} 
                    onChange={(v) => setForm({ ...form, valor_imovel: v })} 
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-muted-foreground">% de Entrada</Label>
                    <span className="font-medium text-accent">{form.percentual_entrada !== "" ? `${form.percentual_entrada}%` : "-"}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={form.percentual_entrada === "" ? 0 : form.percentual_entrada}
                    onChange={(e) => setForm({ ...form, percentual_entrada: Number(e.target.value) })}
                    className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-accent"
                  />
                  <p className="text-xs text-right text-muted-foreground">Equivale a {brl(entrada)}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Data de início</Label>
                  <DateInput 
                    value={form.data_inicio} 
                    onChange={(v) => setForm({ ...form, data_inicio: v })} 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Data limite (comprar até)</Label>
                  <DateInput 
                    value={form.data_fim} 
                    onChange={(v) => setForm({ ...form, data_fim: v })} 
                  />
                </div>
              </div>
            </div>

            {/* Toggle Avançado */}
            <div className="pt-4 border-t border-border/40">
              <button 
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <Settings2 className="h-4 w-4" />
                Configurações Financeiras Avançadas
                {showAdvanced ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
              </button>

              {/* Seção Avançada Oculta */}
              {showAdvanced && (
                <div className="grid sm:grid-cols-2 gap-6 mt-6 animate-fade-in-up p-5 rounded-xl bg-secondary/30 border border-border/50">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Já guardado</Label>
                    <MoneyInput variant="money" min={0} max={form.valor_imovel} value={form.valor_ja_guardado} onChange={(v) => setForm({ ...form, valor_ja_guardado: v })} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-muted-foreground">Custos extras (ITBI/Cartório) %</Label>
                      <button 
                        type="button" 
                        onClick={() => setForm({ ...form, percentual_custos_extras: 5 })}
                        className="group flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-accent transition-all duration-300 bg-accent/10 hover:bg-accent/20 px-2.5 py-1 rounded-full border border-accent/20 hover:border-accent/40 hover:shadow-[0_0_12px_var(--accent-glow,rgba(255,165,0,0.2))] active:scale-95"
                      >
                        <Sparkles className="h-3 w-3 text-accent group-hover:animate-pulse" />
                        Sugerir 5%
                      </button>
                    </div>
                    <MoneyInput variant="percent" min={0} max={20} value={form.percentual_custos_extras} onChange={(v) => setForm({ ...form, percentual_custos_extras: v })} />
                    <p className="text-[11px] text-muted-foreground leading-tight">A média do mercado é de 4% a 5% do valor do imóvel.</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">CDI anual (%)</Label>
                    <MoneyInput variant="percent" min={0} max={30} value={form.taxa_cdi_anual} onChange={(v) => setForm({ ...form, taxa_cdi_anual: v })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">% do CDI do investimento</Label>
                    <MoneyInput variant="percent" min={50} max={200} value={form.percentual_cdi} onChange={(v) => setForm({ ...form, percentual_cdi: v })} />
                  </div>
                </div>
              )}
            </div>
            
            {/* Ações */}
            <div className="flex flex-wrap items-center gap-4 pt-6">
              <Button onClick={() => salvar(false)} variant="outline" className="h-12 px-6" disabled={!isFormValid}>
                Salvar Rascunho
              </Button>
              <Button onClick={() => salvar(true)} disabled={!isFormValid} className="h-12 px-8 bg-gradient-warm text-accent-foreground hover:opacity-90 shadow-glow">
                Salvar e Continuar <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </Card>
        </div>

        {/* Resumo Lateral */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-8 bg-gradient-ink text-primary-foreground shadow-elevated border-0 relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 h-40 w-40 bg-accent/20 rounded-full blur-3xl group-hover:bg-accent/30 transition-colors duration-700" />
            
            <div className="relative z-10">
              <p className="text-sm uppercase tracking-widest text-primary-foreground/70 font-medium">Meta Total de Compra</p>
              <p className="font-display text-5xl mt-2 mb-1">{brl(meta)}</p>
              <p className="text-sm text-primary-foreground/60 mb-8">Soma da Entrada + Custos Extras</p>
              
              <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/10">
                <div>
                  <p className="text-xs text-primary-foreground/60 mb-1 flex items-center gap-1.5">
                    <Percent className="h-3 w-3" /> Entrada ({form.percentual_entrada}%)
                  </p>
                  <p className="font-display text-2xl">{brl(entrada)}</p>
                </div>
                <div>
                  <p className="text-xs text-primary-foreground/60 mb-1 flex items-center gap-1.5">
                    <Settings2 className="h-3 w-3" /> Custos ({form.percentual_custos_extras}%)
                  </p>
                  <p className="font-display text-2xl">{brl(custos)}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-8 shadow-soft border-border/60">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Wallet className="h-5 w-5 text-accent" />
              </div>
              <p className="text-sm uppercase tracking-widest text-muted-foreground font-medium">Falta Juntar</p>
            </div>
            <p className="font-display text-4xl mt-3 text-foreground">{brl(falta)}</p>
            
            <div className="mt-8 space-y-5">
              <Stat icon={<Building2 className="h-4 w-4" />} label="Valor do Imóvel" value={brl(form.valor_imovel)} />
              <div className="h-px w-full bg-border/40" />
              <Stat icon={<Calendar className="h-4 w-4" />} label="Tempo de Preparo" value={`${prazoMeses} meses`} />
              <div className="h-px w-full bg-border/40" />
              <Stat icon={<Wallet className="h-4 w-4" />} label="Valor Guardado" value={brl(form.valor_ja_guardado)} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5 text-muted-foreground">
        {icon}
        <p className="text-sm">{label}</p>
      </div>
      <p className="font-medium text-sm">{value}</p>
    </div>
  );
}
