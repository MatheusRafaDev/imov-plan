"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  X, 
  ArrowDownLeft, 
  Info, 
  Check, 
  CalendarDays,
  Clock,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal
} from "lucide-react";
import { 
  brl, 
  calcularEvolucaoDiariaDoMes, 
  type EvolucaoMesResultado 
} from "@/lib/finance";
import { Button } from "@/components/ui/button";
import { getBrasiliaToday } from "@/utils/dates";


export interface DetalheMesDiarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  mes: number;
  dataReferencia: string;
  saldoInicialMes: number;
  saldosIniciaisPorPessoa?: Record<string, number>;
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
  saldosIniciaisPorPessoa,
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
  const [salvandoPadrao, setSalvandoPadrao] = useState(false);
  const [apenasUteis, setApenasUteis] = useState(false);
  const [mostrarColunasIndividuais, setMostrarColunasIndividuais] = useState(false);
  const [mostrarConfigAportes, setMostrarConfigAportes] = useState(false);

  // Mapeia o dia do aporte para cada pessoa
  const [diasPorPessoa, setDiasPorPessoa] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    (pessoas || []).forEach(p => {
      map[p.id] = p.diaAporte ?? diaAporteInicial;
    });
    return map;
  });

  // Detecta se este modal corresponde ao mês atual do calendário oficial de Brasília para destacar o dia de hoje
  const { isMesAtual, diaHoje } = useMemo(() => {
    try {
      const { ano: hojeAno, mes: hojeMes, dia } = getBrasiliaToday();
      if (!dataReferencia) return { isMesAtual: false, diaHoje: dia };

      const match = String(dataReferencia).match(/^(\d{4})-(\d{2})/);
      if (match) {
        const refAno = parseInt(match[1], 10);
        const refMes = parseInt(match[2], 10);
        return { isMesAtual: refAno === hojeAno && refMes === hojeMes, diaHoje: dia };
      }

      const dRef = new Date(dataReferencia);
      const refAno = dRef.getUTCFullYear();
      const refMes = dRef.getUTCMonth() + 1;
      return { isMesAtual: refAno === hojeAno && refMes === hojeMes, diaHoje: dia };
    } catch {
      return { isMesAtual: false, diaHoje: getBrasiliaToday().dia };
    }
  }, [dataReferencia]);

  // Calcula os dias do mês para limitar o seletor
  const diasNoMes = useMemo(() => {
    try {
      const match = String(dataReferencia).match(/^(\d{4})-(\d{2})/);
      if (match) {
        const ano = parseInt(match[1], 10);
        const mesNum = parseInt(match[2], 10);
        return new Date(Date.UTC(ano, mesNum, 0)).getUTCDate();
      }
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
      saldosIniciaisPorPessoa,
      aporteRegular,
      diaAporteRegular: diaAporte,
      aportesParticipantes,
      aportesExtras,
      taxaCdiAnual,
      tipoInvestimento,
    });
  }, [dataReferencia, saldoInicialMes, saldosIniciaisPorPessoa, aporteRegular, diaAporte, aportesParticipantes, aportesExtras, taxaCdiAnual, tipoInvestimento]);

  const itemHoje = useMemo(() => {
    if (!isMesAtual) return null;
    return resultado.dias.find(d => d.dia === diaHoje) || null;
  }, [isMesAtual, resultado.dias, diaHoje]);

  const saldoHoje = itemHoje ? itemHoje.saldoFinal : null;

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
  }, [isOpen, isMesAtual, diaHoje, apenasUteis]);

  const diasFiltrados = useMemo(() => {
    if (!apenasUteis) return resultado.dias;
    return resultado.dias.filter(
      (d) => d.isDiaUtil || d.totalAportesDoDia > 0 || (isMesAtual && d.dia === diaHoje)
    );
  }, [resultado.dias, apenasUteis, isMesAtual, diaHoje]);

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
      {/* Backdrop não fecha ao clicar fora - saída somente pelo botão X */}
      <div 
        className="fixed inset-0 -z-10" 
        aria-hidden="true" 
      />

      <div 
        role="dialog"
        aria-modal="true"
        className="relative z-50 w-full max-w-6xl xl:max-w-7xl max-h-[92vh] flex flex-col rounded-3xl border border-border/80 bg-card text-card-foreground shadow-2xl overflow-hidden animate-modal-box font-sans"
      >
        {/* Cabeçalho */}
        <div className="px-5 sm:px-6 py-3.5 border-b border-border/50 bg-secondary/15 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 shrink-0 rounded-xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center shadow-xs">
              <CalendarDays className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display text-base sm:text-lg font-bold text-foreground truncate">
                  Evolução Diária · Mês {mes}
                </h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                  {resultado.nomeMes}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {resultado.diasUteisTotais} dias úteis com rendimento CDI a {taxaCdiAnual}% a.a.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-colors shrink-0 cursor-pointer"
            title="Fechar"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo com scroll */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar">
          {/* Barra de configuração de aportes (Compacta e expansível) */}
          <div className="rounded-2xl border border-border/50 bg-secondary/15 p-3 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4 text-accent shrink-0" />
                <span>
                  Aportes caem no:{" "}
                  {pessoas && pessoas.length > 0 ? (
                    <strong className="text-foreground font-semibold">
                      {pessoas.map((p) => `${p.nome.split(" ")[0]} (dia ${diasPorPessoa[p.id] ?? p.diaAporte ?? diaAporte})`).join(", ")}
                    </strong>
                  ) : (
                    <strong className="text-foreground font-semibold">dia {diaAporte}</strong>
                  )}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setMostrarConfigAportes(!mostrarConfigAportes)}
                className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 cursor-pointer self-end sm:self-auto shrink-0"
              >
                {mostrarConfigAportes ? (
                  <>Fechar configuração <ChevronUp className="h-3.5 w-3.5" /></>
                ) : (
                  <>Alterar dia do aporte <ChevronDown className="h-3.5 w-3.5" /></>
                )}
              </button>
            </div>

            {mostrarConfigAportes && (
              <div className="pt-3 mt-2.5 border-t border-border/40 space-y-2.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] text-muted-foreground">
                    Defina o dia em que o depósito cai para recalcular a rentabilidade:
                  </p>
                  {onSalvarDiaAporte && (!pessoas || pessoas.length <= 1) && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleSalvarComoPadrao}
                      className="text-xs h-7 px-2 border-accent/30 hover:bg-accent/10 cursor-pointer"
                    >
                      {salvandoPadrao ? (
                        <><Check className="h-3 w-3 mr-1 text-success" /> Salvo!</>
                      ) : (
                        "Salvar como padrão"
                      )}
                    </Button>
                  )}
                </div>

                {pessoas && pessoas.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-2">
                    {pessoas.map((p) => {
                      const diaAtualPessoa = diasPorPessoa[p.id] ?? p.diaAporte ?? diaAporte;
                      return (
                        <div key={p.id} className="bg-card border border-border/60 rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-2xs">
                          <div className="min-w-0">
                            <span className="font-semibold text-xs text-foreground truncate block">{p.nome}</span>
                            <span className="text-[10px] text-accent font-bold num">+{brl(Number(p.aporte_mensal || 0))}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {[1, 5, 10, 20].map((d) => (
                              <button
                                key={d}
                                type="button"
                                onClick={() => handleMudarDiaPessoa(p.id, d)}
                                className={`px-2 py-0.5 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                                  diaAtualPessoa === d
                                    ? "bg-accent text-accent-foreground shadow-2xs"
                                    : "bg-secondary/40 border border-border/50 text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                {d}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    {[1, 5, 10, 20].map((d) => (
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
                  </div>
                )}
              </div>
            )}
          </div>

          {/* KPIs Resumo do Mês */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            <div className="bg-secondary/20 rounded-2xl p-3 sm:p-3.5 border border-border/40">
              <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mb-0.5">Saldo Inicial</p>
              <p className="font-display text-base sm:text-lg font-bold text-foreground num">{brl(resultado.saldoInicialMes)}</p>
              <p className="text-[10px] text-muted-foreground">Início do mês</p>
            </div>

            <div className="bg-secondary/20 rounded-2xl p-3 sm:p-3.5 border border-border/40">
              <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mb-0.5">Aportes do Mês</p>
              <p className="font-display text-base sm:text-lg font-bold text-accent num">{brl(resultado.totalAportesMes)}</p>
              <p className="text-[10px] text-muted-foreground">Total depositado</p>
            </div>

            <div className="bg-secondary/20 rounded-2xl p-3 sm:p-3.5 border border-border/40">
              <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mb-0.5">Rendimento</p>
              <p className="font-display text-base sm:text-lg font-bold text-success num">+{brl(resultado.totalRendimentoMes)}</p>
              <p className="text-[10px] text-muted-foreground">{resultado.diasUteisTotais} dias úteis</p>
            </div>

            <div className={`rounded-2xl p-3 sm:p-3.5 border transition-all ${
              isMesAtual && saldoHoje !== null
                ? "bg-accent/10 border-accent/40 shadow-2xs ring-1 ring-accent/20"
                : "bg-secondary/20 border-border/40"
            }`}>
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <p className={`text-[10px] uppercase font-semibold tracking-wider ${isMesAtual ? "text-accent font-bold" : "text-muted-foreground"}`}>
                  {isMesAtual ? `Saldo Hoje (Dia ${diaHoje})` : "Saldo Final"}
                </p>
                {isMesAtual && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase bg-accent text-accent-foreground">
                    Hoje
                  </span>
                )}
              </div>
              <p className={`font-display text-base sm:text-lg font-extrabold num ${isMesAtual ? "text-accent" : "text-foreground"}`}>
                {brl(isMesAtual && saldoHoje !== null ? saldoHoje : resultado.saldoFinalMes)}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {isMesAtual ? "Posição atual em tempo real" : "Fechamento do mês"}
              </p>
            </div>
          </div>

          {/* Barra de Filtro e Visualização da Tabela */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5 bg-secondary/30 p-1 rounded-xl w-fit border border-border/40">
              <button
                type="button"
                onClick={() => setApenasUteis(false)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  !apenasUteis
                    ? "bg-card text-foreground shadow-2xs border border-border/50"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Todos os dias ({resultado.dias.length})
              </button>
              <button
                type="button"
                onClick={() => setApenasUteis(true)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  apenasUteis
                    ? "bg-card text-foreground shadow-2xs border border-border/50"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Apenas dias úteis e aportes
              </button>
            </div>

            {pessoas && pessoas.length > 1 && (
              <button
                type="button"
                onClick={() => setMostrarColunasIndividuais(!mostrarColunasIndividuais)}
                className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 self-end sm:self-auto ${
                  mostrarColunasIndividuais
                    ? "bg-accent/15 border-accent/40 text-accent font-bold"
                    : "bg-card border-border/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                <SlidersHorizontal className="h-3 w-3" />
                {mostrarColunasIndividuais ? "Ocultar colunas por pessoa" : "Expandir colunas por pessoa"}
              </button>
            )}
          </div>

          {/* Tabela Simplificada */}
          <div className="rounded-2xl border border-border/50 overflow-hidden bg-card shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-sans border-collapse">
                <thead className="bg-secondary/30 text-muted-foreground border-b border-border/50">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium whitespace-nowrap">Dia</th>
                    <th className="px-4 py-2.5 text-right font-medium whitespace-nowrap">Aporte</th>
                    <th className="px-4 py-2.5 text-right font-medium whitespace-nowrap">Rendimento</th>
                    {mostrarColunasIndividuais && pessoas && pessoas.map(p => (
                      <th key={p.id} className="px-4 py-2.5 text-right font-medium whitespace-nowrap">
                        <div className="flex flex-col items-end">
                          <span className="text-foreground font-semibold">{p.nome.split(" ")[0]}</span>
                          <span className="text-[10px] font-normal text-muted-foreground/70">saldo</span>
                        </div>
                      </th>
                    ))}
                    <th className="px-4 py-2.5 text-right font-medium whitespace-nowrap">Saldo Acumulado</th>
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
                                ? "opacity-50 bg-secondary/5 hover:bg-secondary/15" 
                                : "hover:bg-secondary/15"
                        }`}
                      >
                        {/* Dia */}
                        <td className="px-4 py-2.5 whitespace-nowrap">
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

                        {/* Aporte */}
                        <td className="px-4 py-2.5 text-right whitespace-nowrap num">
                          {hasAporte ? (
                            <div>
                              <span className="font-bold text-accent">+{brl(item.totalAportesDoDia)}</span>
                              {item.detalhesAportesRegulares && item.detalhesAportesRegulares.length > 0 && (
                                <p className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[180px] ml-auto">
                                  {item.detalhesAportesRegulares.map(a => `${a.pessoaNome ? a.pessoaNome.split(" ")[0] : ""}: ${brl(a.valor)}`).join(", ")}
                                </p>
                              )}
                              {item.detalhesExtras && item.detalhesExtras.length > 0 && (
                                <p className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[180px] ml-auto">
                                  Extra: {item.detalhesExtras.map(e => e.origem).join(", ")}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground/30">—</span>
                          )}
                        </td>

                        {/* Rendimento */}
                        <td className="px-4 py-2.5 text-right whitespace-nowrap num">
                          {item.rendimentoDoDia > 0 ? (
                            <span className="font-semibold text-success">
                              +{brl(item.rendimentoDoDia)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/30">—</span>
                          )}
                        </td>

                        {/* Colunas Opcionais por Pessoa (quando expandido) */}
                        {mostrarColunasIndividuais && pessoas && pessoas.map(p => {
                          const saldoPessoa = item.saldoPorPessoa?.[p.id] ?? 0;
                          return (
                            <td key={p.id} className="px-4 py-2.5 text-right whitespace-nowrap num">
                              <span className={isHoje ? "font-bold text-accent" : "font-medium text-foreground"}>
                                {brl(saldoPessoa)}
                              </span>
                            </td>
                          );
                        })}

                        {/* Saldo Acumulado */}
                        <td className="px-4 py-2.5 text-right whitespace-nowrap num">
                          <div className="flex flex-col items-end">
                            <span className={isHoje ? "text-accent font-extrabold text-sm" : "font-semibold text-foreground"}>
                              {brl(item.saldoFinal)}
                            </span>
                            {!mostrarColunasIndividuais && pessoas && pessoas.length > 1 && item.saldoPorPessoa && (
                              <div className="flex items-center gap-1 mt-0.5 text-[10px] text-muted-foreground flex-wrap justify-end">
                                {pessoas.map((p, pIdx) => (
                                  <span key={p.id}>
                                    {pIdx > 0 && <span className="opacity-40 mr-1">•</span>}
                                    {p.nome.split(" ")[0]}: <strong className="text-foreground/80 font-medium">{brl(item.saldoPorPessoa?.[p.id] ?? 0)}</strong>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
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
