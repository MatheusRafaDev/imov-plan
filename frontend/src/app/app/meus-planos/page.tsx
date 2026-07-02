"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Plus,
  Loader2,
  FolderOpen,
  ArrowRight,
  Home,
  Calendar,
  Trash2,
  Target,
} from "lucide-react";
import { brl } from "@/lib/finance";

interface Planejamento {
  id: string;
  nomeProjeto?: string;
  valorImovel?: number;
  prazoMaxMeses?: number;
  status?: string;
  updatedAt?: string;
  createdAt?: string;
}

export default function MeusPlanejamentosPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [planejamentos, setPlanejamentos] = useState<Planejamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadPlanejamentos();
  }, [user]);

  const loadPlanejamentos = async () => {
    setLoading(true);
    try {
      const res = await api.get("/planejamento");
      setPlanejamentos(res.data || []);
    } catch {
      toast.error("Erro ao carregar planejamentos.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja remover este planejamento permanentemente?")) return;
    setDeletingId(id);
    try {
      await api.delete(`/planejamento/${id}`);
      setPlanejamentos((prev) => prev.filter((p) => p.id !== id));
      toast.success("Planejamento removido.");
    } catch {
      toast.error("Erro ao remover planejamento.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpen = (id: string) => {
    // Em produção: setar o planejamento ativo no contexto e navegar para o fluxo
    router.push(`/app/resultado`);
    toast.info("Abrindo planejamento...");
  };

  const handleNew = () => {
    router.push("/app/imovel");
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "concluído":
      case "concluded":
        return "text-green-500 bg-green-500/10 border-green-500/20";
      case "draft":
        return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      default:
        return "text-accent bg-accent/10 border-accent/20";
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "concluded":
        return "Concluído";
      case "draft":
        return "Rascunho";
      default:
        return status ?? "Em andamento";
    }
  };

  if (loading) {
    return (
      <div className="grid place-items-center py-24">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <span className="text-sm text-muted-foreground">Carregando seus planejamentos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl md:text-4xl">Meus Planejamentos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie todos os seus planos de aquisição de imóvel.
          </p>
        </div>
        <Button id="btn-novo-planejamento" onClick={handleNew} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          Novo Plano
        </Button>
      </div>

      {/* Lista */}
      {planejamentos.length === 0 ? (
        <Card className="p-16 text-center border-dashed border-border/50 shadow-soft">
          <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
          <h2 className="font-display text-2xl mb-2">Nenhum planejamento ainda</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Crie seu primeiro plano de compra de imóvel e comece a poupar com inteligência.
          </p>
          <Button onClick={handleNew} size="lg">
            <Plus className="h-4 w-4 mr-2" />
            Criar primeiro plano
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {planejamentos.map((plan) => (
            <Card
              key={plan.id}
              className="p-6 shadow-soft border-border/60 hover:border-accent/40 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="h-12 w-12 rounded-xl bg-accent/10 border border-accent/20 grid place-items-center shrink-0">
                    <Home className="h-5 w-5 text-accent" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-display text-lg truncate">
                        {plan.nomeProjeto || "Planejamento sem nome"}
                      </h2>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getStatusColor(plan.status)}`}
                      >
                        {getStatusLabel(plan.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                      {plan.valorImovel ? (
                        <span className="flex items-center gap-1">
                          <Target className="h-3.5 w-3.5" />
                          {brl(plan.valorImovel)}
                        </span>
                      ) : null}
                      {plan.prazoMaxMeses ? (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {plan.prazoMaxMeses} meses
                        </span>
                      ) : null}
                      {plan.updatedAt && (
                        <span className="text-xs">
                          Atualizado em {new Date(plan.updatedAt).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    disabled={deletingId === plan.id}
                    onClick={() => handleDelete(plan.id)}
                  >
                    {deletingId === plan.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    id={`btn-abrir-plano-${plan.id}`}
                    size="sm"
                    onClick={() => handleOpen(plan.id)}
                    className="group-hover:bg-accent group-hover:text-accent-foreground transition-colors"
                  >
                    Abrir
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
