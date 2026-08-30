"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePlanContext } from "@/context/PlanContext";
import { Button } from "@/components/ui/button";
import { MoneyInput } from "@/components/MoneyInput";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { brl } from "@/lib/finance";
import { toast } from "sonner";

function LancarAporteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mesQuery = searchParams.get("mes");

  const {
    pessoas,
    aportesRegularesEditadosPorPessoa,
    setAportesRegularesEditadosPorPessoa,
    mesesConcluidos,
    setMesesConcluidos,
    saveDraft,
    backendData,
    calculating,
  } = usePlanContext();

  const detalhes = backendData?.detalhesMensais ?? [];

  // Mês sugerido: o primeiro que ainda não foi marcado como concluído (ignorando o mês 0 / início)
  const mesSugerido = useMemo(() => {
    if (mesQuery) {
      const q = parseInt(mesQuery, 10);
      if (!isNaN(q) && q >= 1) return q;
    }
    const concluidos = new Set(mesesConcluidos);
    const candidato = detalhes.find((d) => d.mes > 0 && !concluidos.has(d.mes));
    return candidato?.mes ?? (detalhes.length ? detalhes[detalhes.length - 1].mes : 1);
  }, [detalhes, mesesConcluidos, mesQuery]);

  const [mesAtual, setMesAtual] = useState<number | null>(null);
  useEffect(() => {
    if (mesAtual === null && detalhes.length) setMesAtual(mesSugerido);
  }, [mesSugerido, mesAtual, detalhes.length]);

  const [saving, setSaving] = useState(false);
  const [metaAntes, setMetaAntes] = useState<string | null>(null);
  const [metaDepois, setMetaDepois] = useState<{ data: string; mesmoMes: boolean } | null>(null);

  const linhaMes = detalhes.find((d) => d.mes === mesAtual);
  const maxMes = detalhes.length ? detalhes[detalhes.length - 1].mes : 1;

  const [valores, setValores] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!linhaMes) return;
    const iniciais: Record<string, number> = {};
    pessoas.forEach((p) => {
      const doMes = linhaMes.participantes?.find((pp) => pp.participanteId === p.id);
      iniciais[p.id] = (doMes?.aporteMensal ?? Number(p.aporte_mensal)) || 0;
    });
    setValores(iniciais);
    setMetaDepois(null);
  }, [mesAtual, linhaMes, pessoas]);

  if (!detalhes.length || mesAtual === null) {
    return (
      <div className="max-w-screen-sm mx-auto px-4 py-10 text-center text-muted-foreground flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin"></div>
        <p>Carregando plano...</p>
      </div>
    );
  }

  if (pessoas.length === 0) {
    return (
      <div className="max-w-screen-sm mx-auto px-4 py-10 text-center text-muted-foreground flex flex-col items-center gap-4">
        <p>Nenhuma pessoa cadastrada no plano.</p>
        <Button onClick={() => router.push("/app/pessoas")}>Cadastrar pessoas</Button>
      </div>
    );
  }

  const jaConcluido = mesesConcluidos.includes(mesAtual);
  const total = pessoas.reduce((s, p) => s + (valores[p.id] ?? 0), 0);

  const confirmar = async () => {
    setSaving(true);
    setMetaAntes(backendData?.dataPrevistaAlvo ?? null);

    try {
      const novoEstado = { ...aportesRegularesEditadosPorPessoa };
      pessoas.forEach((p) => {
        const planejado = Number(p.aporte_mensal) || 0;
        const editado = { ...(novoEstado[p.id] || {}) };
        const val = valores[p.id] ?? 0;
        if (val === planejado) {
          delete editado[mesAtual];
        } else {
          editado[mesAtual] = val;
        }
        novoEstado[p.id] = editado;
      });

      const novosMesesConcluidos = mesesConcluidos.includes(mesAtual)
        ? mesesConcluidos
        : [...mesesConcluidos, mesAtual];

      setAportesRegularesEditadosPorPessoa(novoEstado);
      setMesesConcluidos(novosMesesConcluidos);

      await saveDraft({
        aportesRegularesEditadosPorPessoa: novoEstado,
        mesesConcluidos: novosMesesConcluidos,
      });

      toast.success(`Aporte de ${mesLabel(linhaMes!.dataReferencia)} salvo`);

      // O recálculo no backend roda com debounce (~1.2s) assim que o draft muda.
      // Avisamos o usuário e comparamos a data prevista assim que ela mudar.
      toast.loading("Ajustando a previsão da meta...", { id: "ajuste-meta" });
    } catch (e) {
      console.error(e);
      toast.error("Erro ao salvar aporte");
      setMetaAntes(null);
    } finally {
      setSaving(false);
    }
  };


  useEffect(() => {
    if (metaAntes === null || calculating) return;
    const depois = backendData?.dataPrevistaAlvo ?? null;
    if (!depois) return;
    if (depois !== metaAntes) {
      setMetaDepois({ data: depois, mesmoMes: false });
      toast.success(
        `Meta ajustada: prevista agora para ${new Date(depois).toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" })}`,
        { id: "ajuste-meta" }
      );
    } else {
      setMetaDepois({ data: depois, mesmoMes: true });
      toast.success("Sem impacto na data da meta", { id: "ajuste-meta" });
    }
    setMetaAntes(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backendData?.dataPrevistaAlvo, calculating]);

  return (
    <div className="max-w-screen-sm w-full mx-auto space-y-6 px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-primary transition-colors" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      </div>

      <div>
        <h1 className="font-display text-xl sm:text-2xl font-light">Lançar aporte do mês</h1>
        <p className="text-sm text-muted-foreground mt-1">Diga quanto foi realmente aportado. O plano se ajusta sozinho.</p>
      </div>


      <div className="flex items-center gap-2">
        <button
          onClick={() => setMesAtual((m) => Math.max(1, (m ?? 1) - 1))}
          disabled={mesAtual <= 1}
          className="w-10 h-10 rounded-xl border border-border flex items-center justify-center disabled:opacity-30 hover:bg-secondary/50 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 text-center">
          <span className="font-medium text-lg">{linhaMes ? mesLabel(linhaMes.dataReferencia) : ""}</span>
          {jaConcluido && (
            <div className="mt-1 flex items-center justify-center gap-1 text-[11px] uppercase font-bold text-success">
              <Check className="w-3 h-3" /> lançado
            </div>
          )}
        </div>
        <button
          onClick={() => setMesAtual((m) => Math.min(maxMes, (m ?? 1) + 1))}
          disabled={mesAtual >= maxMes}
          className="w-10 h-10 rounded-xl border border-border flex items-center justify-center disabled:opacity-30 hover:bg-secondary/50 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-card border border-border/50 rounded-3xl p-5 sm:p-6 shadow-sm space-y-6">
        {pessoas.map((p) => {
          const planejado = Number(p.aporte_mensal) || 0;
          const val = valores[p.id] ?? 0;
          const diff = val - planejado;
          return (
            <div key={p.id}>
              <label className="text-sm text-muted-foreground block mb-2">{p.nome}</label>
              <MoneyInput
                variant="money"
                min={0}
                value={val}
                onChange={(v) => setValores((prev) => ({ ...prev, [p.id]: v === "" ? 0 : v }))}
                className={`h-12 w-full text-right text-lg rounded-xl ${diff !== 0 ? "border-accent text-accent bg-accent/5" : "bg-background"}`}
              />
              <p className={`text-xs mt-1.5 text-right ${diff !== 0 ? (diff > 0 ? "text-success font-medium" : "text-destructive font-medium") : "text-muted-foreground"}`}>
                planejado: {brl(planejado)}
                {diff !== 0 && ` (${diff > 0 ? "+" : ""}${brl(diff)})`}
              </p>
            </div>
          );
        })}

        <div className="pt-4 border-t border-border/40 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total do mês</span>
          <span className="text-xl font-medium">{brl(total)}</span>
        </div>
      </div>

      <Button className="w-full h-14 rounded-2xl text-base shadow-glow-sm" onClick={confirmar} disabled={saving}>
        {saving ? "Salvando..." : `Confirmar aporte de ${linhaMes ? mesLabel(linhaMes.dataReferencia).split(" ")[0] : ""}`}
        {!saving && <ArrowRight className="w-5 h-5 ml-2" />}
      </Button>

      {calculating && (
        <p className="text-xs text-center text-muted-foreground animate-pulse mt-4">Recalculando a previsão da meta...</p>
      )}

      {metaDepois && !calculating && (
        <div className={`rounded-2xl p-4 text-sm text-center font-medium mt-4 ${metaDepois.mesmoMes ? "bg-success/10 text-success border border-success/20" : "bg-warning/10 text-warning border border-warning/20"}`}>
          {metaDepois.mesmoMes
            ? "Sem impacto na data prevista da meta."
            : `Meta ajustada! Nova previsão: ${new Date(metaDepois.data).toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" })}.`}
        </div>
      )}
    </div>
  );
}

function mesLabel(iso: string) {
  const d = new Date(iso);
  const s = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function LancarAportePage() {
  return (
    <Suspense fallback={
      <div className="max-w-screen-sm mx-auto px-4 py-10 text-center text-muted-foreground flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin"></div>
        <p>Carregando...</p>
      </div>
    }>
      <LancarAporteContent />
    </Suspense>
  );
}
