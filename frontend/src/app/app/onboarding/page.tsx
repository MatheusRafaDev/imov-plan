"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UsuarioService } from "@/services/UsuarioService";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MoneyInput } from "@/components/MoneyInput";
import { Loader2, Award, Wallet, Briefcase, Heart, Building2, Key, HardHat } from "lucide-react";
import Cookies from "js-cookie";

type Cenario = "entrada" | "pronto" | "planta";

const cenarios = [
  {
    id: "entrada" as Cenario,
    icon: Wallet,
    title: "Quero juntar a entrada",
    desc: "Ainda não comprei. Quero planejar quanto guardar por mês para ter a entrada do meu imóvel.",
    color: "from-violet-500/10 to-violet-600/5 border-violet-500/30",
    activeColor: "from-violet-500/20 to-violet-600/10 border-violet-500 ring-2 ring-violet-500/30",
    iconColor: "text-violet-400",
  },
  {
    id: "pronto" as Cenario,
    icon: Key,
    title: "Já comprei / vou comprar pronto",
    desc: "Imóvel pronto para morar. Quero simular e acompanhar as parcelas do financiamento bancário (SAC / PRICE).",
    color: "from-emerald-500/10 to-emerald-600/5 border-emerald-500/30",
    activeColor: "from-emerald-500/20 to-emerald-600/10 border-emerald-500 ring-2 ring-emerald-500/30",
    iconColor: "text-emerald-400",
  },
  {
    id: "planta" as Cenario,
    icon: HardHat,
    title: "Comprei na planta",
    desc: "Assine ou já assinou contrato de imóvel na planta. Monte o fluxo de pagamentos: sinal, obras, chaves, financiamento.",
    color: "from-amber-500/10 to-amber-600/5 border-amber-500/30",
    activeColor: "from-amber-500/20 to-amber-600/10 border-amber-500 ring-2 ring-amber-500/30",
    iconColor: "text-amber-400",
  },
];

