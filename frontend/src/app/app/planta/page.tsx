"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MoneyInput } from "@/components/MoneyInput";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { brl } from "@/lib/finance";
import { Plus, Trash2, ArrowRight, HardHat, Info } from "lucide-react";

type TipoEvento = "unico" | "mensal" | "semestral";

type EventoPlanta = {
  id: string;
  descricao: string;
  data: string;
  tipo: TipoEvento;
  valor: number;
  quantidade: number;
};

const SUGESTOES = [
  { descricao: "Sinal / Ato", tipo: "unico" as TipoEvento, quantidade: 1 },
  { descricao: "Parcelas mensais (obra)", tipo: "mensal" as TipoEvento, quantidade: 24 },
  { descricao: "Evolução de Obra — Fundação", tipo: "unico" as TipoEvento, quantidade: 1 },
  { descricao: "Evolução de Obra — Estrutura", tipo: "unico" as TipoEvento, quantidade: 1 },
  { descricao: "Reforço Semestral", tipo: "semestral" as TipoEvento, quantidade: 4 },
  { descricao: "Entrega das Chaves", tipo: "unico" as TipoEvento, quantidade: 1 },
  { descricao: "Parcelas Pós-Chaves (Financiamento)", tipo: "mensal" as TipoEvento, quantidade: 360 },
];

function expandirEventos(eventos: EventoPlanta[]) {
  const linhas: { data: string; descricao: string; valor: number }[] = [];
  for (const ev of eventos) {
    const base = new Date(ev.data + "T12:00:00");
    if (ev.tipo === "unico") {
      linhas.push({ data: ev.data, descricao: ev.descricao, valor: ev.valor });
    } else if (ev.tipo === "mensal") {
      for (let i = 0; i < ev.quantidade; i++) {
        const d = new Date(base);
        d.setMonth(d.getMonth() + i);
        linhas.push({ data: d.toISOString().slice(0, 10), descricao: `${ev.descricao} ${i + 1}/${ev.quantidade}`, valor: ev.valor });
      }
    } else if (ev.tipo === "semestral") {
      for (let i = 0; i < ev.quantidade; i++) {
        const d = new Date(base);
        d.setMonth(d.getMonth() + i * 6);
        linhas.push({ data: d.toISOString().slice(0, 10), descricao: `${ev.descricao} ${i + 1}/${ev.quantidade}`, valor: ev.valor });
      }
    }
  }
  return linhas.sort((a, b) => a.data.localeCompare(b.data));
}

