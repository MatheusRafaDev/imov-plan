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
import { MonthYearInput } from "@/components/MonthYearInput";
import { Building2, Calendar, Percent, Wallet, ArrowRight, Settings2, ChevronDown, ChevronUp, Sparkles, Info } from "lucide-react";

// ─── ITBI + Cartório Rule (SP 2025/2026) ─────────────────────────────────────
function calcularCustosITBI(valorImovel: number): {
  itbi: number;
  cartorio: number;
  total: number;
  percentualTotal: number;
  isento: boolean;
  faixa: "isento" | "sfh" | "acima_sfh";
} {
  if (valorImovel <= 0) {
    return { itbi: 0, cartorio: 0, total: 0, percentualTotal: 0, isento: false, faixa: "isento" };
  }

  const ISENCAO_SP = 335000;
  const TETO_SFH = 1500000;
  const ITBI_CHEIO = 0.03;
  const ITBI_SFH = 0.005;

  let itbi = 0;
  let isento = false;
  let faixa: "isento" | "sfh" | "acima_sfh";

  if (valorImovel <= ISENCAO_SP) {
    itbi = 0;
    isento = true;
    faixa = "isento";
  } else if (valorImovel <= TETO_SFH) {
    itbi = valorImovel * ITBI_SFH;
    faixa = "sfh";
  } else {
    itbi = valorImovel * ITBI_CHEIO;
    faixa = "acima_sfh";
  }

  let cartorio = 0;
  if (valorImovel <= 100000) {
    cartorio = 1500;
  } else if (valorImovel <= 300000) {
    cartorio = valorImovel * 0.015;
  } else if (valorImovel <= 700000) {
    cartorio = valorImovel * 0.013;
  } else if (valorImovel <= 1500000) {
    cartorio = valorImovel * 0.011;
  } else {
    cartorio = valorImovel * 0.009;
  }

  const totalBruto = itbi + cartorio;
  const capAbsoluto = valorImovel * 0.04;
  const total = Math.min(totalBruto, capAbsoluto);

  const percentualTotal = (total / valorImovel) * 100;

  return { itbi, cartorio, total, percentualTotal, isento, faixa };
}

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
  const { objetivo, setObjetivo, salvarPlano } = usePlanContext();
  const router = useRouter();

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showITBIInfo, setShowITBIInfo] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const [form, setForm] = useState({
    nome: "Imóvel",
    valor_imovel: 0 as number | "",
    percentual_entrada: 20 as number | "",
    data_inicio: todayISO(),
    data_fim: "",
    valor_ja_guardado: 0 as number | "",
    percentual_custos_extras: 0 as number | "",
    titular: "" as string | "",
  });

  useEffect(() => {
    if (objetivo && objetivo.valorImovel !== undefined) {
      setForm((prev) => ({
        ...prev,
        nome: (objetivo as any).nomePlano || "Imóvel",
        valor_imovel: objetivo.valorImovel || 0,
        percentual_entrada: objetivo.percentualEntrada || 20,
        data_inicio: objetivo.dataInicio ? new Date(objetivo.dataInicio).toISOString().slice(0, 10) : prev.data_inicio,
        valor_ja_guardado: objetivo.valorJaGuardado || 0,
        percentual_custos_extras: objetivo.percentualCustosExtras || 0,
        data_fim: objetivo.prazoMaxMeses
          ? addMonthsISO(
              objetivo.dataInicio ? new Date(objetivo.dataInicio).toISOString().slice(0, 10) : todayISO(),
              objetivo.prazoMaxMeses
            )
          : prev.data_fim,
      }));
    }
  }, [objetivo]);

  const isFormValid = Number(form.valor_imovel) > 0 && form.data_inicio !== "" && form.data_fim !== "";

  const prazoMeses = form.data_fim ? mesesEntre(form.data_inicio, form.data_fim) : 0;
  const meta = calcularMeta({
    valorImovel: Number(form.valor_imovel) || 0,
    percentualEntrada: Number(form.percentual_entrada) || 0,
    percentualCustosExtras: Number(form.percentual_custos_extras) || 0,
  });
  const entrada = calcularEntrada(Number(form.valor_imovel) || 0, Number(form.percentual_entrada) || 0);
  const custos = calcularCustosExtras(Number(form.valor_imovel) || 0, Number(form.percentual_custos_extras) || 0);
  const falta = Math.max(0, meta - (Number(form.valor_ja_guardado) || 0));

  const itbiInfo = calcularCustosITBI(Number(form.valor_imovel) || 0);

  const salvar = async () => {
    if (!isFormValid || salvando) return;
    setSalvando(true);
    
    try {
      const nomePlanoFinal = form.nome.trim() === "" ? "Imóvel" : form.nome.trim();
      const novoObjetivo = {
        nomePlano: nomePlanoFinal,
        valorImovel: Number(form.valor_imovel),
        percentualEntrada: Number(form.percentual_entrada),
        percentualCustosExtras: Number(form.percentual_custos_extras),
        valorJaGuardado: Number(form.valor_ja_guardado) || 0,
        dataInicio: form.data_inicio ? new Date(form.data_inicio) : undefined,
        prazoMaxMeses: prazoMeses,
      };

      // Atualiza o estado do contexto
      setObjetivo(novoObjetivo);

      // Salva no backend usando o novoObjetivo diretamente (evita bug de closure/estado desatualizado)
      const sucesso = await salvarPlano(novoObjetivo);

      if (sucesso !== false) {
        setForm((prev) => ({ ...prev, nome: nomePlanoFinal }));
        toast.success("Plano salvo com sucesso!");
        router.push("/app/pessoas");
      } else {
        toast.error("Erro ao salvar os dados. Tente novamente.");
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar os dados. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
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
                    <span className="font-medium text-accent">
                      {form.percentual_entrada !== "" ? `${form.percentual_entrada}%` : "-"}
                    </span>
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
                  <MonthYearInput
                    value={form.data_inicio}
                    onChange={(v) => setForm({ ...form, data_inicio: v })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Data limite (comprar até)</Label>
                  <MonthYearInput
                    value={form.data_fim}
                    onChange={(v) => setForm({ ...form, data_fim: v })}
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border/40">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <Settings2 className="h-4 w-4" />
                Configurações Financeiras Avançadas
                {showAdvanced ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
              </button>

              {showAdvanced && (
                <div className="grid sm:grid-cols-2 gap-6 mt-6 animate-fade-in-up p-5 rounded-xl bg-secondary/30 border border-border/50">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Já guardado</Label>
                    <MoneyInput
                      variant="money"
                      min={0}
                      max={form.valor_imovel === "" ? undefined : form.valor_imovel}
                      value={form.valor_ja_guardado}
                      onChange={(v) => setForm({ ...form, valor_ja_guardado: v })}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-muted-foreground flex items-center gap-1.5">
                        Custos extras (ITBI/Cartório) %
                        <button
                          type="button"
                          onClick={() => setShowITBIInfo((o) => !o)}
                          className="text-muted-foreground/60 hover:text-accent transition-colors"
                          title="Ver regras do ITBI"
                        >
                          <Info className="h-3.5 w-3.5" />
                        </button>
                      </Label>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, percentual_custos_extras: itbiInfo.isento ? 0 : parseFloat(itbiInfo.percentualTotal.toFixed(2)) })}
                        className="group flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-accent transition-all duration-300 bg-accent/10 hover:bg-accent/20 px-2.5 py-1 rounded-full border border-accent/20 hover:border-accent/40 hover:shadow-[0_0_12px_var(--accent-glow,rgba(255,165,0,0.2))] active:scale-95"
                      >
                        <Sparkles className="h-3 w-3 text-accent group-hover:animate-pulse" />
                        Sugerir {itbiInfo.isento ? "0" : itbiInfo.percentualTotal.toFixed(1)}%
                      </button>
                    </div>

                    <MoneyInput
                      variant="percent"
                      min={0}
                      max={4}
                      value={form.percentual_custos_extras}
                      onChange={(v) => setForm({ ...form, percentual_custos_extras: Math.min(4, Number(v)) })}
                    />

                    {itbiInfo.isento && Number(form.valor_imovel) > 0 && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                        ✓ ITBI isento — sugerimos 0%, mas você pode ajustar até 4% conforme desejar.
                      </p>
                    )}

                    {showITBIInfo && (() => {
                      const valorImovel = Number(form.valor_imovel) || 0;
                      const { itbi, cartorio, total, percentualTotal, isento, faixa } = calcularCustosITBI(valorImovel);

                      return (
                        <div className="mt-2 p-3 rounded-lg bg-secondary/50 border border-border/60 text-[11px] space-y-2 animate-fade-in-up">
                          <p className="font-semibold text-foreground uppercase tracking-wider text-[10px]">
                            Estimativa ITBI + Cartório (SP 2025/2026)
                          </p>

                          {valorImovel <= 0 && (
                            <p className="text-muted-foreground">Preencha o valor do imóvel para ver a estimativa.</p>
                          )}

                          {valorImovel > 0 && (
                            <>
                              {isento && (
                                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                                  <span className="text-base">✓</span> Elegível para isenção de ITBI (valor abaixo de R$ 335.000)
                                </div>
                              )}

                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground pt-1">
                                <span>ITBI estimado:</span>
                                <span className="text-right font-medium text-foreground">
                                  {isento ? "R$ 0,00 (isento)" : brl(itbi)}
                                </span>
                                <span>Cartório + Registro:</span>
                                <span className="text-right font-medium text-foreground">{brl(cartorio)}</span>
                                <span className="font-semibold text-foreground pt-1 border-t border-border/40">Total estimado:</span>
                                <span className="text-right font-bold text-accent pt-1 border-t border-border/40">
                                  {brl(total)} ({percentualTotal.toFixed(2)}%)
                                </span>
                              </div>

                              <p className="text-muted-foreground/70 text-[10px] pt-1 border-t border-border/40">
                                {faixa === "isento" &&
                                  "* Isenção para 1º imóvel / MCMV / HIS em SP. Cartório e registro estimados sobre o valor total."}
                                {faixa === "sfh" &&
                                  "* SFH: 0,5% de ITBI sobre o valor total + cartório escalonado. Teto SFH R$ 1.500.000."}
                                {faixa === "acima_sfh" &&
                                  "* Acima do teto SFH: 3% de ITBI sobre o valor total + cartório escalonado."}
                                {" "}Total limitado a máx. 4% pelo sistema.
                              </p>
                            </>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-6">
              <Button
                onClick={salvar}
                disabled={!isFormValid || salvando}
                className="h-12 px-8 bg-gradient-warm text-accent-foreground hover:opacity-90 shadow-glow"
              >
                {salvando ? "Salvando..." : "Salvar e Continuar"} <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </Card>
        </div>

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
              <Stat icon={<Building2 className="h-4 w-4" />} label="Valor do Imóvel" value={brl(Number(form.valor_imovel) || 0)} />
              <div className="h-px w-full bg-border/40" />
              <Stat icon={<Calendar className="h-4 w-4" />} label="Tempo de Preparo" value={`${prazoMeses} meses`} />
              <div className="h-px w-full bg-border/40" />
              <Stat icon={<Wallet className="h-4 w-4" />} label="Valor Guardado" value={brl(Number(form.valor_ja_guardado) || 0)} />
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