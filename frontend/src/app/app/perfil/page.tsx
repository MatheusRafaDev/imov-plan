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
  Trash2,
  KeyRound,
  Eye,
  EyeOff,
  ChevronDown,
  ShieldCheck
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
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin-smooth" />
          <span>Carregando perfil...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up pb-12">
      {/* Cabeçalho que respeita a identidade mas é compacto */}
      <div className="flex items-center gap-6">
        <div className="h-20 w-20 rounded-2xl bg-gradient-warm shadow-glow flex items-center justify-center shrink-0">
          <span className="font-display text-2xl font-bold text-white shadow-sm">
            {getInitials(name || "U")}
          </span>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-accent font-medium mb-1 flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" /> Meu Perfil
          </p>
          <h1 className="font-display text-3xl font-medium text-foreground">{name || "Usuário"}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{email}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 items-start">
        {/* Lado Esquerdo - Informações Básicas */}
        <Card className="p-6 border-border/60 shadow-soft">
          <h2 className="text-lg font-display text-foreground mb-4">Informações Pessoais</h2>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="profile-name" className="text-xs text-muted-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> Nome completo
              </Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                className="h-10 text-sm bg-secondary/10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profile-email" className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Endereço de email
              </Label>
              <Input
                id="profile-email"
                value={email}
                disabled
                className="h-10 text-sm bg-muted/40 cursor-not-allowed opacity-80"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profile-nascimento" className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> Data de nascimento
              </Label>
              <div className="border border-border/60 rounded-md overflow-hidden bg-secondary/10 focus-within:border-accent focus-within:ring-1 focus-within:ring-accent transition-all">
                <DateInput
                  id="profile-nascimento"
                  value={dataNascimento}
                  onChange={(v) => setDataNascimento(v)}
                />
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving || !name}
              className="w-full bg-gradient-warm text-accent-foreground mt-2 shadow-sm hover:opacity-95"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin-smooth mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {saving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </Card>

        {/* Lado Direito - Segurança */}
        <div className="space-y-6">
          <Card className="border-border/60 shadow-soft overflow-hidden">
            <button
              onClick={() => setShowPasswordCard(p => !p)}
              className="w-full flex items-center justify-between p-6 hover:bg-secondary/20 transition-colors"
            >
              <span className="flex items-center gap-2 text-base font-display text-foreground">
                <KeyRound className="h-4 w-4 text-accent" />
                Segurança e Senha
              </span>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                  showPasswordCard ? "rotate-180" : ""
                }`}
              />
            </button>

            {showPasswordCard && (
              <div className="px-6 pb-6 space-y-4 border-t border-border/20 pt-4 bg-secondary/5">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Senha atual</Label>
                  <div className="relative">
                    <Input
                      type={showSenhaAtual ? "text" : "password"}
                      value={senhaAtual}
                      onChange={e => setSenhaAtual(e.target.value)}
                      className="h-10 text-sm pr-10 bg-background/50"
                    />
                    <button type="button" onClick={() => setShowSenhaAtual(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showSenhaAtual ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Nova senha</Label>
                  <div className="relative">
                    <Input
                      type={showNovaSenha ? "text" : "password"}
                      value={novaSenha}
                      onChange={e => setNovaSenha(e.target.value)}
                      className="h-10 text-sm pr-10 bg-background/50"
                    />
                    <button type="button" onClick={() => setShowNovaSenha(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showNovaSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Confirmar nova senha</Label>
                  <div className="relative">
                    <Input
                      type={showConfirmSenha ? "text" : "password"}
                      value={confirmSenha}
                      onChange={e => setConfirmSenha(e.target.value)}
                      className={`h-10 text-sm pr-10 bg-background/50 ${
                        confirmSenha && confirmSenha !== novaSenha ? "border-destructive/60" : ""
                      }`}
                    />
                    <button type="button" onClick={() => setShowConfirmSenha(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showConfirmSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  size="sm"
                  className="w-full mt-2 bg-foreground text-background hover:bg-foreground/90"
                  onClick={handleChangePassword}
                  disabled={savingPassword || !senhaAtual || !novaSenha || !confirmSenha}
                >
                  {savingPassword ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Atualizar Senha"}
                </Button>
              </div>
            )}
          </Card>

          <Card className="border-destructive/20 bg-destructive/5 p-6 shadow-sm flex flex-col justify-between">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-destructive flex items-center gap-2 mb-1">
                <Trash2 className="h-4 w-4" /> Zona de Risco
              </h3>
              <p className="text-xs text-destructive/80">
                A exclusão da conta é permanente e apagará todos os seus planejamentos salvos no ImovPlan.
              </p>
            </div>
            <Button 
              variant="destructive" 
              className="w-full shadow-sm"
              onClick={() => setShowDeleteModal(true)}
            >
              Excluir Minha Conta
            </Button>
          </Card>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6 space-y-4 shadow-lg border-destructive/20 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-display text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Excluir Conta
            </h3>
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja apagar sua conta? Esta ação não pode ser desfeita e todos os seus planos serão excluídos.
            </p>
            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
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
              >
                {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Excluir Conta
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