export default function OnboardingPage() {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"financeiro" | "cenario">("financeiro");
  const [cenarioSelecionado, setCenarioSelecionado] = useState<Cenario>("entrada");

  const [form, setForm] = useState({
    rendaMensal: user?.rendaMensal ?? ("" as number | ""),
    saldoFgts: user?.saldoFgts ?? ("" as number | ""),
    regimeTrabalho: user?.regimeTrabalho ?? "CLT",
    estadoCivil: user?.estadoCivil ?? "Solteiro(a)",
  });

  const handleFinanceiro = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("cenario");
  };

  const handleSubmit = async () => {
    if (!user) { router.push("/auth"); return; }
    setLoading(true);
    try {
      const updatedUser = await UsuarioService.updateProfile(user.id, {
        rendaMensal: Number(form.rendaMensal) || 0,
        saldoFgts: Number(form.saldoFgts) || 0,
        regimeTrabalho: form.regimeTrabalho,
        estadoCivil: form.estadoCivil,
      });
      updateUser(updatedUser);
      // Save scenario to cookie so PlanContext picks it up
      Cookies.set("imovplan_cenario", cenarioSelecionado, { expires: 30 });

      // Route to scenario-specific first step
      if (cenarioSelecionado === "pronto") router.push("/app/pronto");
      else if (cenarioSelecionado === "planta") router.push("/app/planta");
      else router.push("/app/objetivo");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const selectStyle = "flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="min-h-screen bg-gradient-cream flex items-center justify-center p-4">
      <div className="max-w-2xl w-full animate-fade-in-up">
   
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-warm items-center justify-center shadow-glow mb-4">
            <Award className="h-7 w-7 text-accent-foreground" />
          </div>
          <h1 className="font-display text-3xl font-semibold mb-2">
            Bem-vindo, {user?.name?.split(" ")[0] || "planejador"}!
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            {step === "financeiro"
              ? "Vamos configurar seu perfil financeiro para personalizar seu planejamento."
              : "Agora me conta: qual é a sua situação com o imóvel?"}
          </p>
        </div>

        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className={`h-2 rounded-full transition-all duration-300 ${step === "financeiro" ? "w-8 bg-accent" : "w-3 bg-accent/50"}`} />
          <div className={`h-2 rounded-full transition-all duration-300 ${step === "cenario" ? "w-8 bg-accent" : "w-3 bg-border"}`} />
        </div>

        {/* Step 1: Financeiro */}
        {step === "financeiro" && (
          <Card className="p-6 md:p-8 shadow-soft border-border/60">
            <form onSubmit={handleFinanceiro} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-accent" /> Renda mensal bruta
                </Label>
                <MoneyInput
                  variant="money" min={0}
                  value={form.rendaMensal}
                  onChange={(v) => setForm({ ...form, rendaMensal: v })}
                  placeholder="Ex: R$ 5.000"
                  className="h-12 text-lg font-display num"
                />
                <p className="text-xs text-muted-foreground">
                  Usada pelos bancos para calcular o valor máximo da parcela de financiamento.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-accent" /> Saldo do FGTS (Opcional)
                </Label>
                <MoneyInput
                  variant="money" min={0}
                  value={form.saldoFgts}
                  onChange={(v) => setForm({ ...form, saldoFgts: v })}
                  placeholder="Ex: R$ 15.000"
                  className="h-12 text-lg font-display num"
                />
                <p className="text-xs text-muted-foreground">
                  Pode ser usado como parte do valor da entrada do imóvel.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-accent" /> Regime de trabalho
                  </Label>
                  <select className={selectStyle} value={form.regimeTrabalho} onChange={(e) => setForm({ ...form, regimeTrabalho: e.target.value })}>
                    <option value="CLT">CLT (Carteira assinada)</option>
                    <option value="PJ">PJ / Empresário</option>
                    <option value="Autônomo">Autônomo / Profissional Liberal</option>
                    <option value="Servidor Público">Servidor Público</option>
                    <option value="Aposentado/Pensionista">Aposentado / Pensionista</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Heart className="h-4 w-4 text-accent" /> Estado civil
                  </Label>
                  <select className={selectStyle} value={form.estadoCivil} onChange={(e) => setForm({ ...form, estadoCivil: e.target.value })}>
                    <option value="Solteiro(a)">Solteiro(a)</option>
                    <option value="Casado(a)">Casado(a)</option>
                    <option value="União Estável">União Estável</option>
                    <option value="Divorciado(a)">Divorciado(a)</option>
                    <option value="Viúvo(a)">Viúvo(a)</option>
                  </select>
                </div>
              </div>

              <Button type="submit" className="w-full h-12 bg-gradient-warm text-accent-foreground hover:opacity-95 shadow-glow">
                Próximo
              </Button>
            </form>
          </Card>
        )}

        {/* Step 2: Cenario */}
        {step === "cenario" && (
          <div className="space-y-4">
            {cenarios.map((c) => {
              const isActive = cenarioSelecionado === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setCenarioSelecionado(c.id)}
                  className={`w-full text-left p-5 rounded-2xl border bg-gradient-to-br transition-all duration-200 ${isActive ? c.activeColor : c.color} hover:scale-[1.01]`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`mt-0.5 p-2 rounded-xl bg-background/60 ${c.iconColor}`}>
                      <c.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-base mb-1">{c.title}</p>
                      <p className="text-sm text-muted-foreground">{c.desc}</p>
                    </div>
                    <div className={`ml-auto mt-1 h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isActive ? "border-accent bg-accent" : "border-border"}`}>
                      {isActive && <div className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                  </div>
                </button>
              );
            })}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="h-12 px-6" onClick={() => setStep("financeiro")}>
                Voltar
              </Button>
              <Button
                className="flex-1 h-12 bg-gradient-warm text-accent-foreground hover:opacity-95 shadow-glow"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
                ) : (
                  "Iniciar meu planejamento →"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
