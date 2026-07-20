"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowRight, Building2, Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";
import Link from "next/link";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const { login, register, loginWithGoogle, loading } = useAuth();
  const router = useRouter();

  // Fluxo com ID Token (JWT) via componente oficial <GoogleLogin>.
  // O backend (GoogleJsonWebSignature.ValidateAsync) espera um ID Token,
  // não um access_token — por isso usamos "credential", não "access_token".
  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    setGeneralError(null);

    if (!credentialResponse.credential) {
      setGeneralError("Não foi possível obter o token do Google. Tente novamente.");
      return;
    }

    const result = await loginWithGoogle(credentialResponse.credential);
    if (result.success) {
      toast.success("Login realizado com sucesso!");
      router.push("/app/imovel");
    } else {
      setGeneralError(result.error || "Erro ao tentar realizar a operação. Tente novamente.");
    }
  };

  const handleGoogleError = () => {
    setGeneralError("Erro ao autenticar com o Google. Tente novamente.");
  };

  // Validações locais ao submeter
  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!email) {
      errors.email = "O email é obrigatório.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Insira um endereço de email válido.";
    }

    if (!password) {
      errors.password = "A senha é obrigatória.";
    } else if (password.length < 6) {
      errors.password = "A senha deve ter pelo menos 6 caracteres.";
    }

    if (!isLogin) {
      if (!name.trim()) {
        errors.name = "O nome é obrigatório.";
      } else if (name.trim().length < 2) {
        errors.name = "O nome deve ter pelo menos 2 caracteres.";
      }

      if (!confirmPassword) {
        errors.confirmPassword = "A confirmação de senha é obrigatória.";
      } else if (password !== confirmPassword) {
        errors.confirmPassword = "As senhas não coincidem.";
      }

      if (!dataNascimento) {
        errors.dataNascimento = "A data de nascimento é obrigatória.";
      } else {
        const parsedDate = new Date(dataNascimento);
        const today = new Date();

        if (isNaN(parsedDate.getTime())) {
          errors.dataNascimento = "Formato de data inválido.";
        } else if (parsedDate > today) {
          errors.dataNascimento = "A data de nascimento não pode ser no futuro.";
        } else {
          // Cálculo de idade
          let age = today.getFullYear() - parsedDate.getFullYear();
          const monthDiff = today.getMonth() - parsedDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < parsedDate.getDate())) {
            age--;
          }

          if (age < 18) {
            errors.dataNascimento = "Você precisa ter pelo menos 18 anos.";
          } else if (age > 120) {
            errors.dataNascimento = "Insira uma data de nascimento válida.";
          }
        }
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setGeneralError(null);

    const isValid = validateForm();
    if (!isValid) {
      setGeneralError("Por favor, corrija os erros sinalizados no formulário.");
      return;
    }

    const result = isLogin
      ? await login(email, password)
      : await register(email, password, name, dataNascimento || undefined);

    if (result.success) {
      toast.success(isLogin ? "Bem-vindo de volta!" : "Conta criada com sucesso!");
      router.push(isLogin ? "/app/imovel" : "/app/onboarding");
    } else {
      const errorMsg = result.error || "";
      const newBackendErrors: { [key: string]: string } = {};
      let genError = "Erro ao tentar realizar a operação. Tente novamente.";

      if (errorMsg.includes("Email já cadastrado")) {
        newBackendErrors.email = "Este endereço de email já está em uso.";
        genError = "O email inserido já está cadastrado em outra conta.";
      } else if (errorMsg.includes("Email ou senha inválidos") || errorMsg.includes("inválidos") || errorMsg.includes("Unauthorized")) {
        newBackendErrors.email = "Verifique o email digitado.";
        newBackendErrors.password = "Verifique a senha digitada.";
        genError = "Email ou senha incorretos. Por favor, tente novamente.";
      } else if (errorMsg.includes("18 anos")) {
        newBackendErrors.dataNascimento = "Você precisa ter pelo menos 18 anos.";
        genError = "Apenas maiores de 18 anos podem se cadastrar.";
      } else if (errorMsg.includes("futuro")) {
        newBackendErrors.dataNascimento = "A data não pode ser no futuro.";
        genError = "A data de nascimento informada não pode ser no futuro.";
      } else if (errorMsg.includes("Network Error") || errorMsg.toLowerCase().includes("failed to fetch") || errorMsg.toLowerCase().includes("conn")) {
        genError = "Erro de conexão: Não foi possível estabelecer comunicação com o servidor. Verifique se o servidor backend está rodando.";
      } else {
        genError = errorMsg || "Erro de servidor. Por favor, tente novamente mais tarde.";
      }

      setFormErrors(newBackendErrors);
      setGeneralError(genError);
    }
  };

  const handleToggleMode = () => {
    setIsLogin(!isLogin);
    setFormErrors({});
    setGeneralError(null);
    setPassword("");
    setConfirmPassword("");
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
          <h2 className="font-display text-2xl mb-2">{isLogin ? "Entrar" : "Criar conta"}</h2>
          <p className="text-sm text-muted-foreground mb-6">
            {isLogin ? "Acesse seu planejamento." : "Comece a planejar a entrada do seu imóvel."}
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

          {/* Botão oficial do Google — retorna um ID Token (JWT) em "credential",
              que é o formato que o backend (GoogleJsonWebSignature.ValidateAsync) espera. */}
          <div className="w-full mb-4 flex justify-center [&>div]:w-full">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              text="continue_with"
              locale="pt-BR"
              width="100%"
              shape="rectangular"
            />
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Ou continuar com email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                {/* Nome */}
                <div className="space-y-1.5">
                  <Label htmlFor="name">Seu nome</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (formErrors.name) setFormErrors(prev => ({ ...prev, name: "" }));
                      if (generalError) setGeneralError(null);
                    }}
                    disabled={loading}
                    placeholder="João Silva"
                    className={`transition-all ${formErrors.name ? "border-destructive focus-visible:ring-destructive/30" : ""}`}
                  />
                  {formErrors.name && (
                    <p className="text-xs text-destructive flex items-center gap-1.5 mt-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {formErrors.name}
                    </p>
                  )}
                </div>
                {/* Data de Nascimento */}
                <div className="space-y-1.5">
                  <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                  <Input
                    id="dataNascimento"
                    type="date"
                    value={dataNascimento}
                    onChange={(e) => {
                      setDataNascimento(e.target.value);
                      if (formErrors.dataNascimento) setFormErrors(prev => ({ ...prev, dataNascimento: "" }));
                      if (generalError) setGeneralError(null);
                    }}
                    disabled={loading}
                    className={`transition-all ${formErrors.dataNascimento ? "border-destructive focus-visible:ring-destructive/30" : ""}`}
                  />
                  {formErrors.dataNascimento && (
                    <p className="text-xs text-destructive flex items-center gap-1.5 mt-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {formErrors.dataNascimento}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (formErrors.email) setFormErrors(prev => ({ ...prev, email: "" }));
                  if (generalError) setGeneralError(null);
                }}
                disabled={loading}
                placeholder="voce@exemplo.com"
                className={`transition-all ${formErrors.email ? "border-destructive focus-visible:ring-destructive/30" : ""}`}
              />
              {formErrors.email && (
                <p className="text-xs text-destructive flex items-center gap-1.5 mt-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {formErrors.email}
                </p>
              )}
            </div>

            {/* Senha */}
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (formErrors.password) setFormErrors(prev => ({ ...prev, password: "" }));
                    if (generalError) setGeneralError(null);
                  }}
                  disabled={loading}
                  placeholder="Mínimo 6 caracteres"
                  className={`pr-10 transition-all ${formErrors.password ? "border-destructive focus-visible:ring-destructive/30" : ""}`}
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
              {formErrors.password && (
                <p className="text-xs text-destructive flex items-center gap-1.5 mt-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {formErrors.password}
                </p>
              )}
            </div>

            {/* Confirmar Senha */}
            {!isLogin && (
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (formErrors.confirmPassword) setFormErrors(prev => ({ ...prev, confirmPassword: "" }));
                      if (generalError) setGeneralError(null);
                    }}
                    disabled={loading}
                    placeholder="Repita sua senha"
                    className={`pr-10 transition-all ${formErrors.confirmPassword ? "border-destructive focus-visible:ring-destructive/30" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {formErrors.confirmPassword && (
                  <p className="text-xs text-destructive flex items-center gap-1.5 mt-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {formErrors.confirmPassword}
                  </p>
                )}
              </div>
            )}

            <Button type="submit" className="w-full mt-4 bg-gradient-warm text-accent-foreground hover:opacity-95 shadow-glow" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin-smooth" />
                  Aguarde...
                </>
              ) : (
                <>
                  {isLogin ? "Entrar" : "Criar conta"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
          {isLogin && (
            <div className="mt-4 text-center text-sm">
              <Link href="/auth/forgot-password" className="text-muted-foreground hover:text-foreground transition-colors">
                Esqueci minha senha
              </Link>
            </div>
          )}
          <div className="mt-6 text-center text-sm">
            <button type="button" onClick={handleToggleMode} className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              {isLogin ? "Não tem conta? Criar agora" : "Já tem conta? Entrar"}
            </button>
          </div>
        </Card>
      </div>
      <div className="hidden lg:flex flex-col justify-center items-center p-12 bg-gradient-ink text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2075&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay" />
        <div className="relative z-10 max-w-md text-center space-y-4">
          <h2 className="font-display text-4xl leading-tight font-semibold">A chave do seu imóvel mais perto do que você imagina.</h2>
          <p className="text-primary-foreground/70 text-base">O Imov.Plan ajuda você a organizar a vida financeira para realizar o sonho do imóvel próprio, de forma simples e visual.</p>
        </div>
      </div>
    </div>
  );
}