"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

// ── Indicador de Força da Senha ────────────────────────────────────────────────
function PasswordStrengthIndicator({ password }: { password: string }) {
  const checks = [
    { label: "Mínimo 8 caracteres", ok: password.length >= 8 },
    { label: "Pelo menos uma letra", ok: /[a-zA-ZÀ-ÿ]/.test(password) },
    { label: "Pelo menos um número", ok: /[0-9]/.test(password) },
  ];

  const passed = checks.filter((c) => c.ok).length;
  const strengthColor =
    passed === 0
      ? ""
      : passed === 1
      ? "bg-destructive"
      : passed === 2
      ? "bg-yellow-500"
      : "bg-green-500";

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1.5 animate-fade-in">
      <div className="flex gap-1 h-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`flex-1 rounded-full transition-all duration-300 ${
              i < passed ? strengthColor : "bg-border"
            }`}
          />
        ))}
      </div>
      <ul className="space-y-0.5">
        {checks.map((c) => (
          <li
            key={c.label}
            className={`flex items-center gap-1.5 text-xs transition-colors ${
              c.ok ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
            }`}
          >
            {c.ok ? (
              <CheckCircle2 className="h-3 w-3 shrink-0" />
            ) : (
              <XCircle className="h-3 w-3 shrink-0" />
            )}
            {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Formulário de Redefinição ──────────────────────────────────────────────────
function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { validateResetToken, resetPassword, loading } = useAuth();

  const token = searchParams.get("token") || "";

  type TokenState = "validating" | "valid" | "invalid";
  const [tokenState, setTokenState] = useState<TokenState>("validating");
  const [tokenError, setTokenError] = useState<string>("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  // Valida o token assim que a página carrega
  useEffect(() => {
    if (!token) {
      setTimeout(() => {
        setTokenState("invalid");
        setTokenError("Link de recuperação inválido. Verifique o link recebido por email.");
      }, 0);
      return;
    }

    let cancelled = false;
    (async () => {
      const result = await validateResetToken(token);
      if (cancelled) return;
      if (result.valid) {
        setTokenState("valid");
      } else {
        setTokenState("invalid");
        setTokenError(result.error || "Link de recuperação inválido ou expirado.");
      }
    })();

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!newPassword) {
      errors.newPassword = "A nova senha é obrigatória.";
    } else if (newPassword.length < 8) {
      errors.newPassword = "A senha deve ter pelo menos 8 caracteres.";
    } else if (!/[a-zA-ZÀ-ÿ]/.test(newPassword)) {
      errors.newPassword = "A senha deve conter pelo menos uma letra.";
    } else if (!/[0-9]/.test(newPassword)) {
      errors.newPassword = "A senha deve conter pelo menos um número.";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Confirme a nova senha.";
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = "As senhas não coincidem.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setGeneralError(null);

    if (!validateForm()) return;

    const result = await resetPassword(token, newPassword);
    if (result.success) {
      setSucesso(true);
      toast.success("Senha redefinida com sucesso!");
      setTimeout(() => router.push("/auth"), 2500);
    } else {
      setGeneralError(result.error || "Não foi possível redefinir a senha. Tente novamente.");
    }
  };

  // ── Estados de renderização ─────────────────────────────────────────────────

  if (tokenState === "validating") {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <Loader2 className="h-8 w-8 animate-spin-smooth text-accent" />
        <p className="text-sm text-muted-foreground">Verificando link de recuperação...</p>
      </div>
    );
  }

  if (tokenState === "invalid") {
    return (
      <div className="space-y-4 text-center animate-fade-in">
        <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 grid place-items-center">
          <XCircle className="h-6 w-6 text-destructive" />
        </div>
        <h2 className="font-display text-2xl">Link inválido</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{tokenError}</p>
        <Link
          href="/auth/forgot-password"
          className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-md bg-gradient-warm text-accent-foreground font-medium text-sm shadow-glow hover:opacity-95 transition-opacity"
        >
          Solicitar novo link
        </Link>
        <Link
          href="/auth"
          className="inline-flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para o login
        </Link>
      </div>
    );
  }

  if (sucesso) {
    return (
      <div className="space-y-4 text-center animate-fade-in">
        <div className="mx-auto h-12 w-12 rounded-full bg-green-500/10 grid place-items-center">
          <ShieldCheck className="h-6 w-6 text-green-500" />
        </div>
        <h2 className="font-display text-2xl">Senha redefinida!</h2>
        <p className="text-sm text-muted-foreground">
          Sua senha foi alterada com sucesso. Redirecionando para o login...
        </p>
        <Loader2 className="h-5 w-5 animate-spin-smooth mx-auto text-muted-foreground" />
      </div>
    );
  }

  // ── Formulário de nova senha ────────────────────────────────────────────────
  return (
    <>
      <h2 className="font-display text-2xl mb-2">Redefinir senha</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Escolha uma nova senha segura para a sua conta.
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
        {/* Nova Senha */}
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
              placeholder="Mínimo 8 caracteres"
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
          <PasswordStrengthIndicator password={newPassword} />
          {formErrors.newPassword && (
            <p className="text-xs text-destructive flex items-center gap-1.5 mt-1">
              <AlertCircle className="h-3.5 w-3.5" /> {formErrors.newPassword}
            </p>
          )}
        </div>

        {/* Confirmar Senha */}
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (formErrors.confirmPassword)
                  setFormErrors((p) => ({ ...p, confirmPassword: "" }));
              }}
              disabled={loading}
              placeholder="Repita a nova senha"
              className={`pr-10 ${
                formErrors.confirmPassword ? "border-destructive focus-visible:ring-destructive/30" : ""
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {confirmPassword && newPassword && confirmPassword === newPassword && (
            <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1.5 mt-1 animate-fade-in">
              <CheckCircle2 className="h-3.5 w-3.5" /> As senhas coincidem
            </p>
          )}
          {formErrors.confirmPassword && (
            <p className="text-xs text-destructive flex items-center gap-1.5 mt-1">
              <AlertCircle className="h-3.5 w-3.5" /> {formErrors.confirmPassword}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full mt-2 bg-gradient-warm text-accent-foreground hover:opacity-95 shadow-glow"
          disabled={loading}
        >
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
        <Link
          href="/auth"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-medium"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para o login
        </Link>
      </div>
    </>
  );
}

// ── Página ─────────────────────────────────────────────────────────────────────
export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background animate-fade-in">
      <div className="p-4 sm:p-8 lg:p-12 flex flex-col justify-center max-w-md mx-auto w-full">
        <Link href="/" className="flex items-center gap-2 mb-8 w-fit transition-transform hover:scale-105">
          <div className="h-8 w-8 rounded-lg bg-gradient-warm grid place-items-center shadow-glow">
            <Building2 className="h-4 w-4 text-accent-foreground" />
          </div>
          <span className="font-display text-xl font-semibold">
            Imov<span className="text-accent">.</span>Plan
          </span>
        </Link>

        <Card className="p-8 shadow-soft border-border/60 backdrop-blur-sm bg-card/95">
          <Suspense
            fallback={
              <div className="flex flex-col items-center gap-4 py-6">
                <Loader2 className="h-8 w-8 animate-spin-smooth text-accent" />
                <p className="text-sm text-muted-foreground">Carregando...</p>
              </div>
            }
          >
            <ResetPasswordForm />
          </Suspense>
        </Card>
      </div>
      <div className="hidden lg:flex flex-col justify-center items-center p-12 bg-gradient-ink text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2075&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay" />
        <div className="relative z-10 max-w-md text-center space-y-4">
          <h2 className="font-display text-4xl leading-tight font-semibold">Quase lá.</h2>
          <p className="text-primary-foreground/70 text-base">
            Escolha uma nova senha para voltar a acessar seu planejamento.
          </p>
        </div>
      </div>
    </div>
  );
}
