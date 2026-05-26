"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UsuarioService } from "@/services/UsuarioService";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MoneyInput } from "@/components/MoneyInput";
import { toast } from "sonner";
import { Briefcase, Wallet, Heart, ArrowRight, Loader2, Award } from "lucide-react";

export default function OnboardingPage() {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    rendaMensal: user?.rendaMensal ?? 0,
    saldoFgts: user?.saldoFgts ?? 0,
    regimeTrabalho: user?.regimeTrabalho ?? "CLT",
    estadoCivil: user?.estadoCivil ?? "Solteiro(a)",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Você precisa estar logado para completar esta etapa.");
      router.push("/auth");
      return;
    }

    setLoading(true);
    try {
      const updatedUser = await UsuarioService.updateProfile(user.id, {
        rendaMensal: form.rendaMensal,
        saldoFgts: form.saldoFgts,
        regimeTrabalho: form.regimeTrabalho,
        estadoCivil: form.estadoCivil,
      });

      // Update AuthContext state
      updateUser(updatedUser);

      toast.success("Perfil financeiro configurado com sucesso!");
      router.push("/app/objetivo");
    } catch (error: any) {
      console.error(error);
      toast.error("Ocorreu um erro ao salvar suas informações. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 animate-fade-in">
      <div className="text-center mb-8">
        <div className="inline-flex h-12 w-12 rounded-2xl bg-gradient-warm items-center justify-center shadow-glow mb-4">
          <Award className="h-6 w-6 text-accent-foreground" />
        </div>
        <h1 className="font-display text-3xl font-semibold mb-2">Seja bem-vindo, {user?.name || "planejador"}!</h1>
        <p className="text-muted-foreground max-w-md mx-auto text-sm">
          Para te entregar o melhor plano de financiamento e entrada do seu imóvel, precisamos configurar seu perfil financeiro inicial.
        </p>
      </div>

      <Card className="p-6 md:p-8 shadow-soft border-border/60 backdrop-blur-sm bg-card/95">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Renda Mensal */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Wallet className="h-4 w-4 text-accent" />
              Sua renda mensal (Salário principal)
            </Label>
            <MoneyInput
              variant="money"
              min={0}
              value={form.rendaMensal}
              onChange={(val) => setForm({ ...form, rendaMensal: val })}
              placeholder="Ex: R$ 5.000"
              className="h-12 text-lg font-display num"
            />
            <p className="text-xs text-muted-foreground">
              Sua renda bruta é a base que os bancos usam para calcular o valor máximo da sua parcela de financiamento.
            </p>
          </div>

          {/* Saldo FGTS */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-accent" />
              Saldo disponível no FGTS (Opcional)
            </Label>
            <MoneyInput
              variant="money"
              min={0}
              value={form.saldoFgts}
              onChange={(val) => setForm({ ...form, saldoFgts: val })}
              placeholder="Ex: R$ 15.000"
              className="h-12 text-lg font-display num"
            />
            <p className="text-xs text-muted-foreground">
              Você pode usar seu saldo do FGTS como parte do valor da entrada do seu imóvel.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Regime de Trabalho */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-accent" />
                Regime de trabalho
              </Label>
              <select
                className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={form.regimeTrabalho}
                onChange={(e) => setForm({ ...form, regimeTrabalho: e.target.value })}
              >
                <option value="CLT">CLT (Carteira assinada)</option>
                <option value="PJ">PJ / Empresário</option>
                <option value="Autônomo">Autônomo / Profissional Liberal</option>
                <option value="Servidor Público">Servidor Público</option>
                <option value="Aposentado/Pensionista">Aposentado / Pensionista</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            {/* Estado Civil */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Heart className="h-4 w-4 text-accent" />
                Estado civil
              </Label>
              <select
                className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={form.estadoCivil}
                onChange={(e) => setForm({ ...form, estadoCivil: e.target.value })}
              >
                <option value="Solteiro(a)">Solteiro(a)</option>
                <option value="Casado(a)">Casado(a)</option>
                <option value="União Estável">União Estável</option>
                <option value="Divorciado(a)">Divorciado(a)</option>
                <option value="Viúvo(a)">Viúvo(a)</option>
              </select>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-gradient-warm text-accent-foreground hover:opacity-95 shadow-glow"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin-smooth" />
                Salvando seu perfil...
              </>
            ) : (
              <>
                Concluir meu perfil e iniciar simulação
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>

        </form>
      </Card>
    </div>
  );
}
