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
  KeyRound,
  Eye,
  EyeOff,
  ChevronDown
} from "lucide-react";

export default function PerfilPage() {
  const { user, updateUser, deleteAccount } = useAuth();
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Alterar senha
  const [showPasswordCard, setShowPasswordCard] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmSenha, setConfirmSenha] = useState("");
  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmSenha, setShowConfirmSenha] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

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

  const handleChangePassword = async () => {
    if (!user) return;
    if (novaSenha !== confirmSenha) {
      toast.error("As senhas não coincidem.");
      return;
    }
    if (novaSenha.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setSavingPassword(true);
    try {
      await UsuarioService.changePassword(user.id, senhaAtual, novaSenha);
      toast.success("Senha alterada com sucesso!");
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmSenha("");
      setShowPasswordCard(false);
    } catch {
      toast.error("Senha atual incorreta ou erro ao alterar. Tente novamente.");
    } finally {
      setSavingPassword(false);
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

          {/* Alterar Senha */}
          <Card className="border border-border/50 bg-card shadow-sm rounded-2xl overflow-hidden">
            <button
              id="btn-alterar-senha-toggle"
              onClick={() => setShowPasswordCard(p => !p)}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/30 transition-colors"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <KeyRound className="h-4 w-4 text-accent" />
                Alterar Senha
              </span>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                  showPasswordCard ? "rotate-180" : ""
                }`}
              />
            </button>

            {showPasswordCard && (
              <div className="px-5 pb-5 space-y-3 border-t border-border/40 pt-4">
                {/* Senha atual */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Senha atual</label>
                  <div className="relative">
                    <Input
                      id="senha-atual"
                      type={showSenhaAtual ? "text" : "password"}
                      value={senhaAtual}
                      onChange={e => setSenhaAtual(e.target.value)}
                      placeholder="••••••••"
                      className="h-10 rounded-xl border border-border/70 bg-background pr-10 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSenhaAtual(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showSenhaAtual ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Nova senha */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nova senha</label>
                  <div className="relative">
                    <Input
                      id="nova-senha"
                      type={showNovaSenha ? "text" : "password"}
                      value={novaSenha}
                      onChange={e => setNovaSenha(e.target.value)}
                      placeholder="••••••••"
                      className="h-10 rounded-xl border border-border/70 bg-background pr-10 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNovaSenha(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showNovaSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirmar nova senha */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Confirmar nova senha</label>
                  <div className="relative">
                    <Input
                      id="confirmar-senha"
                      type={showConfirmSenha ? "text" : "password"}
                      value={confirmSenha}
                      onChange={e => setConfirmSenha(e.target.value)}
                      placeholder="••••••••"
                      className={`h-10 rounded-xl border bg-background pr-10 text-sm ${
                        confirmSenha && confirmSenha !== novaSenha
                          ? "border-destructive/60 focus:ring-destructive/20"
                          : "border-border/70"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmSenha(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmSenha && confirmSenha !== novaSenha && (
                    <p className="text-xs text-destructive">As senhas não coincidem.</p>
                  )}
                </div>

                <Button
                  id="btn-salvar-senha"
                  size="sm"
                  className="w-full text-xs rounded-xl mt-1"
                  onClick={handleChangePassword}
                  disabled={savingPassword || !senhaAtual || !novaSenha || !confirmSenha}
                >
                  {savingPassword ? (
                    <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                  ) : (
                    <KeyRound className="h-3.5 w-3.5 mr-2" />
                  )}
                  {savingPassword ? "Salvando..." : "Salvar Nova Senha"}
                </Button>
              </div>
            )}
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
              onClick={() => setShowDeleteModal(true)}
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

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6 bg-card space-y-4 rounded-2xl shadow-xl border border-destructive/20 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-semibold text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Excluir Conta
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Tem certeza que deseja apagar sua conta permanentemente? Esta ação <strong className="text-foreground font-medium">não poderá ser desfeita</strong> e todos os seus dados serão perdidos.
            </p>
            <div className="flex justify-end gap-3 mt-6 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="rounded-xl h-10 px-4 text-xs font-medium"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                disabled={deleting}
                onClick={async () => {
                  setDeleting(true);
                  try {
                    await deleteAccount();
                  } finally {
                    setDeleting(false);
                    setShowDeleteModal(false);
                  }
                }}
                className="rounded-xl h-10 px-4 text-xs font-medium"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                {deleting ? "Excluindo..." : "Excluir Conta"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
