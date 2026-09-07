"use client";

import { useState } from "react";
import { Calendar, Check, Pencil, RefreshCw, Save, ShieldCheck, TrendingUp, X } from "lucide-react";
import { usePlanLogic } from "@/hooks/usePlanLogic";
import { MoneyInput } from "@/components/MoneyInput";
import { DateInput } from "@/components/DateInput";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { brl } from "@/lib/finance";
import { toLocalDateIso } from "@/utils/dates";

export function StatusAtualInvestimento() {
  const { pessoas, salvarPlano, calcularBackend } = usePlanLogic();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [value, setValue] = useState<number | "">(0);
  const [date, setDate] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  if (!pessoas.length) return null;

  const startEditing = (pessoa: typeof pessoas[number]) => {
    setEditingId(pessoa.id);
    setValue(pessoa.valorAtual ?? pessoa.valorInicial ?? 0);
    setDate(pessoa.dataValorAtual ?? toLocalDateIso(new Date()) ?? "");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setValue(0);
    setDate("");
  };

  const saveCheckpoint = async (pessoaId: string) => {
    if (!date || value === "" || Number(value) < 0) return;

    const updatedPeople = pessoas.map((pessoa) =>
      pessoa.id === pessoaId
        ? { ...pessoa, valorAtual: Number(value), dataValorAtual: date }
        : pessoa
    );

    setSavingId(pessoaId);
    try {
      const savedId = await salvarPlano({ pessoas: updatedPeople });
      if (savedId) await calcularBackend(savedId);
      setEditingId(null);
      toast.success("Saldo atualizado e projeção recalculada.");
    } catch {
      toast.error("Não foi possível salvar o saldo atual. Tente novamente.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Card className="overflow-hidden border-border/50 shadow-soft">
      <div className="bg-gradient-ink text-primary-foreground p-5 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-primary-foreground/70">
              <ShieldCheck className="h-4 w-4 text-accent" /> Controle real
            </div>
            <h2 className="font-display text-2xl font-medium mt-2">Status do investimento</h2>
            <p className="text-sm text-primary-foreground/70 mt-1 max-w-2xl">
              Atualize cada conta com o saldo real. A projeção será recalculada automaticamente a partir desse marco.
            </p>
          </div>
          <TrendingUp className="h-7 w-7 text-accent shrink-0" />
        </div>
      </div>
      <div className="p-5 md:p-6">
      <div className="flex items-center justify-between gap-2 mb-4">
        <p className="text-xs text-muted-foreground">Uma conta por vez, sem alterar os demais participantes.</p>
        <span className="text-xs font-medium text-muted-foreground">{pessoas.length} conta{pessoas.length === 1 ? "" : "s"}</span>
      </div>
      <div className="space-y-3">
        {pessoas.map((pessoa) => {
          const hasCheckpoint = pessoa.valorAtual != null && pessoa.dataValorAtual;
          const editing = editingId === pessoa.id;
          const saving = savingId === pessoa.id;

          return (
            <div key={pessoa.id} className={`border rounded-xl p-4 transition-colors ${hasCheckpoint ? "border-accent/30 bg-accent/5" : "border-border/60 bg-secondary/20"}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{pessoa.nome}</p>
                  {hasCheckpoint ? (
                    <p className="text-xs text-accent flex items-center gap-1 mt-1">
                      <Check className="h-3 w-3" /> Projeção ajustada a partir de {pessoa.dataValorAtual}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">Usando o saldo inicial planejado</p>
                  )}
                </div>
                {!editing && (
                  <Button variant="outline" size="sm" onClick={() => startEditing(pessoa)} className="shrink-0 gap-1.5">
                    <Pencil className="h-3.5 w-3.5" />
                    {hasCheckpoint ? "Editar" : "Informar saldo"}
                  </Button>
                )}
              </div>

              {hasCheckpoint && !editing && (
                <p className="text-sm mt-3">Saldo real: <strong>{brl(Number(pessoa.valorAtual))}</strong></p>
              )}

              {editing && (
                <div className="grid sm:grid-cols-2 gap-3 mt-4">
                  <div>
                    <label className="text-xs text-muted-foreground flex items-center gap-1 mb-1.5">
                      Valor atual <span aria-hidden="true">*</span>
                    </label>
                    <MoneyInput variant="money" min={0} value={value} onChange={setValue} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground flex items-center gap-1 mb-1.5">
                      <Calendar className="h-3.5 w-3.5" /> Data do saldo <span aria-hidden="true">*</span>
                    </label>
                    <DateInput value={date} onChange={setDate} />
                  </div>
                  <div className="sm:col-span-2 flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={cancelEditing} disabled={saving}>
                      <X className="h-4 w-4 mr-1" /> Cancelar
                    </Button>
                    <Button size="sm" onClick={() => saveCheckpoint(pessoa.id)} disabled={saving || value === "" || !date} className="gap-1.5">
                      {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Salvar e recalcular
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      </div>
    </Card>
  );
}
