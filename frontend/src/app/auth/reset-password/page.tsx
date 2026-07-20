"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Building2, Loader2, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { resetPassword, loading } = useAuth();

  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [token, setToken] = useState(searchParams.get("token") || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!email) errors.email = "O email é obrigatório.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Insira um endereço de email válido.";

    if (!token) errors.token = "Informe o código recebido por email.";

    if (!newPassword) errors.newPassword = "A nova senha é obrigatória.";
    else if (newPassword.length < 6) errors.newPassword = "A senha deve ter pelo menos 6 caracteres.";

    if (!confirmPassword) errors.confirmPassword = "Confirme a nova senha.";
    else if (newPassword !== confirmPassword) errors.confirmPassword = "As senhas não coincidem.";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setGeneralError(null);

    if (!validateForm()) {
      setGeneralError("Por favor, corrija os erros sinalizados no formulário.");
      return;
    }

    const result = await resetPassword(email, token, newPassword);
    if (result.success) {
      setSucesso(true);
      toast.success("Senha redefinida com sucesso!");
      setTimeout(() => router.push("/auth"), 2000);
    } else {
      setGeneralError(result.error || "Token inválido ou expirado. Solicite um novo link.");
    }
  };

  if (sucesso) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-accent/10 grid place-items-center">
          <CheckCircle2 className="h-6 w-6 text-accent" />
        </div>
        <h2 className="font-display text-2xl">Senha redefinida!</h2>
        <p className="text-sm text-muted-foreground">Redirecionando para o login...</p>
      </div>
    );
  }

  return (
    <>
      <h2 className="font-display text-2xl mb-2">Redefinir senha</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Informe o código recebido por email e escolha uma nova senha.
      </p>

      {generalError && (
        <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-3 animate-fade-in">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-destructive">Atenção</h4>
            <p className="text-destructive/95 mt-0.5 leading-relaxed">{generalError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (formErrors.email) setFormErrors((p) => ({ ...p, email: "" }));
            }}
            disabled={loading}
            placeholder="voce@exemplo.com"
            className={formErrors.email ? "border-destructive focus-visible:ring-destructive/30" : ""}
          />
          {formErrors.email && (
            <p className="text-xs text-destructive flex items-center gap-1.5 mt-1">
              <AlertCircle className="h-3.5 w-3.5" /> {formErrors.email}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="token">Código de recuperação</Label>
          <Input
            id="token"
            type="text"
            value={token}
            onChange={(e) => {
              setToken(e.target.value);
              if (formErrors.token) setFormErrors((p) => ({ ...p, token: "" }));
            }}
            disabled={loading}
            placeholder="Cole aqui o código recebido por email"
            className={formErrors.token ? "border-destructive focus-visible:ring-destructive/30" : ""}
          />
          {formErrors.token && (
            <p className="text-xs text-destructive flex items-center gap-1.5 mt-1">
              <AlertCircle className="h-3.5 w-3.5" /> {formErrors.token}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="newPassword">Nova senha</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (formErrors.newPassword) setFormErrors((p) => ({ ...p, newPassword: "" }));
              }}
              disabled={loading}
              placeholder="Mínimo 6 caracteres"
              className={`pr-10 ${formErrors.newPassword ? "border-destructive focus-visible:ring-destructive/30" : ""}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {formErrors.newPassword && (
            <p className="text-xs text-destructive flex items-center gap-1.5 mt-1">
              <AlertCircle className="h-3.5 w-3.5" /> {formErrors.newPassword}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
          <Input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (formErrors.confirmPassword) setFormErrors((p) => ({ ...p, confirmPassword: "" }));
            }}
            disabled={loading}
            placeholder="Repita a nova senha"
            className={formErrors.confirmPassword ? "border-destructive focus-visible:ring-destructive/30" : ""}
          />
          {formErrors.confirmPassword && (
            <p className="text-xs text-destructive flex items-center gap-1.5 mt-1">
              <AlertCircle className="h-3.5 w-3.5" /> {formErrors.confirmPassword}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full mt-2 bg-gradient-warm text-accent-foreground hover:opacity-95 shadow-glow" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin-smooth" /> Aguarde...
            </>
          ) : (
            <>
              Redefinir senha <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm">
        <Link href="/auth" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-medium">
          <ArrowLeft className="h-4 w-4" /> Voltar para o login
        </Link>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background animate-fade-in">
      <div className="p-8 lg:p-12 flex flex-col justify-center max-w-md mx-auto w-full">
        <Link href="/" className="flex items-center gap-2 mb-8 w-fit transition-transform hover:scale-105">
          <div className="h-8 w-8 rounded-lg bg-gradient-warm grid place-items-center shadow-glow">
            <Building2 className="h-4 w-4 text-accent-foreground" />
          </div>
          <span className="font-display text-xl font-semibold">Imov<span className="text-accent">.</span>Plan</span>
        </Link>

        <Card className="p-8 shadow-soft border-border/60 backdrop-blur-sm bg-card/95">
          <Suspense fallback={<Loader2 className="h-5 w-5 animate-spin-smooth mx-auto" />}>
            <ResetPasswordForm />
          </Suspense>
        </Card>
      </div>
      <div className="hidden lg:flex flex-col justify-center items-center p-12 bg-gradient-ink text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2075&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay" />
        <div className="relative z-10 max-w-md text-center space-y-4">
          <h2 className="font-display text-4xl leading-tight font-semibold">Quase lá.</h2>
          <p className="text-primary-foreground/70 text-base">Escolha uma nova senha para voltar a acessar seu planejamento.</p>
        </div>
      </div>
    </div>
  );
}
