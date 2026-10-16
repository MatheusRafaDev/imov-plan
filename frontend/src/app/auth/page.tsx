"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Eye, EyeOff, AlertCircle, Mail, Lock, User, Calendar } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function AuthPage() {
  const searchParams = useSearchParams();
  const [isLogin, setIsLogin] = useState(() => searchParams.get("modo") !== "cadastro");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [googleInitialized, setGoogleInitialized] = useState(false);
  const googleCredentialInFlight = useRef<string | null>(null);
  const { login, register, loginWithGoogle, loading, user, isAuthenticated } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && isAuthenticated() && user) {
      router.replace("/app/imovel");
    }
  }, [isAuthenticated, user, router, loading]);

  // Initialize Google Identity Services once
  useEffect(() => {
    if (typeof window === "undefined" || googleInitialized) return;

    const initGoogle = () => {
      const google = (window as any).google;
      if (google && process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
        google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          callback: async (response: any) => {
            if (response.credential && googleCredentialInFlight.current !== response.credential) {
              googleCredentialInFlight.current = response.credential;
              const result = await loginWithGoogle(response.credential);
              if (result.success) {
                toast.success("Login realizado com sucesso!");
                router.replace("/app/imovel");
              } else {
                setGeneralError(result.error || "Erro ao fazer login com Google");
              }
            }
          },
        });

        // Render the official Google button
        const buttonDiv = document.getElementById("google-signin-button");
        if (buttonDiv) {
          google.accounts.id.renderButton(buttonDiv, {
            theme: "outline",
            size: "large",
            type: "standard",
            text: "continue_with",
            shape: "pill",
            logo_alignment: "left",
            width: 340,
          });
        }

        setTimeout(() => {
          setGoogleInitialized(true);
        }, 0);
        return true;
      }
      return false;
    };

    if (!initGoogle()) {
      const intervalId = setInterval(() => {
        if (initGoogle()) {
          clearInterval(intervalId);
        }
      }, 200);
      return () => clearInterval(intervalId);
    }
  }, [googleInitialized, loginWithGoogle, router]);

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
      router.replace(isLogin ? "/app/imovel" : "/app/onboarding");
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

  const handleSwitchTab = (loginMode: boolean) => {
    setIsLogin(loginMode);
    setFormErrors({});
    setGeneralError(null);
    setPassword("");
    setConfirmPassword("");
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background animate-fade-in safe-top safe-bottom safe-x">
        <div className="flex flex-col items-center gap-4 text-center p-6">
          <Logo href="/" size="lg" className="animate-pulse-glow" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
            <Loader2 className="h-4 w-4 animate-spin-smooth text-accent" />
            <span>Carregando acesso seguro...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background animate-fade-in safe-top safe-bottom safe-x">
      <div className="p-4 sm:p-6 md:p-8 lg:p-12 flex flex-col justify-center max-w-md mx-auto w-full">
        <div className="flex items-center justify-between mb-6 sm:mb-8 animate-fade-in-up" style={{ animationDelay: "0ms" }}>
          <Logo href="/" size="md" />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            Início
          </Link>
        </div>

        <Card className="p-6 sm:p-8 shadow-soft border-border/60 backdrop-blur-sm bg-card/95 rounded-2xl sm:rounded-3xl animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          {/* Header */}
          <div key={isLogin ? "login-header" : "register-header"} className="animate-fade-in mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-display">
              {isLogin ? "Acesse sua conta" : "Crie sua conta"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1.5">
              {isLogin
                ? "Entre para acompanhar os cômodos, compras e orçamentos."
                : "Comece a planejar a conquista do seu imóvel próprio."}
            </p>
          </div>

          {/* Segmented Switcher (Tabs) */}
          <div className="flex bg-muted/70 p-1 rounded-2xl mb-6 border border-border/40">
            <button
              type="button"
              onClick={() => handleSwitchTab(true)}
              className={`flex-1 py-2 sm:py-2.5 text-xs sm:text-sm rounded-xl font-medium transition-all cursor-pointer ${
                isLogin
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => handleSwitchTab(false)}
              className={`flex-1 py-2 sm:py-2.5 text-xs sm:text-sm rounded-xl font-medium transition-all cursor-pointer ${
                !isLogin
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Criar conta
            </button>
          </div>

          {generalError && (
            <div className="mb-5 p-3 sm:p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm flex items-start gap-2.5 animate-fade-in">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-destructive text-xs sm:text-sm">Atenção</h4>
                <p className="text-destructive/95 mt-0.5 leading-relaxed text-xs sm:text-sm">{generalError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-4 animate-fade-in-up">
                {/* Nome */}
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs sm:text-sm font-medium">Nome completo</Label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70 pointer-events-none" />
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
                      placeholder="Seu nome completo"
                      className={`pl-10 h-11 sm:h-12 rounded-xl text-sm transition-all border-border/80 bg-background/50 focus:bg-background ${formErrors.name ? "border-destructive focus-visible:ring-destructive/30" : ""}`}
                    />
                  </div>
                  {formErrors.name && (
                    <p className="text-xs text-destructive flex items-center gap-1.5 mt-1">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      {formErrors.name}
                    </p>
                  )}
                </div>

                {/* Data de Nascimento */}
                <div className="space-y-1.5">
                  <Label htmlFor="dataNascimento" className="text-xs sm:text-sm font-medium">Data de Nascimento</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70 pointer-events-none" />
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
                      className={`pl-10 h-11 sm:h-12 rounded-xl text-sm transition-all border-border/80 bg-background/50 focus:bg-background ${formErrors.dataNascimento ? "border-destructive focus-visible:ring-destructive/30" : ""}`}
                    />
                  </div>
                  {formErrors.dataNascimento && (
                    <p className="text-xs text-destructive flex items-center gap-1.5 mt-1">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      {formErrors.dataNascimento}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs sm:text-sm font-medium">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70 pointer-events-none" />
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
                  className={`pl-10 h-11 sm:h-12 rounded-xl text-sm transition-all border-border/80 bg-background/50 focus:bg-background ${formErrors.email ? "border-destructive focus-visible:ring-destructive/30" : ""}`}
                />
              </div>
              {formErrors.email && (
                <p className="text-xs text-destructive flex items-center gap-1.5 mt-1">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {formErrors.email}
                </p>
              )}
            </div>

            {/* Senha */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs sm:text-sm font-medium">Senha</Label>
                {isLogin && (
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs sm:text-sm font-medium text-accent hover:underline transition-colors"
                  >
                    Esqueci minha senha
                  </Link>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70 pointer-events-none" />
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
                  className={`pl-10 pr-10 h-11 sm:h-12 rounded-xl text-sm transition-all border-border/80 bg-background/50 focus:bg-background ${formErrors.password ? "border-destructive focus-visible:ring-destructive/30" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {formErrors.password && (
                <p className="text-xs text-destructive flex items-center gap-1.5 mt-1">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {formErrors.password}
                </p>
              )}
            </div>

            {/* Confirmar Senha */}
            {!isLogin && (
              <div className="space-y-1.5 animate-fade-in-up">
                <Label htmlFor="confirmPassword" className="text-xs sm:text-sm font-medium">Confirmar Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70 pointer-events-none" />
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
                    className={`pl-10 pr-10 h-11 sm:h-12 rounded-xl text-sm transition-all border-border/80 bg-background/50 focus:bg-background ${formErrors.confirmPassword ? "border-destructive focus-visible:ring-destructive/30" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 cursor-pointer"
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? "Ocultar senha" : "Exibir senha"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {formErrors.confirmPassword && (
                  <p className="text-xs text-destructive flex items-center gap-1.5 mt-1">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {formErrors.confirmPassword}
                  </p>
                )}
              </div>
            )}

            {/* Primary Action Button */}
            <Button
              type="submit"
              className="w-full mt-2 h-11 sm:h-12 bg-gradient-warm text-accent-foreground hover:opacity-95 shadow-glow text-sm sm:text-base font-semibold rounded-xl cursor-pointer transition-all"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin-smooth" />
                  Aguarde...
                </>
              ) : (
                isLogin ? "Entrar na conta" : "Criar minha conta"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground font-medium">OU</span>
            </div>
          </div>

          {/* Google Sign-in */}
          <div className="w-full flex flex-col items-center">
            <div id="google-signin-button" className="w-full flex justify-center [&_iframe]:!w-full [&_iframe]:!max-w-none" />

            {!googleInitialized && (
              <button
                type="button"
                onClick={() => {
                  const googleBtn = document.querySelector('#google-signin-button div[role="button"]') as HTMLElement;
                  if (googleBtn) {
                    googleBtn.click();
                  } else if ((window as any).google?.accounts?.id) {
                    (window as any).google.accounts.id.prompt();
                  } else {
                    toast.info("Serviço Google indisponível no momento.");
                  }
                }}
                className="w-full h-11 sm:h-12 flex items-center justify-center gap-2.5 rounded-full border border-border/80 bg-card hover:bg-muted/40 font-medium text-xs sm:text-sm transition-colors text-foreground cursor-pointer shadow-xs"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continuar com Google</span>
              </button>
            )}

            {!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
              <div className="text-[11px] text-center text-muted-foreground/70 mt-2">
                Login com Google requer configuração do NEXT_PUBLIC_GOOGLE_CLIENT_ID
              </div>
            )}
          </div>

          {/* Bottom Footer Switcher */}
          <div className="mt-6 text-center text-xs sm:text-sm text-muted-foreground">
            {isLogin ? (
              <>
                Ainda não tem conta no ImovPlan?{" "}
                <button
                  type="button"
                  onClick={() => handleSwitchTab(false)}
                  className="font-semibold text-accent hover:underline cursor-pointer transition-colors"
                >
                  Cadastre-se gratuitamente
                </button>
              </>
            ) : (
              <>
                Já tem uma conta no ImovPlan?{" "}
                <button
                  type="button"
                  onClick={() => handleSwitchTab(true)}
                  className="font-semibold text-accent hover:underline cursor-pointer transition-colors"
                >
                  Acesse sua conta
                </button>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Right Column Showcase */}
      <div className="hidden lg:flex flex-col justify-center items-center p-8 lg:p-12 bg-gradient-ink text-primary-foreground relative overflow-hidden animate-fade-in">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2075&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay" />
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-md text-center space-y-4 animate-fade-in-up" style={{ animationDelay: "150ms" }}>
          <Logo variant="dark" size="lg" className="mx-auto mb-4" />
          <h2 className="font-display text-3xl sm:text-4xl leading-tight font-semibold">A chave do seu imóvel mais perto do que você imagina.</h2>
          <p className="text-primary-foreground/70 text-sm sm:text-base">O ImovPlan ajuda você a organizar a vida financeira para realizar o sonho do imóvel próprio, de forma simples e visual.</p>
        </div>
      </div>
    </div>
  );
}