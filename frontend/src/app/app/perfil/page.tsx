"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { UsuarioService, UpdateProfilePayload } from "@/services/UsuarioService";
import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/DateInput";
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
  Trash2,
  Download,
  Shield
} from "lucide-react";

export default function PerfilPage() {
  const { user, updateUser, deleteAccount } = useAuth();
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");

  useEffect(() => {
    if (!user) return;

    async function loadProfile() {
      try {
        const profile = await UsuarioService.getProfile(user!.id);
        setName(profile.name || "");
        setEmail(profile.email || "");
        setDataNascimento(profile.dataNascimento || "");
      } catch {
        // Fallback to context data if API fails
        setName(user!.name || "");
        setEmail(user!.email || "");
        setDataNascimento(user!.dataNascimento || "");
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

  const completedFields = [name, email, dataNascimento].filter(Boolean).length;
  const totalFields = 3;
  const completionPercent = Math.round((completedFields / totalFields) * 100);

  const handleExportData = async () => {
    if (!user) return;
    setExportLoading(true);
    try {
      const response = await import("@/lib/api").then(m => m.default.get("/usuario/exportar", { responseType: "blob" }));
      const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `meus-dados-imovplan.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Seus dados foram exportados com sucesso!");
    } catch {
      toast.error("Erro ao exportar dados. Tente novamente.");
    } finally {
      setExportLoading(false);
    }
  };

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
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-light tracking-tight text-foreground">Meu Perfil</h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie suas informações e preferências.</p>
      </div>

      <div className="grid md:grid-cols-[1fr_2fr] gap-6 items-start">
        {/* Left Column - Card & Actions */}
        <div className="space-y-6">
          {/* Mini Profile Card */}
          <Card className="overflow-hidden border border-border/50 bg-card p-6 shadow-sm flex flex-col items-center text-center rounded-2xl">
            {/* Avatar */}
            <div className="h-20 w-20 rounded-2xl bg-gradient-warm shadow-md flex items-center justify-center mb-4">
              <span className="font-display text-2xl font-bold text-white">
                {getInitials(name || "U")}
              </span>
            </div>
            <h2 className="font-display text-xl font-semibold text-foreground truncate max-w-full">{name || "Usuário"}</h2>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1.5 truncate max-w-full">
              <Mail className="h-3 w-3 shrink-0" /> {email}
            </p>

            {/* Progress Bar */}
            <div className="w-full mt-6 space-y-2 border-t border-border/40 pt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">Perfil {completionPercent}% completo</span>
                <span className="text-muted-foreground">{completedFields}/{totalFields}</span>
              </div>
              <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-warm transition-all duration-700 ease-out"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>
          </Card>

          {/* LGPD & Account Management */}
          <Card className="border border-border/50 bg-card p-6 shadow-sm space-y-4 rounded-2xl">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Shield className="h-4 w-4 text-accent" />
                Privacidade & LGPD
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Baixe todos os seus dados pessoais e de simulação salvos em nossos servidores.
              </p>
            </div>
            
            <Button
              id="btn-exportar-dados"
              variant="outline"
              size="sm"
              className="w-full text-xs rounded-xl"
              onClick={handleExportData}
              disabled={exportLoading}
            >
              {exportLoading ? (
                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5 mr-2" />
              )}
              {exportLoading ? "Exportando..." : "Exportar Meus Dados (JSON)"}
            </Button>
          </Card>

          {/* Danger Zone */}
          <Card className="border border-destructive/20 bg-destructive/5 p-6 shadow-sm space-y-4 rounded-2xl">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-destructive flex items-center gap-2">
                Apagar Conta
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Excluir permanentemente seus dados do servidor. Esta ação não poderá ser desfeita.
              </p>
            </div>
            
            <Button 
              variant="destructive" 
              size="sm"
              className="w-full text-xs rounded-xl"
              onClick={async () => {
                if (confirm("Tem certeza que deseja apagar sua conta permanentemente?")) {
                  await deleteAccount();
                }
              }}
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Excluir Minha Conta
            </Button>
          </Card>
        </div>

        {/* Right Column - Form */}
        <Card className="border border-border/50 bg-card p-8 shadow-sm space-y-6 rounded-2xl">
          <div className="flex items-center justify-between border-b border-border/40 pb-4">
            <h3 className="font-display text-xl font-semibold text-foreground">Informações Pessoais</h3>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> Membro desde {new Date().getFullYear()}
            </span>
          </div>

          <div className="space-y-5">
            {/* Nome */}
            <div className="space-y-1.5">
              <Label htmlFor="profile-name" className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> Nome completo
              </Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome completo"
                className="h-11 rounded-xl border border-border/70 bg-background px-3 text-base text-foreground shadow-sm outline-none transition focus:border-primary/80 focus:ring-1 focus:ring-primary/20"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="profile-email" className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Email
              </Label>
              <Input
                id="profile-email"
                value={email}
                disabled
                className="h-11 rounded-xl border border-border/70 bg-muted/30 px-3 text-base text-muted-foreground cursor-not-allowed opacity-70"
              />
            </div>

            {/* Data de Nascimento */}
            <div className="space-y-1.5">
              <Label htmlFor="profile-nascimento" className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> Data de nascimento
              </Label>
              <DateInput
                id="profile-nascimento"
                value={dataNascimento}
                onChange={(v) => setDataNascimento(v)}
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t border-border/40">
            <Button
              onClick={handleSave}
              disabled={saving || !name}
              className="bg-primary text-primary-foreground h-11 px-6 rounded-xl font-medium shadow-sm transition hover:bg-primary/95 flex items-center gap-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin-smooth" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
