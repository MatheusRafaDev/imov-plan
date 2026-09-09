"use client";

import { useState } from "react";
import { Check, Pencil, RefreshCw, Save, X } from "lucide-react";
import { usePlanLogic } from "@/hooks/usePlanLogic";
import { MoneyInput } from "@/components/MoneyInput";
import { DateInput } from "@/components/DateInput";
import { Button } from "@/components/ui/button";
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
        ? { ...pessoa, valorAtual: Number(value), valorInicial: Number(value), dataValorAtual: date }
        : pessoa
    );

    setSavingId(pessoaId);
    try {
      const savedId = await salvarPlano({ pessoas: updatedPeople });
      if (savedId) await calcularBackend(savedId);
      setEditingId(null);
      toast.success("Saldo atualizado.");
    } catch {
      toast.error("Não foi possível salvar. Tente novamente.");
    } finally {
      setSavingId(null);
    }
  };

  // Se está editando alguém, mostra o form inline (modo expandido)
  const editingPessoa = pessoas.find(p => p.id === editingId);

  return (
    <div className="flex flex-col gap-1.5">
      {/* Linha principal: todos os participantes lado a lado */}
      {!editingId && (
        <div className={`flex items-stretch rounded-xl border border-border/40 bg-card overflow-hidden divide-x divide-border/40`}>
          {pessoas.map((pessoa) => {
            const hasCheckpoint = pessoa.valorAtual != null && pessoa.dataValorAtual;
            return (
              <button
                key={pessoa.id}
                onClick={() => startEditing(pessoa)}
                className="flex-1 flex items-center justify-between gap-2 px-4 py-2.5 hover:bg-secondary/30 transition-colors text-left group"
              >
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{pessoa.nome.split(" ")[0]}</p>
                  {hasCheckpoint ? (
                    <p className="text-sm font-semibold text-foreground mt-0.5">{brl(Number(pessoa.valorAtual))}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground/60 mt-0.5 italic">Não informado</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {hasCheckpoint && (
                    <Check className="h-3.5 w-3.5 text-accent" />
                  )}
                  <Pencil className="h-3 w-3 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Form de edição expandido abaixo */}
      {editingId && editingPessoa && (
        <div className="rounded-xl border border-accent/30 bg-accent/5 px-3 py-2.5 flex items-center gap-2">
          <span className="text-xs font-medium text-foreground shrink-0">{editingPessoa.nome.split(" ")[0]}</span>
          <span className="text-muted-foreground/40 text-xs">·</span>
          <MoneyInput variant="money" min={0} value={value} onChange={setValue} className="h-7 text-xs w-32" />
          <DateInput value={date} onChange={setDate} className="h-7 text-xs w-32" />
          <div className="flex items-center gap-1 ml-auto shrink-0">
            <button onClick={cancelEditing} className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
            <Button
              size="sm"
              onClick={() => saveCheckpoint(editingPessoa.id)}
              disabled={savingId === editingPessoa.id || value === "" || !date}
              className="h-7 px-2.5 text-xs gap-1"
            >
              {savingId === editingPessoa.id
                ? <RefreshCw className="h-3 w-3 animate-spin" />
                : <Save className="h-3 w-3" />}
              Salvar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
