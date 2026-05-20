"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowRight, Building2, Loader2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, register, loading } = useAuth();
  const router = useRouter();

  // Validações
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordValid = password.length >= 6;
  const nameValid = isLogin || name.trim().length >= 2;
  const formValid = emailValid && passwordValid && nameValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValid) {
      if (!emailValid) toast.error("Insira um email válido.");
      else if (!passwordValid) toast.error("A senha deve ter pelo menos 6 caracteres.");
      else if (!nameValid) toast.error("O nome deve ter pelo menos 2 caracteres.");
      return;
    }

    const result = isLogin 
      ? await login(email, password)
      : await register(email, password, name);

    if (result.success) {
      toast.success(isLogin ? "Bem-vindo de volta!" : "Conta criada com sucesso!");
      router.push("/app/objetivo");
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="p-8 lg:p-12 flex flex-col justify-center max-w-md mx-auto w-full">
        <Link href="/" className="flex items-center gap-2 mb-12 w-fit">
          <div className="h-8 w-8 rounded-lg bg-gradient-warm grid place-items-center shadow-glow">
            <Building2 className="h-4 w-4 text-accent-foreground" />
          </div>
          <span className="font-display text-xl font-semibold">Imov<span className="text-accent">.</span>Plan</span>
        </Link>
        <Card className="p-8 shadow-soft border-border/60">
          <h2 className="font-display text-2xl mb-2">{isLogin ? "Entrar" : "Criar conta"}</h2>
          <p className="text-sm text-muted-foreground mb-6">
            {isLogin ? "Acesse seu planejamento." : "Comece a planejar a entrada do seu imóvel."}
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Seu nome</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  placeholder="João Silva"
                  className={name && !nameValid ? "input-error" : ""}
                />
                {name && !nameValid && (
                  <p className="text-xs text-destructive">Mínimo 2 caracteres.</p>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                placeholder="voce@exemplo.com"
                className={email && !emailValid ? "input-error" : ""}
              />
              {email && !emailValid && (
                <p className="text-xs text-destructive">Insira um email válido.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  placeholder="Mínimo 6 caracteres"
                  className={password && !passwordValid ? "input-error pr-10" : "pr-10"}
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
              {password && !passwordValid && (
                <p className="text-xs text-destructive">A senha deve ter pelo menos 6 caracteres.</p>
              )}
            </div>
            <Button type="submit" className="w-full mt-2" disabled={loading || !formValid}>
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
          <div className="mt-6 text-center text-sm">
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-muted-foreground hover:text-foreground transition-colors">
              {isLogin ? "Não tem conta? Criar agora" : "Já tem conta? Entrar"}
            </button>
          </div>
        </Card>
      </div>
      <div className="hidden lg:flex flex-col justify-center items-center p-12 bg-gradient-ink text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2075&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay" />
        <div className="relative z-10 max-w-md text-center">
          <h2 className="font-display text-4xl leading-tight mb-4">A chave do seu imóvel mais perto do que você imagina.</h2>
          <p className="text-primary-foreground/70">O Imov.Plan ajuda você a organizar a vida financeira para realizar o sonho do imóvel próprio, de forma simples e visual.</p>
        </div>
      </div>
    </div>
  );
}