export default function PlantaPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [eventos, setEventos] = useState<EventoPlanta[]>([]);
  const [form, setForm] = useState<Omit<EventoPlanta, "id">>({
    descricao: "",
    data: new Date().toISOString().slice(0, 10),
    tipo: "unico",
    valor: "" as unknown as number,
    quantidade: 1,
  });

  const adicionarEvento = () => {
    if (!form.descricao || !form.valor || !form.data) return;
    setEventos([...eventos, { ...form, id: Math.random().toString(36).slice(2) }]);
    setForm({ descricao: "", data: form.data, tipo: "unico", valor: "" as unknown as number, quantidade: 1 });
  };

  const removerEvento = (id: string) => setEventos(eventos.filter(e => e.id !== id));

  const usarSugestao = (s: typeof SUGESTOES[0]) => {
    setForm({ ...form, descricao: s.descricao, tipo: s.tipo, quantidade: s.quantidade });
  };

  const linhasExpandidas = expandirEventos(eventos);
  const totalPago = linhasExpandidas.reduce((s, l) => s + l.valor, 0);

  const selectStyle = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up">
      <div>
        <p className="text-xs uppercase tracking-widest text-accent font-medium mb-2 flex items-center gap-2">
          <HardHat className="h-4 w-4" /> Simulação — Imóvel na Planta
        </p>
        <h1 className="font-display text-4xl md:text-5xl mb-3">Fluxo de pagamentos</h1>
        <p className="text-muted-foreground">Monte livremente todos os eventos de pagamento do seu imóvel na planta.</p>
      </div>

      {/* Info Banner */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3 text-sm text-amber-800 dark:text-amber-200">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <div>
          <p className="font-medium mb-1">Como usar</p>
          <p className="text-xs opacity-80">
            Adicione cada evento de pagamento do seu contrato: o sinal, as parcelas mensais de obra, reforços semestrais, a chave e o financiamento bancário pós-entrega. 
            Use as sugestões abaixo para agilizar. O sistema gera o calendário completo de pagamentos automaticamente.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Form */}
        <div className="lg:col-span-2 space-y-5">
          <Card className="p-6 shadow-soft border-border/60 space-y-4">
            <h3 className="font-display text-lg">Adicionar evento</h3>

            {/* Sugestões */}
            <div>
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Sugestões rápidas</p>
              <div className="flex flex-wrap gap-1.5">
                {SUGESTOES.map((s) => (
                  <button
                    key={s.descricao}
                    onClick={() => usarSugestao(s)}
                    className="text-[11px] px-2 py-1 rounded-md bg-secondary hover:bg-secondary/80 border border-border/60 transition-colors"
                  >
                    {s.descricao}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-border/40">
              <Label className="text-xs text-muted-foreground">Descrição</Label>
              <Input
                placeholder="Ex: Sinal, Parcela Mensal, Chaves..."
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Data início</Label>
                <Input type="date" value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Tipo</Label>
                <select className={selectStyle} value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoEvento })}>
                  <option value="unico">Pagamento único</option>
                  <option value="mensal">Mensal</option>
                  <option value="semestral">Semestral</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Valor</Label>
                <MoneyInput variant="money" min={0} value={form.valor}
                  onChange={(v) => setForm({ ...form, valor: v })} placeholder="R$ 0" />
              </div>
              {form.tipo !== "unico" && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Quantidade</Label>
                  <Input type="number" min={1} max={600}
                    value={form.quantidade}
                    onChange={(e) => setForm({ ...form, quantidade: Number(e.target.value) })} />
                </div>
              )}
            </div>

            <Button onClick={adicionarEvento}
              disabled={!form.descricao || !form.valor}
              className="w-full bg-gradient-warm text-accent-foreground hover:opacity-90">
              <Plus className="mr-2 h-4 w-4" /> Adicionar ao fluxo
            </Button>
          </Card>

          {/* Eventos Cadastrados */}
          {eventos.length > 0 && (
            <Card className="p-4 shadow-soft border-border/60 space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Eventos cadastrados</h4>
              {eventos.map((ev) => (
                <div key={ev.id} className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-border/50 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{ev.descricao}</p>
                    <p className="text-xs text-muted-foreground">
                      {ev.data} · {ev.tipo === "unico" ? "único" : `${ev.quantidade}x ${ev.tipo}`} · {brl(ev.valor)}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0" onClick={() => removerEvento(ev.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </Card>
          )}
        </div>

        {/* Calendar / Timeline */}
        <div className="lg:col-span-3">
          {linhasExpandidas.length > 0 ? (
            <Card className="shadow-soft border-border/60 overflow-hidden">
              <div className="p-5 border-b border-border/40 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-xl">Calendário de pagamentos</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{linhasExpandidas.length} pagamentos · Total: <strong className="text-foreground">{brl(totalPago)}</strong></p>
                </div>
              </div>
              <div className="overflow-auto max-h-[520px]">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/60 text-muted-foreground sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left">Data</th>
                      <th className="px-4 py-3 text-left">Descrição</th>
                      <th className="px-4 py-3 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linhasExpandidas.map((l, i) => (
                      <tr key={i} className="border-t border-border/40 hover:bg-secondary/20">
                        <td className="px-4 py-2.5 text-muted-foreground text-xs num whitespace-nowrap">
                          {new Date(l.data + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-4 py-2.5">{l.descricao}</td>
                        <td className="px-4 py-2.5 text-right font-medium num">{brl(l.valor)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-secondary/40 font-medium sticky bottom-0">
                    <tr>
                      <td colSpan={2} className="px-4 py-3 text-sm">Total Geral</td>
                      <td className="px-4 py-3 text-right font-display text-lg">{brl(totalPago)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>
          ) : (
            <div className="h-64 border border-dashed rounded-2xl flex flex-col items-center justify-center text-muted-foreground gap-3">
              <HardHat className="h-10 w-10 opacity-30" />
              <p className="text-sm">Adicione eventos ao lado para ver o calendário de pagamentos</p>
            </div>
          )}

          {linhasExpandidas.length > 0 && (
            <div className="flex justify-end mt-4">
              <Button onClick={() => router.push("/app/resultado")}
                className="h-12 px-8 bg-gradient-warm text-accent-foreground hover:opacity-90 shadow-glow">
                Ver Resultado Final <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
