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
import { brl, mesesEntre } from "@/lib/finance";
import { MonthYearInput } from "@/components/MonthYearInput";
import { Building2, MapPin, Wallet, ArrowRight, Settings2, ChevronDown, ChevronUp, Sparkles, Info, Percent, Calendar } from "lucide-react";
import { calcularCustosITBI } from "@/utils/itbi";
import { estados, cidadesPorEstado } from "@/utils/ibge-estados-cidades";
import { ImovelFormSkeleton, MetaCardSkeleton, FaltaJuntarSkeleton } from "@/components/Skeleton";

// ITBI utility is now imported from @/utils/itbi

const todayISO = () => {
  if (typeof window !== "undefined") {
    const d = new Date();
    // Use local date parts to avoid UTC timezone shift
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  return "2026-01-01";
};

// Extract YYYY-MM-DD from a Date using LOCAL time (avoids UTC timezone shift)
const dateToLocalISO = (date: Date | string | undefined | null): string => {
  if (!date) return todayISO();
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return todayISO();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const addMonthsISO = (iso: string, months: number) => {
  const [year, month] = iso.split("-").map(Number);
  if (!year || !month) return iso;

  const monthIndex = month - 1 + months;
  const targetYear = year + Math.floor(monthIndex / 12);
  const targetMonth = ((monthIndex % 12) + 12) % 12;

  return `${targetYear}-${String(targetMonth + 1).padStart(2, "0")}-01`;
};

const MIN_PRAZO_MESES = 3;

const normalizeDataFim = (inicio: string, fim: string) => {
  if (!inicio) return fim;
  if (!fim) return addMonthsISO(inicio, MIN_PRAZO_MESES);

  const prazo = mesesEntre(inicio, fim);
  if (prazo < MIN_PRAZO_MESES) {
    return addMonthsISO(inicio, MIN_PRAZO_MESES);
  }

  return fim;
};

export default function ObjetivoPage() {
  const { objetivo, setObjetivo, salvarPlano } = usePlanContext();
  const router = useRouter();

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showITBIInfo, setShowITBIInfo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [form, setForm] = useState({
    nome: "Imóvel",
    valor_imovel: 0 as number | "",
    percentual_entrada: 20 as number | "",
    data_inicio: todayISO(),
    data_fim: "",
    valor_ja_guardado: 0 as number | "",
    percentual_custos_extras: 0 as number | "",
    titular: "" as string | "",
    estado: "SP",
    cidade: "São Paulo",
  });

  const [prevObjetivo, setPrevObjetivo] = useState<any>(null);

  useEffect(() => {
    // Simulate loading or wait for data to be ready
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  if (objetivo !== prevObjetivo) {
    setPrevObjetivo(objetivo);
    if (objetivo && objetivo.valorImovel !== undefined) {
      const nextForm = {
        ...form,
        nome: (objetivo as any).nomePlano || "Imóvel",
        valor_imovel: objetivo.valorImovel || 0,
        percentual_entrada: objetivo.percentualEntrada || 20,
        data_inicio: objetivo.dataInicio ? dateToLocalISO(objetivo.dataInicio) : form.data_inicio,
        valor_ja_guardado: objetivo.valorJaGuardado || 0,
        percentual_custos_extras: objetivo.percentualCustosExtras || 0,
        estado: (objetivo as any).estado || "SP",
        cidade: (objetivo as any).cidade || "São Paulo",
        data_fim: objetivo.prazoMaxMeses
          ? addMonthsISO(
              objetivo.dataInicio ? dateToLocalISO(objetivo.dataInicio) : todayISO(),
              objetivo.prazoMaxMeses
            )
          : form.data_fim,
      };

      setForm((prev) => normalizeDataFim(nextForm.data_inicio, nextForm.data_fim) === nextForm.data_fim ? nextForm : {
        ...nextForm,
        data_fim: normalizeDataFim(nextForm.data_inicio, nextForm.data_fim),
      });
    }
  }

  const dataFimValida = form.data_inicio !== "" && form.data_fim !== "" && mesesEntre(form.data_inicio, form.data_fim) >= MIN_PRAZO_MESES;
  const isFormValid = Number(form.valor_imovel) > 0 && form.data_inicio !== "" && form.data_fim !== "" && dataFimValida;
  
  // Verifica se as datas têm mês selecionado (formato yyyy-mm-dd)
  const dataInicioCompleta = form.data_inicio && form.data_inicio.match(/^\d{4}-\d{2}-\d{2}$/);
  const dataFimCompleta = form.data_fim && form.data_fim.match(/^\d{4}-\d{2}-\d{2}$/);
  const isFormValidComplete = isFormValid && dataInicioCompleta && dataFimCompleta;

  const prazoMeses = form.data_fim ? mesesEntre(form.data_inicio, form.data_fim) : 0;
  const valorImovel = Number(form.valor_imovel) || 0;
  const pctEntrada = Number(form.percentual_entrada) || 0;
  const pctCustos = Number(form.percentual_custos_extras) || 0;
  const entrada = valorImovel * pctEntrada / 100;
  const custos = valorImovel * pctCustos / 100;
  const meta = entrada + custos;
  const falta = Math.max(0, meta - (Number(form.valor_ja_guardado) || 0));

  const itbiInfo = calcularCustosITBI(Number(form.valor_imovel) || 0, form.estado, form.cidade);
  const cidadesDoEstado = cidadesPorEstado[form.estado] || [];

  const objetivoFromForm = (nextForm: typeof form) => ({
    ...(objetivo ?? {}),
    nomePlano: nextForm.nome.trim() === "" ? "Imóvel" : nextForm.nome.trim(),
    valorImovel: Number(nextForm.valor_imovel) || 0,
    percentualEntrada: Number(nextForm.percentual_entrada) || 0,
    percentualCustosExtras: Number(nextForm.percentual_custos_extras) || 0,
    valorJaGuardado: Number(nextForm.valor_ja_guardado) || 0,
    dataInicio: nextForm.data_inicio ? new Date(`${nextForm.data_inicio}T12:00:00`) : undefined,
    prazoMaxMeses: nextForm.data_fim ? mesesEntre(nextForm.data_inicio, nextForm.data_fim) : 0,
    estado: nextForm.estado,
    cidade: nextForm.cidade,
  });

  const updateForm = (patch: Partial<typeof form>, syncObjective = false) => {
    const patchedForm = { ...form, ...patch };
    const normalizedForm = {
      ...patchedForm,
      data_fim: patch.data_inicio || patch.data_fim ? normalizeDataFim(patchedForm.data_inicio, patchedForm.data_fim) : patchedForm.data_fim,
    };

    setForm(normalizedForm);

    if (syncObjective && objetivo) {
      setObjetivo(objetivoFromForm(normalizedForm));
    }
  };

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
        dataInicio: form.data_inicio ? new Date(`${form.data_inicio}T12:00:00`) : undefined,
        prazoMaxMeses: prazoMeses,
        estado: form.estado,
        cidade: form.cidade,
      };

      // Atualiza o estado do contexto
      setObjetivo(novoObjetivo);

      // Salva no backend usando o novoObjetivo diretamente (evita bug de closure/estado desatualizado)
      const sucesso = await salvarPlano(novoObjetivo);

      if (sucesso !== null) {
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

  // Skeleton loading state
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header skeleton */}
        <div className="space-y-2">
          <div className="h-5 w-24 animate-shimmer rounded" />
          <div className="h-10 w-64 animate-shimmer rounded" />
          <div className="h-5 w-80 animate-shimmer rounded" />
        </div>

        <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
          <div className="lg:col-span-3 space-y-6">
            <ImovelFormSkeleton />
          </div>

          <div className="lg:col-span-2 space-y-6">
            <MetaCardSkeleton />
            <FaltaJuntarSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <p className="text-xs uppercase tracking-widest text-accent font-medium mb-2 flex items-center gap-2">
          <Building2 className="h-4 w-4" /> Etapa 1 de 4
        </p>
        <h1 className="font-display text-3xl md:text-4xl lg:text-5xl mb-3">Qual é o imóvel?</h1>
        <p className="text-muted-foreground">Defina o valor e a entrada. Calculamos sua meta automaticamente.</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
        <div className="lg:col-span-3 space-y-6 order-2 lg:order-1">
          <Card className="p-4 sm:p-6 md:p-8 space-y-6 shadow-soft border-border/60">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-muted-foreground">Apelido do plano</Label>
                <Input
                  id="nome"
                  value={form.nome}
                  placeholder="Imóvel"
                  onChange={(e) => updateForm({ nome: e.target.value })}
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
                    onChange={(v) => updateForm({ valor_imovel: v }, true)}
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
                    onChange={(e) => updateForm({ percentual_entrada: Number(e.target.value) }, true)}
                    className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-accent"
                  />
                  <p className="text-xs text-right text-muted-foreground">Equivale a {brl(entrada)}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Data de início</Label>
                  <MonthYearInput
                    value={form.data_inicio}
                    onChange={(v) => updateForm({ data_inicio: v }, true)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Data limite (comprar até)</Label>
                  <MonthYearInput
                    value={form.data_fim}
                    onChange={(v) => updateForm({ data_fim: v }, true)}
                  />
                  {!dataFimValida && form.data_inicio && form.data_fim ? (
                    <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-2">
                      <span className="text-amber-500">⚠</span>
                      A data limite precisa ser pelo menos {MIN_PRAZO_MESES} meses após a data de início.
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-2 min-h-[1.25rem]">
                      O limite define até quando a tabela mês a mês deve ser exibida.
                    </p>
                  )}
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
                <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6">
                  {/* ─── Localização do Imóvel ─── */}
                  <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 space-y-4">
                    <p className="flex items-center gap-2 text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      Localização do Imóvel
                    </p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-muted-foreground text-xs">Estado (UF)</Label>
                        <select
                          value={form.estado}
                          onChange={(e) => {
                            const novoEstado = e.target.value;
                            const primeirasCidades = cidadesPorEstado[novoEstado];
                            const novaCidade = primeirasCidades?.[0]?.nome || "";
                            updateForm({ estado: novoEstado, cidade: novaCidade }, true);
                          }}
                          className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 cursor-pointer transition-colors hover:border-accent/40"
                        >
                          {estados.map((e) => (
                            <option key={e.uf} value={e.uf}>{e.uf} — {e.nome}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-muted-foreground text-xs">Cidade</Label>
                        <select
                          value={form.cidade}
                          onChange={(e) => updateForm({ cidade: e.target.value }, true)}
                          className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 cursor-pointer transition-colors hover:border-accent/40"
                        >
                          {cidadesDoEstado.map((c) => (
                            <option key={c.nome} value={c.nome}>{c.nome}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {itbiInfo.descricaoRegra && (
                      <p className="text-[11px] text-muted-foreground">
                        📍 {itbiInfo.descricaoRegra}
                      </p>
                    )}
                  </div>

                  {/* ─── Valores Financeiros Avançados ─── */}
                  <div className="grid sm:grid-cols-2 gap-6 p-5 rounded-xl bg-secondary/30 border border-border/50">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">Já guardado</Label>
                      <MoneyInput
                        variant="money"
                        min={0}
                        max={form.valor_imovel === "" ? undefined : form.valor_imovel}
                        value={form.valor_ja_guardado}
                        onChange={(v) => updateForm({ valor_ja_guardado: v }, true)}
                      />
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center">
                        <Label className="text-muted-foreground flex items-center gap-1">
                          Custos Extras (ITBI/Cartório)
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
                          onClick={() => updateForm({ percentual_custos_extras: parseFloat(itbiInfo.percentualTotal.toFixed(2)) }, true)}
                          className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-accent hover:text-accent-foreground bg-accent/10 hover:bg-accent px-2 py-0.5 rounded-md border border-accent/20 transition-all active:scale-95"
                        >
                          <Sparkles className="h-3 w-3" />
                          Sugerir {itbiInfo.percentualTotal.toFixed(1)}%
                        </button>
                      </div>

                      <MoneyInput
                        variant="percent"
                        min={0}
                        max={4}
                        value={form.percentual_custos_extras}
                        onChange={(v) => updateForm({ percentual_custos_extras: Math.min(4, Number(v)) }, true)}
                      />

                      {itbiInfo.isento && Number(form.valor_imovel) > 0 && (
                        <div className="flex items-start gap-2 bg-success/10 border border-success/20 rounded-lg p-2.5 text-[11px] text-success font-medium">
                          <span className="text-xs mt-0.5">✓</span>
                          <span>
                            <strong>ITBI Isento:</strong> O percentual sugerido cobre apenas os custos de cartório. Você pode ajustar até 4% se desejar.
                          </span>
                        </div>
                      )}

                      {showITBIInfo && (() => {
                        const valorImovel = Number(form.valor_imovel) || 0;
                        const { itbi, cartorio, total, percentualTotal, isento, faixa, descricaoRegra } = calcularCustosITBI(valorImovel, form.estado, form.cidade);

                        return (
                          <div className="mt-2 p-3 rounded-lg bg-secondary/50 border border-border/60 text-[11px] space-y-2 animate-fade-in-up">
                            <p className="font-semibold text-foreground uppercase tracking-wider text-[10px]">
                              Estimativa ITBI + Cartório — {form.cidade}/{form.estado}
                            </p>

                            {valorImovel <= 0 && (
                              <p className="text-muted-foreground">Preencha o valor do imóvel para ver a estimativa.</p>
                            )}

                            {valorImovel > 0 && (
                              <>
                                {isento && (
                                  <div className="flex items-center gap-1.5 text-success font-medium">
                                    <span className="text-base">✓</span> Elegível para isenção de ITBI
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
                                  {descricaoRegra} Total limitado a máx. 4% pelo sistema.
                                </p>
                              </>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-6">
              <Button
                onClick={salvar}
                disabled={!isFormValidComplete || salvando}
                className="w-full sm:w-auto h-12 px-8 bg-gradient-warm text-accent-foreground hover:opacity-90 shadow-glow"
              >
                {salvando ? "Salvando..." : "Salvar e Continuar"} <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6 order-1 lg:order-2">
          <Card className="p-5 sm:p-8 bg-gradient-ink text-primary-foreground shadow-elevated border-0 relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 h-40 w-40 bg-accent/20 rounded-full blur-3xl group-hover:bg-accent/30 transition-colors duration-700" />

            <div className="relative z-10">
              <p className="text-sm uppercase tracking-widest text-primary-foreground/70 font-medium">Meta Total de Compra</p>
              <p className="font-display text-5xl mt-2 mb-1">{brl(meta)}</p>
              <p className="text-sm text-primary-foreground/60 mb-8">Soma da Entrada + Custos Extras</p>

              <div className="grid grid-cols-2 gap-4 sm:gap-6 pt-6 border-t border-white/10">
                <div>
                  <p className="text-xs text-primary-foreground/60 mb-1 flex items-center gap-1.5">
                    <Percent className="h-3 w-3" /> Entrada ({form.percentual_entrada}%)
                  </p>
                  <p className="font-display text-xl sm:text-2xl">{brl(entrada)}</p>
                </div>
                <div>
                  <p className="text-xs text-primary-foreground/60 mb-1 flex items-center gap-1.5">
                    <Settings2 className="h-3 w-3" /> Custos ({form.percentual_custos_extras}%)
                  </p>
                  <p className="font-display text-xl sm:text-2xl">{brl(custos)}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-5 sm:p-8 shadow-soft border-border/60">
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