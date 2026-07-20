import { useState, useRef } from "react";
import { usePlanContext } from "@/context/PlanContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Bot, Building } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ConsultoriaService } from "@/services/ConsultoriaService";

export function ConsultoriaCard() {
  const { pessoas, objetivo } = usePlanContext();
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const buildPayload = () => ({
    pessoas: pessoas.map((p) => ({
      nome: p.nome,
      renda_mensal: p.renda_mensal,
      renda_complementar: p.renda_complementar,
      gastos_totais_calculados: p.gastos_mensais,
      usa_gastos_detalhados: p.usar_gastos_detalhados,
    })),
    renda_total_bruta: pessoas.reduce(
      (acc, p) => acc + Number(p.renda_mensal) + Number(p.renda_complementar || 0),
      0
    ),
    imovel: objetivo,
  });

  const requestAI = async () => {
    // Cancela stream anterior se ainda estiver ativo
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setReport(""); // inicia string vazia para o streaming aparecer progressivamente

    try {
      await ConsultoriaService.analisarStream(
        buildPayload(),
        (chunk) => setReport((prev) => (prev ?? "") + chunk),
        controller.signal
      );
    } catch (err: any) {
      if (err?.name === "AbortError") return; // usuário cancelou
      setReport("Falha de conexão com a IA. Verifique sua rede e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 w-full">
      {!report && !loading && (
        <Card className="p-5 md:p-8 text-center flex flex-col items-center justify-center space-y-4 shadow-soft border-dashed bg-secondary/30">
          <div className="h-12 w-12 rounded-xl bg-gradient-warm grid place-items-center shadow-glow mb-2">
            <Bot className="h-6 w-6 text-accent-foreground" />
          </div>
          <h3 className="font-display text-xl">Avaliação Inteligente do Plano</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Use nossa IA baseada no programa Minha Casa Minha Vida e regras de mercado para avaliar se seu plano atual é viável e qual o melhor caminho.
          </p>
          <Button onClick={requestAI} className="bg-gradient-ink text-primary-foreground shadow-elevated mt-2">
            <Sparkles className="mr-2 h-4 w-4 text-accent" /> Avaliar Plano com IA
          </Button>
        </Card>
      )}

      {loading && report === "" && (
        <Card className="p-5 md:p-8 text-center flex flex-col items-center justify-center space-y-4 shadow-soft bg-secondary/10">
          <Loader2 className="h-8 w-8 text-accent animate-spin-smooth" />
          <h3 className="font-display text-lg animate-pulse">Analisando seus dados financeiros...</h3>
          <p className="text-xs text-muted-foreground">O relatório aparecerá em instantes.</p>
        </Card>
      )}

      {/* Relatório aparece progressivamente enquanto o stream chega */}
      {report !== null && report !== "" && (
        <Card className="p-6 md:p-8 shadow-elevated border-l-4 border-l-accent overflow-hidden relative">
          <div className="absolute -right-10 -top-10 opacity-5 pointer-events-none">
            <Building className="h-48 w-48" />
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-accent/20 grid place-items-center">
              <Bot className="h-5 w-5 text-accent" />
            </div>
            <h3 className="font-display text-xl font-medium">Parecer do Consultor</h3>
          </div>

          <div className="prose prose-sm md:prose-base dark:prose-invert prose-headings:font-display prose-a:text-accent prose-h3:text-accent prose-strong:font-semibold max-w-none relative z-10">
            <ReactMarkdown>{report}</ReactMarkdown>
            {loading && (
              <span className="inline-block w-2 h-4 bg-accent ml-0.5 animate-pulse align-middle" />
            )}
          </div>

          {!loading && (
            <div className="mt-6 pt-6 border-t flex justify-end">
              <Button variant="outline" size="sm" onClick={requestAI}>
                <Sparkles className="mr-2 h-4 w-4 text-accent" /> Avaliar Novamente
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
