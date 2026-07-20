"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Building2, Loader2, MailCheck, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const { forgotPassword, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);

    if (!email) {
      setEmailError("Informe seu email.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Insira um endereço de email válido.");
      return;
    }

    const result = await forgotPassword(email);
    // Por segurança, sempre mostramos a mesma mensagem de sucesso,
    // exista ou não uma conta com esse email (evita expor quais emails estão cadastrados).
    if (result.success) {
      setEnviado(true);
    } else {
      setEmailError(result.error || "Não foi possível processar o pedido. Tente novamente.");
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background animate-fade-in">
      <div className="p-4 sm:p-8 lg:p-12 flex flex-col justify-center max-w-md mx-auto w-full">
        <Link href="/" className="flex items-center gap-2 mb-8 w-fit transition-transform hover:scale-105">
          <div className="h-8 w-8 rounded-lg bg-gradient-warm grid place-items-center shadow-glow">
            <Building2 className="h-4 w-4 text-accent-foreground" />
          </div>
          <span className="font-display text-xl font-semibold">Imov<span className="text-accent">.</span>Plan</span>
        </Link>

        <Card className="p-8 shadow-soft border-border/60 backdrop-blur-sm bg-card/95">
          {enviado ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-accent/10 grid place-items-center">
                <MailCheck className="h-6 w-6 text-accent" />
              </div>
              <h2 className="font-display text-2xl">Verifique seu email</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Se houver uma conta cadastrada com <strong>{email}</strong>, enviamos um link para
                redefinir sua senha. Confira sua caixa de entrada (e o spam).
              </p>
              <Link href="/auth" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mt-2">
                <ArrowLeft className="h-4 w-4" /> Voltar para o login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="font-display text-2xl mb-2">Esqueci minha senha</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Informe o email da sua conta e enviaremos um link para você redefinir a senha.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError(null);
                    }}
                    disabled={loading}
                    placeholder="voce@exemplo.com"
                    className={`transition-all ${emailError ? "border-destructive focus-visible:ring-destructive/30" : ""}`}
                  />
                  {emailError && (
                    <p className="text-xs text-destructive flex items-center gap-1.5 mt-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {emailError}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full mt-2 bg-gradient-warm text-accent-foreground hover:opacity-95 shadow-glow" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin-smooth" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar link de recuperação"
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                <Link href="/auth" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-medium">
                  <ArrowLeft className="h-4 w-4" /> Voltar para o login
                </Link>
              </div>
            </>
          )}
        </Card>
      </div>
      <div className="hidden lg:flex flex-col justify-center items-center p-12 bg-gradient-ink text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2075&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay" />
        <div className="relative z-10 max-w-md text-center space-y-4">
          <h2 className="font-display text-4xl leading-tight font-semibold">Acontece com todo mundo.</h2>
          <p className="text-primary-foreground/70 text-base">Em poucos passos você volta a acessar seu planejamento com segurança.</p>
        </div>
      </div>
    </div>
  );
}
