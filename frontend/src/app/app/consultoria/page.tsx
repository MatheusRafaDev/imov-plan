"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePlanContext } from "@/context/PlanContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Building, Loader2, Bot, ChevronLeft, ArrowRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ConsultoriaService } from "@/services/ConsultoriaService";

export default function ConsultoriaPage() {
  const { pessoas, objetivo } = usePlanContext();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);

  const requestAI = async () => {
    setLoading(true);
    setReport(null);
    try {
      const data = await ConsultoriaService.analisar({
        pessoas: pessoas.map(p => ({
          nome: p.nome,
          renda_mensal: p.renda_mensal,
          renda_complementar: p.renda_complementar,
          gastos_totais_calculados: p.gastos_mensais,
          usa_gastos_detalhados: p.usar_gastos_detalhados
        })),
        renda_total_bruta: pessoas.reduce((acc, p) => acc + Number(p.renda_mensal) + Number(p.renda_complementar || 0), 0),
        imovel: objetivo
      });
      if (data.text) {
        setReport(data.text);
      } else {
        setReport("Houve um erro ao processar sua análise. Tente novamente mais tarde.");
      }
    } catch (err) {
      setReport("Falha de conexão com a IA. Verifique sua rede e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <p className="text-xs uppercase tracking-widest text-accent font-medium mb-2">Etapa 3 de 4</p>
        <h1 className="font-display text-4xl md:text-5xl mb-2 flex items-center gap-3">
          Consultor Inteligente <Sparkles className="h-8 w-8 text-accent" />
        </h1>
        <p className="text-muted-foreground">Deixe nossa IA analisar seus dados e te dizer em qual banco e faixa de subsídio você se enquadra.</p>
      </div>

      {!report && !loading && (
        <Card className="p-8 md:p-12 text-center flex flex-col items-center justify-center space-y-6 shadow-soft border-dashed bg-secondary/30">
          <div className="h-16 w-16 rounded-2xl bg-gradient-warm grid place-items-center shadow-glow mb-2">
            <Bot className="h-8 w-8 text-accent-foreground" />
          </div>
          <h2 className="font-display text-2xl">Pronto para a sua avaliação?</h2>
          <p className="text-muted-foreground max-w-md">
            Vamos usar as regras oficiais do <strong>Minha Casa Minha Vida 2024</strong> e as taxas do mercado para traçar a melhor estratégia de financiamento imobiliário para o seu perfil.
          </p>
          <div className="flex flex-wrap gap-4 pt-4 justify-center">
            <Button variant="outline" onClick={() => router.push("/app/pessoas")}>
              <ChevronLeft className="mr-2 h-4 w-4" /> Voltar aos dados
            </Button>
            <Button size="lg" className="bg-gradient-ink text-primary-foreground shadow-elevated" onClick={requestAI}>
              <Sparkles className="mr-2 h-4 w-4 text-accent" /> Iniciar Análise IA
            </Button>
          </div>
        </Card>
      )}

      {loading && (
        <Card className="p-12 text-center flex flex-col items-center justify-center space-y-6 shadow-soft bg-secondary/10">
          <Loader2 className="h-12 w-12 text-accent animate-spin-smooth" />
          <h3 className="font-display text-xl animate-pulse">A IA está cruzando seus dados com as tabelas bancárias...</h3>
          <p className="text-sm text-muted-foreground">Isso pode levar alguns segundos.</p>
        </Card>
      )}

      {report && (
        <div className="space-y-6 animate-fade-in-up">
          <Card className="p-8 shadow-elevated border-l-4 border-l-accent overflow-hidden relative">
            <div className="absolute -right-10 -top-10 opacity-5">
              <Building className="h-64 w-64" />
            </div>
            
            <div className="prose prose-sm md:prose-base dark:prose-invert prose-headings:font-display prose-a:text-accent prose-h3:text-accent prose-strong:font-semibold max-w-none relative z-10">
              <ReactMarkdown>{report}</ReactMarkdown>
            </div>
            
            <div className="mt-8 pt-6 border-t flex flex-wrap gap-4 items-center justify-between">
              <Button variant="ghost" onClick={requestAI} className="text-muted-foreground">
                <Sparkles className="mr-2 h-4 w-4" /> Gerar Novamente
              </Button>
              <Button size="lg" onClick={() => router.push("/app/bancos")} className="bg-gradient-warm text-accent-foreground hover:opacity-90 shadow-glow">
                Ir para Escolha do Banco <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
