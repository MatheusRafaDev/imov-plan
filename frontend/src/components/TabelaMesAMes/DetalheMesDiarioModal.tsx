"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  X, 
  Sparkles, 
  ArrowDownLeft, 
  Info, 
  Check, 
  CalendarDays,
  Clock
} from "lucide-react";
import { 
  brl, 
  calcularEvolucaoDiariaDoMes, 
  type EvolucaoMesResultado 
} from "@/lib/finance";
import { Button } from "@/components/ui/button";

export interface DetalheMesDiarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  mes: number;
  dataReferencia: string;
  saldoInicialMes: number;
  aporteRegular: number;
  aportesExtras?: Array<{ data?: string; valor: number; origem?: string; pessoaNome?: string }>;
  taxaCdiAnual?: number;
  tipoInvestimento?: string;
  diaAporteInicial?: number;
  pessoas?: Array<{
    id: string;
    nome: string;
    aporte_mensal: number;
    diaAporte?: number;
  }>;
  onSalvarDiaAporte?: (novoDia: number, aplicarParaTodos: boolean) => void;
  onSalvarDiaAportePessoa?: (pessoaId: string, novoDia: number) => void;
}

export function DetalheMesDiarioModal({
  isOpen,
  onClose,
  mes,
  dataReferencia,
  saldoInicialMes,
  aporteRegular,
  aportesExtras = [],
  taxaCdiAnual = 10.5,
  tipoInvestimento = "cdb_100",
  diaAporteInicial = 5,
  pessoas = [],
  onSalvarDiaAporte,
  onSalvarDiaAportePessoa,
}: DetalheMesDiarioModalProps) {
  const [diaAporte, setDiaAporte] = useState<number>(diaAporteInicial);
  const [filtro, setFiltro] = useState<"todos" | "uteis" | "movimentacoes">("todos");
  const [salvandoPadrao, setSalvandoPadrao] = useState(false);

  // Mapeia o dia do aporte para cada pessoa
  const [diasPorPessoa, setDiasPorPessoa] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    (pessoas || []).forEach(p => {
      map[p.id] = p.diaAporte ?? diaAporteInicial;
    });
    return map;
  });

  // Detecta se este modal corresponde ao mês atual do calendário para dar destaque ao dia de hoje
  const hoje = useMemo(() => new Date(), []);
  const { isMesAtual, diaHoje } = useMemo(() => {
    try {
      const dRef = new Date(dataReferencia);
      const refAno = dRef.getUTCFullYear();
      const refMes = dRef.getUTCMonth();
      const hojeAno = hoje.getFullYear();
      const hojeMes = hoje.getMonth();
      const isAtual = refAno === hojeAno && refMes === hojeMes;
      return { isMesAtual: isAtual, diaHoje: hoje.getDate() };
    } catch {
      return { isMesAtual: false, diaHoje: hoje.getDate() };
    }
  }, [dataReferencia, hoje]);

  // Calcula os dias do mês para limitar o seletor
  const diasNoMes = useMemo(() => {
    try {
      const dRef = new Date(dataReferencia);
      const ano = dRef.getUTCFullYear() || new Date().getUTCFullYear();
      const mesNum = (dRef.getUTCMonth() || 0) + 1;
      return new Date(Date.UTC(ano, mesNum, 0)).getUTCDate();
    } catch {
      return 30;
    }
  }, [dataReferencia]);

  // Lista de aportes configurados por participante com suas datas individuais
  const aportesParticipantes = useMemo(() => {
    if (!pessoas || pessoas.length === 0) return undefined;
    return pessoas.map(p => ({
      pessoaId: p.id,
      pessoaNome: p.nome,
      valor: Number(p.aporte_mensal || 0),
      diaAporte: diasPorPessoa[p.id] ?? p.diaAporte ?? diaAporte,
    }));
  }, [pessoas, diasPorPessoa, diaAporte]);

  // Recalcula a evolução diária em tempo real sempre que o dia do aporte mudar
  const resultado: EvolucaoMesResultado = useMemo(() => {
    return calcularEvolucaoDiariaDoMes({
      dataReferencia,
      saldoInicialMes,
      aporteRegular,
      diaAporteRegular: diaAporte,
      aportesParticipantes,
      aportesExtras,
      taxaCdiAnual,
      tipoInvestimento,
    });
  }, [dataReferencia, saldoInicialMes, aporteRegular, diaAporte, aportesParticipantes, aportesExtras, taxaCdiAnual, tipoInvestimento]);

  const saldoHoje = useMemo(() => {
    if (!isMesAtual) return null;
    const itemHoje = resultado.dias.find(d => d.dia === diaHoje);
    return itemHoje ? itemHoje.saldoFinal : null;
  }, [isMesAtual, resultado.dias, diaHoje]);

  // Auto-scroll suave para o dia de hoje quando o modal abrir no mês atual
  useEffect(() => {
    if (!isOpen || !isMesAtual) return;
    const timer = setTimeout(() => {
      const el = document.getElementById(`linha-dia-${diaHoje}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [isOpen, isMesAtual, diaHoje]);

  const diasFiltrados = useMemo(() => {
    if (filtro === "uteis") {
      return resultado.dias.filter(d => d.isDiaUtil);
    }
    if (filtro === "movimentacoes") {
      return resultado.dias.filter(d => d.totalAportesDoDia > 0 || d.rendimentoDoDia > 0 || (isMesAtual && d.dia === diaHoje));
    }
    return resultado.dias;
  }, [resultado.dias, filtro, isMesAtual, diaHoje]);

  if (!isOpen || typeof document === "undefined") return null;

  const handleMudarDia = (novoDia: number) => {
    const diaValido = Math.min(Math.max(1, novoDia), diasNoMes);
    setDiaAporte(diaValido);
    onSalvarDiaAporte?.(diaValido, false);
  };

  const handleMudarDiaPessoa = (pessoaId: string, novoDia: number) => {
    const diaValido = Math.min(Math.max(1, novoDia), diasNoMes);
    setDiasPorPessoa(prev => ({ ...prev, [pessoaId]: diaValido }));
    onSalvarDiaAportePessoa?.(pessoaId, diaValido);
  };

  const handleSalvarComoPadrao = () => {
    setSalvandoPadrao(true);
    onSalvarDiaAporte?.(diaAporte, true);
    setTimeout(() => setSalvandoPadrao(false), 1200);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-background/70 backdrop-blur-sm animate-modal-backdrop">
      <div 
        className="fixed inset-0 -z-10" 
        onClick={onClose}
        aria-hidden="true" 
      />

      <div 
        role="dialog"
        aria-modal="true"
        className="relative z-50 w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-border/80 bg-card text-card-foreground shadow-2xl overflow-hidden animate-modal-box font-sans"
      >
        {/* Cabeçalho */}
        <div className="px-5 sm:px-6 py-4 border-b border-border/50 bg-secondary/15 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 shrink-0 rounded-2xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center shadow-xs">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display text-lg sm:text-xl font-bold text-foreground truncate">
                  Evolução Diária · Mês {mes}
                </h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                  {resultado.nomeMes}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 truncate">
                <Sparkles className="h-3.5 w-3.5 text-success shrink-0" />
                <span>{resultado.diasUteisTotais} dias úteis com rendimento CDI a {taxaCdiAnual}% a.a.</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-colors shrink-0 cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo com scroll */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar">
          {/* Card de Configuração: Quando cai o aporte */}
          <div className="rounded-2xl border border-accent/20 bg-accent/5 p-4 sm:p-5 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-foreground font-semibold text-sm sm:text-base">
                  <Clock className="h-4 w-4 text-accent" />
                  <span>Quando caem os aportes neste mês?</span>
                </div>
                <p className="text-xs text-muted-foreground max-w-xl">
                  {pessoas && pessoas.length > 1 
                    ? "Cada pessoa pode aportar em um dia diferente (conforme a data de recebimento do salário). O dinheiro rende antes e passa a render mais a partir do momento em que cada depósito é creditado."
                    : "Defina o dia exato do depósito. O dinheiro rende antes da data com o saldo inicial e passa a render mais a partir do dia em que o aporte entra."}
                </p>
              </div>

              {onSalvarDiaAporte && (!pessoas || pessoas.length <= 1) && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleSalvarComoPadrao}
                  className="text-xs h-8 px-3 border-accent/30 hover:bg-accent/10 text-foreground cursor-pointer shrink-0"
                >
                  {salvandoPadrao ? (
                    <>
                      <Check className="h-3.5 w-3.5 mr-1 text-success" /> Padrão salvo!
                    </>
                  ) : (
                    "Usar dia como padrão"
                  )}
                </Button>
              )}
            </div>

            {/* Controles de seleção de dia por participante ou geral */}
            {pessoas && pessoas.length > 0 ? (
              <div className="space-y-2.5 pt-1">
                {pessoas.map((p) => {
                  const diaAtualPessoa = diasPorPessoa[p.id] ?? p.diaAporte ?? diaAporte;
                  return (
                    <div 
                      key={p.id} 
                      className="bg-card border border-border/60 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs sm:text-sm text-foreground truncate">{p.nome}</span>
                          <span className="text-xs font-bold text-accent num shrink-0">+{brl(Number(p.aporte_mensal || 0))}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Aporte agendado para o <strong className="text-accent font-semibold">dia {diaAtualPessoa}</strong> de cada mês
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                        <span className="text-[11px] text-muted-foreground mr-1">Frequentes:</span>
                        {[1, 5, 10, 15, 20, 25].map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => handleMudarDiaPessoa(p.id, d)}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                              diaAtualPessoa === d
                                ? "bg-accent text-accent-foreground shadow-2xs"
                                : "bg-secondary/40 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                            }`}
                          >
                            Dia {d}
                          </button>
                        ))}

                        <div className="flex items-center gap-1 ml-auto sm:ml-2">
                          <span className="text-[10px] text-muted-foreground">Outro:</span>
                          <input
                            type="number"
                            min={1}
                            max={diasNoMes}
                            value={diaAtualPessoa}
                            onChange={(e) => handleMudarDiaPessoa(p.id, Number(e.target.value) || 1)}
                            className="w-12 h-7 px-1 text-xs font-semibold text-center rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs font-medium text-muted-foreground mr-1">Dias frequentes:</span>
                {[1, 5, 10, 15, 20, 25].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleMudarDia(d)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      diaAporte === d
                        ? "bg-accent text-accent-foreground shadow-xs"
                        : "bg-card border border-border/60 text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                    }`}
                  >
                    Dia {d}
                  </button>
                ))}

                <div className="flex items-center gap-1.5 ml-auto">
                  <label htmlFor="custom-dia" className="text-xs text-muted-foreground font-medium">Outro dia:</label>
                  <input
                    id="custom-dia"
                    type="number"
                    min={1}
                    max={diasNoMes}
                    value={diaAporte}
                    onChange={(e) => handleMudarDia(Number(e.target.value) || 1)}
                    className="w-14 h-8 px-2 text-xs font-semibold text-center rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Destaque do Dia Atual */}
          {isMesAtual && saldoHoje !== null && (
            <div className="rounded-2xl border-2 border-accent/40 bg-gradient-to-r from-accent/15 via-accent/10 to-transparent p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-accent text-accent-foreground font-display font-extrabold text-base flex items-center justify-center shrink-0 shadow-xs ring-4 ring-accent/20">
                  {diaHoje}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-accent bg-accent/20 px-2.5 py-0.5 rounded-full border border-accent/30">
                      ✨ Hoje · Dia {diaHoje}
                    </span>
                    <span className="text-xs text-foreground font-semibold">
                      Posição Atual em Tempo Real
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Saldo ao término do dia de hoje considerando aportes e juros compostos já acumulados.
                  </p>
                </div>
              </div>
              <div className="sm:text-right shrink-0 bg-card/80 sm:bg-transparent px-3 py-2 sm:p-0 rounded-xl border border-border/40 sm:border-0">
                <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Saldo Fechamento Hoje</p>
                <p className="font-display text-lg sm:text-2xl font-extrabold text-accent num">
                  {brl(saldoHoje)}
                </p>
              </div>
            </div>
          )}

          {/* KPIs Resumo do Mês */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-secondary/20 rounded-2xl p-3 sm:p-3.5 border border-border/40">
              <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mb-1">Saldo Inicial</p>
              <p className="font-display text-base sm:text-lg font-bold text-foreground num">{brl(resultado.saldoInicialMes)}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Início do mês</p>
            </div>

            <div className="bg-secondary/20 rounded-2xl p-3 sm:p-3.5 border border-border/40">
              <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mb-1">Aportes do Mês</p>
              <p className="font-display text-base sm:text-lg font-bold text-accent num">{brl(resultado.totalAportesMes)}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Cai no dia {resultado.diaAporteConfigurado}</p>
            </div>

            <div className="bg-secondary/20 rounded-2xl p-3 sm:p-3.5 border border-border/40">
              <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mb-1">Rendimento do Mês</p>
              <p className="font-display text-base sm:text-lg font-bold text-success num">+{brl(resultado.totalRendimentoMes)}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Juros compostos diários</p>
            </div>

            <div className="bg-secondary/20 rounded-2xl p-3 sm:p-3.5 border border-border/40">
              <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mb-1">Saldo Final</p>
              <p className="font-display text-base sm:text-lg font-bold text-foreground num">{brl(resultado.saldoFinalMes)}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Fechamento do mês</p>
            </div>
          </div>

          {/* Filtros da lista */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-1.5 bg-secondary/30 p-1 rounded-xl text-xs font-medium border border-border/40 self-start">
              <button
                type="button"
                onClick={() => setFiltro("todos")}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  filtro === "todos"
                    ? "bg-card text-foreground font-semibold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Todos os dias ({resultado.dias.length})
              </button>
              <button
                type="button"
                onClick={() => setFiltro("uteis")}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  filtro === "uteis"
                    ? "bg-card text-foreground font-semibold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Dias Úteis ({resultado.diasUteisTotais})
              </button>
              <button
                type="button"
                onClick={() => setFiltro("movimentacoes")}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  filtro === "movimentacoes"
                    ? "bg-card text-foreground font-semibold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Com Rendimento / Aporte
              </button>
            </div>

            <div className="text-[11px] text-muted-foreground flex items-center gap-2">
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-accent inline-block" /> Dia do Aporte
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-success inline-block" /> Rendimento Útil
              </span>
            </div>
          </div>

          {/* Tabela do Dia a Dia */}
          <div className="rounded-2xl border border-border/50 overflow-hidden bg-card shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-sans border-collapse">
                <thead className="bg-secondary/30 text-muted-foreground border-b border-border/50">
                  <tr>
                    <th className="px-3.5 py-2.5 text-left font-medium whitespace-nowrap">Dia</th>
                    <th className="px-3.5 py-2.5 text-left font-medium whitespace-nowrap">Status</th>
                    <th className="px-3.5 py-2.5 text-right font-medium whitespace-nowrap">Saldo Início</th>
                    <th className="px-3.5 py-2.5 text-right font-medium whitespace-nowrap">Aporte Entrada</th>
                    <th className="px-3.5 py-2.5 text-right font-medium whitespace-nowrap">Rendimento do Dia</th>
                    <th className="px-3.5 py-2.5 text-right font-medium whitespace-nowrap">Saldo Fim do Dia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {diasFiltrados.map((item) => {
                    const hasAporte = item.totalAportesDoDia > 0;
                    const isHoje = isMesAtual && item.dia === diaHoje;

                    return (
                      <tr 
                        key={item.dia} 
                        id={`linha-dia-${item.dia}`}
                        className={`transition-all duration-200 ${
                          isHoje 
                            ? "bg-accent/20 font-semibold ring-2 ring-accent ring-inset shadow-xs relative z-10" 
                            : hasAporte 
                              ? "bg-accent/5 font-medium hover:bg-secondary/15" 
                              : !item.isDiaUtil 
                                ? "opacity-60 bg-secondary/5 hover:bg-secondary/15" 
                                : "hover:bg-secondary/15"
                        }`}
                      >
                        {/* Dia */}
                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className={`font-display font-bold text-sm w-6 text-right num ${isHoje ? "text-accent font-extrabold scale-110" : "text-foreground"}`}>
                              {String(item.dia).padStart(2, "0")}
                            </span>
                            <span className="text-[11px] text-muted-foreground uppercase font-medium">
                              ({item.diaSemana})
                            </span>
                            {isHoje && (
                              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-extrabold tracking-wider uppercase bg-accent text-accent-foreground shadow-xs animate-pulse">
                                Hoje
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status / Tag */}
                        <td className="px-3.5 py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {isHoje && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent text-accent-foreground shadow-2xs">
                                ✨ Dia Atual
                              </span>
                            )}
                            {item.detalhesAportesRegulares && item.detalhesAportesRegulares.length > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent/15 text-accent border border-accent/25">
                                <ArrowDownLeft className="h-3 w-3" /> Aporte {item.detalhesAportesRegulares.map(a => a.pessoaNome ? a.pessoaNome.split(" ")[0] : "Participante").join(" & ")}
                              </span>
                            ) : hasAporte ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent/15 text-accent border border-accent/25">
                                <ArrowDownLeft className="h-3 w-3" /> Aporte extra
                              </span>
                            ) : item.isDiaUtil ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                                Dia útil
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/60 italic">
                                Fim de semana
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Saldo Inicial */}
                        <td className="px-3.5 py-2.5 text-right whitespace-nowrap text-muted-foreground num">
                          {brl(item.saldoInicial)}
                        </td>

                        {/* Aporte */}
                        <td className="px-3.5 py-2.5 text-right whitespace-nowrap num">
                          {hasAporte ? (
                            <div>
                              <span className="font-bold text-accent">+{brl(item.totalAportesDoDia)}</span>
                              {item.detalhesAportesRegulares && item.detalhesAportesRegulares.length > 0 && (
                                <p className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[150px] ml-auto">
                                  {item.detalhesAportesRegulares.map(a => `${a.pessoaNome ? a.pessoaNome.split(" ")[0] : ""}: ${brl(a.valor)}`).join(", ")}
                                </p>
                              )}
                              {item.detalhesExtras.length > 0 && (
                                <p className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[150px] ml-auto">
                                  Extra: {item.detalhesExtras.map(e => e.origem).join(", ")}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </td>

                        {/* Rendimento do Dia */}
                        <td className="px-3.5 py-2.5 text-right whitespace-nowrap num">
                          {item.rendimentoDoDia > 0 ? (
                            <span className="font-semibold text-success">
                              +{brl(item.rendimentoDoDia)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/40 text-[11px]">R$ 0,00</span>
                          )}
                        </td>

                        {/* Saldo Final */}
                        <td className={`px-3.5 py-2.5 text-right whitespace-nowrap num ${isHoje ? "text-accent font-extrabold text-sm" : "font-semibold text-foreground"}`}>
                          {brl(item.saldoFinal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-border/50 bg-secondary/10 flex items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-muted-foreground hidden sm:flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-accent shrink-0" />
            <span>Rendimento diário calculado a juros compostos com alíquota CDI de dias úteis.</span>
          </p>

          <Button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto ml-auto bg-gradient-warm text-accent-foreground hover:opacity-90 h-9 px-5 rounded-xl cursor-pointer"
          >
            Concluir
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
