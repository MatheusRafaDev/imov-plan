"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { UsuarioService, UpdateProfilePayload } from "@/services/UsuarioService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  User,
  Mail,
  Calendar,
  Save,
  Loader2,
  CheckCircle2,
  Clock,
  Briefcase,
  DollarSign,
  Heart,
  PiggyBank
} from "lucide-react";

export default function PerfilPage() {
  const { user, updateUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [rendaMensal, setRendaMensal] = useState<number | "">("");
  const [saldoFgts, setSaldoFgts] = useState<number | "">("");
  const [estadoCivil, setEstadoCivil] = useState("");
  const [regimeTrabalho, setRegimeTrabalho] = useState("");

  useEffect(() => {
    if (!user) return;

    async function loadProfile() {
      try {
        const profile = await UsuarioService.getProfile(user!.id);
        setName(profile.name || "");
        setEmail(profile.email || "");
        setDataNascimento(profile.dataNascimento || "");
        setRendaMensal(profile.rendaMensal || "");
        setSaldoFgts(profile.saldoFgts || "");
        setEstadoCivil(profile.estadoCivil || "");
        setRegimeTrabalho(profile.regimeTrabalho || "");
      } catch {
        // Fallback to context data if API fails
        setName(user!.name || "");
        setEmail(user!.email || "");
        setDataNascimento(user!.dataNascimento || "");
        setRendaMensal(user!.rendaMensal || "");
        setSaldoFgts(user!.saldoFgts || "");
        setEstadoCivil(user!.estadoCivil || "");
        setRegimeTrabalho(user!.regimeTrabalho || "");
      } finally {
        setLoadingProfile(false);
      }
    }

    loadProfile();
  }, [user]);

  const getInitials = (n: string) => {
    return n
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const payload: UpdateProfilePayload = {
        name: name || undefined,
        dataNascimento: dataNascimento || undefined,
        rendaMensal: rendaMensal !== "" ? Number(rendaMensal) : undefined,
        saldoFgts: saldoFgts !== "" ? Number(saldoFgts) : undefined,
        estadoCivil: estadoCivil || undefined,
        regimeTrabalho: regimeTrabalho || undefined,
      };

      const updated = await UsuarioService.updateProfile(user.id, payload);
      updateUser(updated);
      toast.success("Perfil atualizado com sucesso!");
    } catch {
      toast.error("Erro ao salvar perfil. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const completedFields = [name, email, dataNascimento, rendaMensal, saldoFgts, estadoCivil, regimeTrabalho].filter(Boolean).length;
  const totalFields = 7;
  const completionPercent = Math.round((completedFields / totalFields) * 100);

  if (loadingProfile) {
    return (
      <div className="grid place-items-center py-24">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin-smooth text-accent" />
          <span className="text-sm text-muted-foreground">Carregando perfil...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl md:text-4xl">Meu Perfil</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie suas informações pessoais.
        </p>
      </div>

      {/* Profile Card */}
      <Card className="p-0 overflow-hidden shadow-soft border-border/60">
        {/* Banner */}
        <div className="h-28 bg-gradient-warm relative">
          <div className="absolute -bottom-10 left-8">
            <div className="h-20 w-20 rounded-2xl bg-background border-4 border-background shadow-elevated grid place-items-center">
              <span className="font-display text-2xl font-semibold text-accent">
                {getInitials(name || "U")}
              </span>
            </div>
          </div>
        </div>
        <div className="pt-14 pb-6 px-8">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-display text-2xl">{name || "Usuário"}</h2>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <Mail className="h-3.5 w-3.5" /> {email}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Membro desde {new Date().getFullYear()}
            </div>
          </div>
          {/* Completion Bar */}
          <div className="mt-5 p-4 rounded-xl bg-secondary/50 border border-border/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                Perfil {completionPercent}% completo
              </span>
              <span className="text-xs text-muted-foreground">
                {completedFields}/{totalFields} campos
              </span>
            </div>
            <div className="h-2 rounded-full bg-border/60 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-warm transition-all duration-700 ease-out"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Form */}
      <Card className="p-8 shadow-soft border-border/60 space-y-6">
        <h3 className="font-display text-xl">Informações Pessoais</h3>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="profile-name" className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-muted-foreground" /> Nome completo
            </Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome completo"
            />
          </div>

          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="profile-email" className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email
            </Label>
            <Input
              id="profile-email"
              value={email}
              disabled
              className="opacity-60 cursor-not-allowed"
            />
          </div>

          {/* Data de Nascimento */}
          <div className="space-y-2">
            <Label htmlFor="profile-nascimento" className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> Data de nascimento
            </Label>
            <Input
              id="profile-nascimento"
              type="date"
              value={dataNascimento}
              onChange={(e) => setDataNascimento(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card className="p-8 shadow-soft border-border/60 space-y-6">
        <h3 className="font-display text-xl">Informações Financeiras e Perfil</h3>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Renda Mensal */}
          <div className="space-y-2">
            <Label htmlFor="profile-renda" className="flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-muted-foreground" /> Renda Mensal (R$)
            </Label>
            <Input
              id="profile-renda"
              type="number"
              value={rendaMensal}
              onChange={(e) => setRendaMensal(e.target.value ? Number(e.target.value) : "")}
              placeholder="Ex: 5000"
            />
          </div>

          {/* Saldo FGTS */}
          <div className="space-y-2">
            <Label htmlFor="profile-fgts" className="flex items-center gap-1.5">
              <PiggyBank className="h-3.5 w-3.5 text-muted-foreground" /> Saldo FGTS (R$)
            </Label>
            <Input
              id="profile-fgts"
              type="number"
              value={saldoFgts}
              onChange={(e) => setSaldoFgts(e.target.value ? Number(e.target.value) : "")}
              placeholder="Ex: 10000"
            />
          </div>

          {/* Estado Civil */}
          <div className="space-y-2">
            <Label htmlFor="profile-estado-civil" className="flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5 text-muted-foreground" /> Estado Civil
            </Label>
            <select
              id="profile-estado-civil"
              className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={estadoCivil}
              onChange={(e) => setEstadoCivil(e.target.value)}
            >
              <option value="">Selecione...</option>
              <option value="Solteiro">Solteiro(a)</option>
              <option value="Casado">Casado(a)</option>
              <option value="Divorciado">Divorciado(a)</option>
              <option value="Viúvo">Viúvo(a)</option>
            </select>
          </div>

          {/* Regime de Trabalho */}
          <div className="space-y-2">
            <Label htmlFor="profile-regime" className="flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-muted-foreground" /> Regime de Trabalho
            </Label>
            <select
              id="profile-regime"
              className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={regimeTrabalho}
              onChange={(e) => setRegimeTrabalho(e.target.value)}
            >
              <option value="">Selecione...</option>
              <option value="CLT">CLT</option>
              <option value="Autonomo">Autônomo/PJ</option>
              <option value="Funcionario_Publico">Funcionário Público</option>
              <option value="Empresario">Empresário</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-warm text-accent-foreground hover:opacity-90 shadow-glow h-11 px-8"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin-smooth" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar alterações
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
