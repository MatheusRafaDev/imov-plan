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
  ShieldCheck,
  MailCheck,
  ArrowRight,
} from "lucide-react";

export default function PerfilPage() {
  const { user, updateUser, deleteAccount, forgotPassword } = useAuth();
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Redefinicao de senha via email
  const [sendingResetEmail, setSendingResetEmail] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

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

  // Envia o mesmo link de recuperacao que o "Esqueci minha senha"
  const handleSendResetLink = async () => {
    if (!email) return;
    setSendingResetEmail(true);
    try {
      const result = await forgotPassword(email);
      if (result.success) {
        setResetEmailSent(true);
        toast.success("Link de redefinicao enviado! Verifique seu e-mail.");
      } else if (result.provider === "google") {
        toast.error("Esta conta usa autenticacao pelo Google. Nao e possivel definir senha aqui.");
      } else {
        toast.error(result.error || "Nao foi possivel enviar o e-mail. Tente novamente.");
      }
    } finally {
      setSendingResetEmail(false);
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
      {/* Cabecalho */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
        <div className="h-20 w-20 rounded-2xl bg-gradient-warm shadow-glow flex items-center justify-center shrink-0">
          <span className="font-display text-2xl font-bold text-white shadow-sm">
            {getInitials(name || "U")}
          </span>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-accent font-medium mb-1 flex items-center justify-center sm:justify-start gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" /> Meu Perfil
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-medium text-foreground">{name || "Usuario"}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{email}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 items-start">
        {/* Lado Esquerdo - Informacoes Basicas */}
        <Card className="p-6 border-border/60 shadow-soft">
          <h2 className="text-lg font-display text-foreground mb-4">Informacoes Pessoais</h2>

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
                <Mail className="h-3.5 w-3.5" /> Endereco de email
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
              {saving ? "Salvando..." : "Salvar Alteracoes"}
            </Button>
          </div>
        </Card>

        {/* Lado Direito */}
        <div className="space-y-6">
          {/* Card de Seguranca e Senha — fluxo via email */}
          <Card className="p-6 border-border/60 shadow-soft space-y-4">
            <h2 className="text-base font-display text-foreground flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-accent" /> Seguranca e Senha
            </h2>

            {resetEmailSent ? (
              /* Estado de sucesso — mesmo padrao da tela forgot-password */
              <div className="space-y-3 text-center animate-fade-in py-2">
                <div className="mx-auto h-12 w-12 rounded-full bg-accent/10 grid place-items-center">
                  <MailCheck className="h-6 w-6 text-accent" />
                </div>
                <p className="text-sm font-medium">Verifique seu e-mail</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Enviamos um link de redefinicao para <strong>{email}</strong>. Confira sua caixa
                  de entrada (e a pasta de spam). O link e valido por <strong>30 minutos</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => setResetEmailSent(false)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4 mt-1"
                >
                  Reenviar link
                </button>
              </div>
            ) : (
              /* Estado inicial — instrucao + botao */
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Para sua seguranca, enviaremos um link por e-mail para voce redefinir sua senha.
                  O processo e identico ao <strong>&quot;Esqueci minha senha&quot;</strong> — sem
                  precisar informar a senha atual.
                </p>

                <div className="rounded-lg bg-accent/5 border border-accent/20 p-3 text-xs text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground text-xs">Como funciona:</p>
                  <ol className="list-decimal list-inside space-y-0.5 pl-1">
                    <li>Clique no botao abaixo</li>
                    <li>Acesse o link enviado para <span className="text-foreground font-medium">{email}</span></li>
                    <li>Escolha uma nova senha com pelo menos 8 caracteres</li>
                  </ol>
                </div>

                <Button
                  id="perfil-enviar-link-senha"
                  className="w-full bg-gradient-warm text-accent-foreground hover:opacity-95 shadow-glow"
                  onClick={handleSendResetLink}
                  disabled={sendingResetEmail}
                >
                  {sendingResetEmail ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin-smooth" />Enviando...</>
                  ) : (
                    <><Mail className="h-4 w-4 mr-2" />Enviar link de redefinicao<ArrowRight className="h-4 w-4 ml-2" /></>
                  )}
                </Button>
              </div>
            )}
          </Card>

          {/* Zona de Risco */}
          <Card className="border-destructive/20 bg-destructive/5 p-6 shadow-sm flex flex-col justify-between">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-destructive flex items-center gap-2 mb-1">
                <Trash2 className="h-4 w-4" /> Zona de Risco
              </h3>
              <p className="text-xs text-destructive/80">
                A exclusao da conta e permanente e apagara todos os seus planejamentos salvos no ImovPlan.
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

      {/* Modal de exclusao */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6 space-y-4 shadow-lg border-destructive/20 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-display text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Excluir Conta
            </h3>
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja apagar sua conta? Esta acao nao pode ser desfeita e todos os seus planos serao excluidos.
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
