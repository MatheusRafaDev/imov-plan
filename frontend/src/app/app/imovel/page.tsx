"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlanLogic } from "@/hooks/usePlanLogic";;
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
import { ImovelPageSkeleton } from "@/components/Skeleton";

// ITBI utility is now imported from @/utils/itbi

import { getBrasiliaToday, toLocalDateIso } from "@/utils/dates";

const todayISO = () => getBrasiliaToday().dataStr;

// Extract YYYY-MM-DD from a Date using Brasilia time
const dateToLocalISO = (date: Date | string | undefined | null): string => {
  if (!date) return todayISO();
  return toLocalDateIso(date) ?? todayISO();
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
  const { objetivo, setObjetivo, salvarPlano, isDraftLoading } = usePlanLogic();
  const router = useRouter();

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showITBIInfo, setShowITBIInfo] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Usa o isDraftLoading do React Query + Zustand para saber quando o backend terminou
  const isLoading = isDraftLoading;

  // Garante scroll livre no container principal
  useEffect(() => {
    const main = document.querySelector(".app-main") as HTMLElement | null;
    if (main) {
      main.style.overflowY = "auto";
    }
  }, []);

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

  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (!objetivo || objetivo.valorImovel === undefined) return;
    
    const inicioStr = objetivo.dataInicio ? dateToLocalISO(objetivo.dataInicio) : todayISO();
    const fimStr = objetivo.prazoMaxMeses
      ? addMonthsISO(inicioStr, objetivo.prazoMaxMeses)
      : addMonthsISO(inicioStr, 36);

    const nextForm = {
      nome: (objetivo as any).nomePlano || "Imóvel",
      valor_imovel: objetivo.valorImovel || 0,
      percentual_entrada: objetivo.percentualEntrada ?? 20,
      data_inicio: inicioStr,
      valor_ja_guardado: objetivo.valorJaGuardado || 0,
      percentual_custos_extras: objetivo.percentualCustosExtras || 0,
      titular: (objetivo as any).titular || "",
      estado: (objetivo as any).estado || "SP",
      cidade: (objetivo as any).cidade || "São Paulo",
      data_fim: normalizeDataFim(inicioStr, fimStr),
    };

    setForm(nextForm);
    setHasInitialized(true);
  }, [(objetivo as any)?.id, objetivo?.valorImovel]);

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

      if (sucesso != null) {
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
    return <ImovelPageSkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up pb-8">
      <div className="animate-fade-in-up" style={{ animationDelay: "0ms" }}>
        <p className="text-xs uppercase tracking-widest text-orange-500 font-medium mb-1 flex items-center gap-2">
          <Building2 className="h-4 w-4" /> Etapa 1 de 4
        </p>
        <h1 className="font-display text-2xl md:text-3xl mb-1 font-normal">Qual é o imóvel?</h1>
        <p className="text-muted-foreground text-sm">Defina o valor e a entrada. Calculamos sua meta automaticamente.</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-4 lg:gap-6">
        <div className="lg:col-span-3 space-y-4 order-2 lg:order-1 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <Card className="p-5 sm:p-6 space-y-6 shadow-soft border-border/60">
            {/* Seção 1: Dados do Imóvel & Localização */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Building2 className="h-4 w-4 text-accent" />
                <span>1. Dados do Imóvel & Localização</span>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="nome" className="text-muted-foreground text-xs">Apelido ou identificação do plano</Label>
                  <Input
                    id="nome"
                    value={form.nome}
                    placeholder="Ex: Apartamento Jardins"
                    onChange={(e) => updateForm({ nome: e.target.value })}
                    className="text-base py-5"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs">Valor do imóvel</Label>
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
                    <Label className="text-muted-foreground text-xs">% de Entrada pretendida</Label>
                    <span className="font-semibold text-accent text-sm">
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
                  <p className="text-xs text-right text-muted-foreground">Equivale a <strong className="text-foreground font-semibold">{brl(entrada)}</strong></p>
                </div>

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
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 bg-secondary/30 p-2.5 rounded-lg border border-border/40">
                  <MapPin className="h-3.5 w-3.5 text-accent shrink-0" />
                  <span>{itbiInfo.descricaoRegra}</span>
                </p>
              )}
            </div>

            {/* Seção 2: Prazos e Saldo Inicial */}
            <div className="space-y-4 pt-4 border-t border-border/40">
              <div className="flex items-center gap-2 pb-2 border-b border-border/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Calendar className="h-4 w-4 text-accent" />
                <span>2. Prazos & Saldo Inicial</span>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs">Início do plano</Label>
                  <MonthYearInput
                    value={form.data_inicio}
                    onChange={(v) => updateForm({ data_inicio: v }, true)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs">Data limite (comprar até)</Label>
                  <MonthYearInput
                    value={form.data_fim}
                    onChange={(v) => updateForm({ data_fim: v }, true)}
                  />
                  {!dataFimValida && form.data_inicio && form.data_fim && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1">
                      <span className="text-amber-500">⚠</span> Mínimo {MIN_PRAZO_MESES} meses.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs">Já guardado (saldo inicial)</Label>
                  <MoneyInput
                    variant="money"
                    min={0}
                    max={form.valor_imovel === "" ? undefined : form.valor_imovel}
                    value={form.valor_ja_guardado}
                    onChange={(v) => updateForm({ valor_ja_guardado: v }, true)}
                  />
                </div>
              </div>
            </div>

            {/* Seção 3: Custos Extras (ITBI e Cartório) */}
            <div className="space-y-4 pt-4 border-t border-border/40">
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Settings2 className="h-4 w-4 text-accent" />
                  <span>3. Custos de Aquisição (ITBI e Cartório)</span>
                </div>
                <button
                  type="button"
                  onClick={() => updateForm({ percentual_custos_extras: parseFloat(itbiInfo.percentualTotal.toFixed(2)) }, true)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-accent hover:text-accent-foreground bg-accent/10 hover:bg-accent/20 px-2.5 py-1 rounded-md transition-all active:scale-95 cursor-pointer"
                >
                  <Sparkles className="h-3 w-3" />
                  Sugerir {itbiInfo.percentualTotal.toFixed(1)}% para {form.cidade}
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 items-center">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-muted-foreground text-xs">% Custos Extras (máx. 4%)</Label>
                    <span className="font-semibold text-accent text-sm">
                      {form.percentual_custos_extras !== "" ? `${form.percentual_custos_extras}%` : "0%"}
                    </span>
                  </div>
                  <MoneyInput
                    variant="percent"
                    min={0}
                    max={4}
                    value={form.percentual_custos_extras}
                    onChange={(v) => updateForm({ percentual_custos_extras: Math.min(4, Number(v)) }, true)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Equivale a <strong className="text-foreground font-semibold">{brl(custos)}</strong> além da entrada.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-secondary/30 border border-border/50 text-xs space-y-1.5">
                  <div className="flex justify-between text-muted-foreground">
                    <span>ITBI estimado:</span>
                    <span className="font-medium text-foreground">{itbiInfo.isento ? "Isento (R$ 0,00)" : brl(itbiInfo.itbi)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Cartório & Registro:</span>
                    <span className="font-medium text-foreground">{brl(itbiInfo.cartorio)}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-1 border-t border-border/40 text-foreground">
                    <span>Estimativa Total:</span>
                    <span className="text-accent">{brl(itbiInfo.total)} ({itbiInfo.percentualTotal.toFixed(2)}%)</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4 order-1 lg:order-2 animate-fade-in-up" style={{ animationDelay: "150ms" }}>
          <Card className="p-4 sm:p-6 bg-gradient-ink text-primary-foreground shadow-elevated border-0 relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 h-40 w-40 bg-accent/20 rounded-full blur-3xl group-hover:bg-accent/30 transition-colors duration-700" />

            <div className="relative z-10">
              <p className="text-sm uppercase tracking-widest text-primary-foreground/70 font-medium">Meta Total de Compra</p>
              <p className="font-display text-3xl mt-1 mb-0.5">{brl(meta)}</p>
              <p className="text-xs text-primary-foreground/60 mb-4">Soma da Entrada + Custos Extras</p>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
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

              {valorImovel > entrada && (
                <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-primary-foreground/75">
                  <span>Saldo a financiar na entrega das chaves:</span>
                  <span className="font-semibold text-white num">{brl(valorImovel - entrada)}</span>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-4 sm:p-6 shadow-soft border-border/60">
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Wallet className="h-5 w-5 text-accent" />
              </div>
              <p className="text-sm uppercase tracking-widest text-muted-foreground font-medium">Falta Juntar</p>
            </div>
            <p className="font-display text-3xl mt-2 text-foreground">{brl(falta)}</p>

            <div className="mt-4 space-y-3">
              <Stat icon={<Building2 className="h-4 w-4" />} label="Valor do Imóvel" value={brl(Number(form.valor_imovel) || 0)} />
              <div className="h-px w-full bg-border/40" />
              <Stat icon={<Calendar className="h-4 w-4" />} label="Tempo de Preparo" value={`${prazoMeses} meses`} />
              <div className="h-px w-full bg-border/40" />
              <Stat icon={<Wallet className="h-4 w-4" />} label="Valor Guardado" value={brl(Number(form.valor_ja_guardado) || 0)} />
            </div>
          </Card>
        </div>
      </div>

      <Card className="p-4 sm:p-5 bg-gradient-ink text-primary-foreground shadow-elevated rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest opacity-70 font-medium">Tudo pronto?</p>
          <p className="font-display text-xl sm:text-2xl mt-0.5">Continue para a próxima etapa</p>
          <p className="text-xs opacity-70 mt-0.5">Siga para definir quem participará do plano com você.</p>
        </div>
        <Button
          onClick={salvar}
          disabled={!isFormValidComplete || salvando}
          className="bg-gradient-warm text-accent-foreground hover:opacity-90 w-full sm:w-auto h-11 px-5"
        >
          {salvando ? "Salvando..." : "Salvar e Continuar"} <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Card>
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