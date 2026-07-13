"use client";

import React from "react";
import { ParticipanteSummary } from "@/types/simulacao";
import { Card } from "@/components/ui/card";
import { Currency } from "@/components/ui/Currency";
import { Percentage } from "@/components/ui/Percentage";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { User } from "lucide-react";

interface ParticipantsCardProps {
  participantes: ParticipanteSummary[];
  totalAcumulado: number;
}

export function ParticipantsCard({ participantes, totalAcumulado }: ParticipantsCardProps) {
  if (!participantes || participantes.length === 0) return null;

  return (
    <Card className="p-6 border-border/50 rounded-xl">
      <div className="flex items-center gap-2 mb-6">
        <User className="w-5 h-5 text-muted-foreground" />
        <h3 className="font-display text-lg font-medium">Divisão por Participante</h3>
      </div>

      <div className="space-y-6">
        {participantes.map((p) => (
          <div key={p.participanteId} className="flex flex-col gap-2">
            <div className="flex justify-between items-end">
              <div>
                <p className="font-medium">{p.nome}</p>
                <p className="text-xs text-muted-foreground">
                  <Currency value={p.saldoFinal} /> (<Percentage value={p.percentualDoTotal} />)
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Investido</p>
                <p className="text-sm font-medium">
                  <Currency value={p.aportadoTotal + p.valorInicial} />
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Rendimento</p>
                <p className="text-sm font-medium text-success">
                  +<Currency value={p.rendimentoTotal} />
                </p>
              </div>
            </div>
            <ProgressBar value={p.percentualDoTotal} showValue={false} height="h-1.5" />
          </div>
        ))}
      </div>
    </Card>
  );
}
