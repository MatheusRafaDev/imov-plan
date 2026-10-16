// Lógica financeira — pura, testável, sem React.
// Convenções: valores em BRL, taxas em % a.a.

export type Aporte = {
  data: string; // ISO
  valor: number;
  origem: string;
  pessoaNome?: string;
  pessoaId?: string;
  checked?: boolean;
};

export type CenarioSimulacao = "pessimista" | "realista" | "otimista";

// Variação do CDI aplicada por cenário (pontos percentuais absolutos sobre taxaCdiAnual)
const CENARIO_CDI_DELTA: Record<CenarioSimulacao, number> = {
  pessimista: -2.0,
  realista: 0,
  otimista: 2.0,
};

export type SimInput = {
  nomePlano?: string;
  valorImovel: number;
  percentualEntrada: number; // ex 20
  percentualCustosExtras: number; // ex 5 (ITBI+escritura+registro estimado)
  valorJaGuardado: number;
  aporteMensalTotal: number; // soma dos aportes do casal
  aportesRegularesEditados?: Record<number, number>; // mes -> novo aporte
  taxaCdiAnual: number; // ex 13.65 (%)
  percentualCdi: number; // ex 100 (% do CDI que o investimento rende)
  aportesExtras: Aporte[]; // datados
  prazoMaxMeses?: number; // limite p/ busca, default 600
  mesesExtrasAposMeta?: number; // default 6, usado só para exibição
  dataInicio?: Date;
  tipoInvestimento?: string; // ex "poupanca", "cdb_100", "tesouro_selic"
  cenario?: CenarioSimulacao; // default "realista"
  estado?: string; // UF do imóvel ex: "SP"
  cidade?: string; // Cidade do imóvel ex: "São Paulo"
  /** Uso interno: pula o cálculo de sugestões para evitar recursão infinita
   * quando simular() é chamado de dentro de aporteNecessarioParaPrazo/mesesParaMeta. */
  pularSugestoes?: boolean;
  checkpoints?: {
    valorInicial: number;
    valorAtual: number;
    dataValorAtual: string;
  }[];
};

export type Sugestoes = {
  /** Aporte mensal adicional necessário para cumprir o prazo (R$) */
  aumentoAporteNecessario: number;
  /** Em quantos meses a meta seria atingida com o aporte atual */
  novoPrazoNecessarioMeses: number;
  /** Qual valor de imóvel se encaixa no prazo/aporte atuais */
  reducaoImovelNecessaria: number;
};

export type SimRow = {
  mes: number;
  data: string; // ISO mês de referência
  aporteRegular: number;
  aportesExtras: number;
  rendimentoBruto: number;
  imposto: number;
  rendimentoLiquido: number;
  saldoAcumulado: number; // após rendimento e impostos do mês
  totalInvestido: number; // soma de tudo que entrou (sem rendimento)
};

// Calcula o índice do mês da simulação (1, 2, 3...) em que uma data de aporte cai,
// relativo ao mês de início. Retorna null se a data for anterior ou igual ao mês de início
// (aportes no mês 0 são descartados da simulação atualmente).
export function mesDaSimulacaoParaData(dataISO: string, inicio: Date): number | null {
  const d = new Date(dataISO + 'T12:00:00');
  const offset = (d.getFullYear() - inicio.getFullYear()) * 12 + (d.getMonth() - inicio.getMonth());
  return offset >= 1 ? offset : null;
}

export type SimResult = {
  meta: number;
  custosExtras: number;
  valorEntrada: number;
  faltava: number;
  rows: SimRow[];
  atingiuMeta: boolean;
  mesAtingiuMeta?: number;
  dataAtingiuMeta?: string;
  saldoFinal: number;
  totalInvestido: number;
  lucroLiquido: number;
  cenario: CenarioSimulacao;
  /** Populado apenas quando a meta não é atingida dentro de prazoMaxMeses */
  sugestoes?: Sugestoes;
};

export function calcularEntrada(valorImovel: number, percentualEntrada: number) {
  return (valorImovel * percentualEntrada) / 100;
}

export function calcularCustosExtras(valorImovel: number, percentualCustosExtras: number) {
  return (valorImovel * percentualCustosExtras) / 100;
}

export function calcularMeta(input: Pick<SimInput, "valorImovel" | "percentualEntrada" | "percentualCustosExtras">) {
  return calcularEntrada(input.valorImovel, input.percentualEntrada) + calcularCustosExtras(input.valorImovel, input.percentualCustosExtras);
}

// IR regressivo (renda fixa)
export function aliquotaIR(diasCorridos: number): number {
  if (diasCorridos <= 180) return 0.225;
  if (diasCorridos <= 360) return 0.20;
  if (diasCorridos <= 720) return 0.175;
  return 0.15;
}

// Para simplicidade pedagógica: aplicamos IR sobre o rendimento mensal usando a alíquota
// referente ao tempo decorrido desde o início do plano (modelo conservador, próximo de fundos DI com come-cotas + ajuste no resgate).
// Para um modelo mais fiel por aporte FIFO, refatorar futuramente.

export function taxaMensalEfetiva(taxaCdiAnual: number, percentualCdi: number) {
  const anual = (taxaCdiAnual / 100) * (percentualCdi / 100);
  return Math.pow(1 + anual, 1 / 12) - 1;
}

export function taxaMensalEfetivaPorTipoInvestimento(taxaCdiAnual: number, tipo?: string) {
  return taxaMensalEfetiva(taxaCdiAnual, percentualCdiPorTipoInvestimento(tipo));
}

export function taxaDiariaEfetivaPorTipoInvestimento(taxaCdiAnual: number, tipo?: string) {
  const anual = (taxaCdiAnual / 100) * (percentualCdiPorTipoInvestimento(tipo) / 100);
  if (anual <= 0) return 0;
  // Convenção padrão do mercado financeiro brasileiro: 252 dias úteis no ano
  return Math.pow(1 + anual, 1 / 252) - 1;
}

export function rendimentoEstimadoDiario(valor: number, taxaCdiAnual: number, tipo?: string) {
  if (valor <= 0) return 0;
  return valor * taxaDiariaEfetivaPorTipoInvestimento(taxaCdiAnual, tipo);
}

/**
 * Conta a quantidade de dias úteis (segunda a sexta-feira) entre duas datas.
 */
export function contarDiasUteis(dataInicio: Date | string, dataFim: Date | string): number {
  const d1 = typeof dataInicio === "string" ? new Date(dataInicio.includes("T") ? dataInicio : `${dataInicio}T12:00:00`) : new Date(dataInicio);
  const d2 = typeof dataFim === "string" ? new Date(dataFim.includes("T") ? dataFim : `${dataFim}T12:00:00`) : new Date(dataFim);

  if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime()) || d2 <= d1) return 0;

  let count = 0;
  const cur = new Date(d1);
  cur.setHours(12, 0, 0, 0);
  const end = new Date(d2);
  end.setHours(12, 0, 0, 0);

  while (cur < end) {
    cur.setDate(cur.getDate() + 1);
    const day = cur.getDay();
    if (day !== 0 && day !== 6) {
      count++;
    }
  }
  return count;
}

/**
 * Calcula o saldo composto acumulado a partir de um valor base, taxa e quantidade de dias úteis decorridos.
 * Saldo(t) = Saldo_0 * (1 + taxaDiaria)^dias
 */
export function calcularSaldoCompostoDiario(
  valorBase: number,
  diasUteis: number,
  taxaCdiAnual: number,
  tipo?: string
): { saldoAtualizado: number; rendimentoAcumulado: number; rendimentoNaqueleDia: number } {
  if (valorBase <= 0) {
    return { saldoAtualizado: 0, rendimentoAcumulado: 0, rendimentoNaqueleDia: 0 };
  }

  const taxaDiaria = taxaDiariaEfetivaPorTipoInvestimento(taxaCdiAnual, tipo);
  if (taxaDiaria <= 0 || diasUteis <= 0) {
    return {
      saldoAtualizado: valorBase,
      rendimentoAcumulado: 0,
      rendimentoNaqueleDia: valorBase * taxaDiaria,
    };
  }

  const saldoAtualizado = valorBase * Math.pow(1 + taxaDiaria, diasUteis);
  const rendimentoAcumulado = saldoAtualizado - valorBase;
  const rendimentoNaqueleDia = saldoAtualizado * taxaDiaria;

  return {
    saldoAtualizado,
    rendimentoAcumulado,
    rendimentoNaqueleDia,
  };
}

/**
 * Calcula a evolução do saldo e do rendimento dia a dia até hoje com base na data do saldo informado.
 */
export function calcularEvolucaoDiariaAteHoje(
  valorBase: number,
  dataReferencia: string | Date | null | undefined,
  taxaCdiAnual: number,
  tipo?: string
) {
  if (!dataReferencia || valorBase <= 0) {
    const rendimentoNaqueleDia = rendimentoEstimadoDiario(valorBase, taxaCdiAnual, tipo);
    return {
      saldoAtualizado: valorBase,
      rendimentoAcumulado: 0,
      rendimentoNaqueleDia,
      diasUteisDecorridos: 0,
    };
  }

  const hoje = new Date();
  const diasUteis = contarDiasUteis(dataReferencia, hoje);
  const resultado = calcularSaldoCompostoDiario(valorBase, diasUteis, taxaCdiAnual, tipo);

  return {
    ...resultado,
    diasUteisDecorridos: diasUteis,
  };
}

/**
 * Retorna marcos de projeção para demonstrar como o rendimento cresce dia a dia
 * devido aos juros compostos diários (ex: Hoje, 7 dias, 30 dias, 90 dias, 180 dias, 252 dias).
 */
export function gerarMarcosEvolucaoDiaria(
  valorBase: number,
  taxaCdiAnual: number,
  tipo?: string
) {
  const marcos = [
    { label: "Hoje (Início)", diasUteis: 0 },
    { label: "Em 7 dias úteis", diasUteis: 7 },
    { label: "Em 30 dias úteis", diasUteis: 30 },
    { label: "Em 60 dias úteis (~3 meses)", diasUteis: 60 },
    { label: "Em 126 dias úteis (~6 meses)", diasUteis: 126 },
    { label: "Em 252 dias úteis (1 ano)", diasUteis: 252 },
  ];

  return marcos.map((m) => {
    const { saldoAtualizado, rendimentoAcumulado, rendimentoNaqueleDia } =
      calcularSaldoCompostoDiario(valorBase, m.diasUteis, taxaCdiAnual, tipo);
    return {
      label: m.label,
      diasUteis: m.diasUteis,
      saldo: saldoAtualizado,
      rendimentoAcumulado,
      rendimentoNaqueleDia,
    };
  });
}

export type EvolucaoDiaItem = {
  dia: number;
  dataISO: string;
  diaSemana: string;
  isDiaUtil: boolean;
  saldoInicial: number;
  aporteRegular: number;
  aportesExtras: number;
  detalhesExtras: Array<{ origem: string; valor: number; pessoaNome?: string }>;
  totalAportesDoDia: number;
  saldoAposAporte: number;
  rendimentoDoDia: number;
  rendimentoAcumuladoAteDia: number;
  saldoFinal: number;
  isDiaAporteRegular: boolean;
};

export type EvolucaoMesResultado = {
  ano: number;
  mes: number;
  nomeMes: string;
  saldoInicialMes: number;
  totalAporteRegular: number;
  totalAportesExtras: number;
  totalAportesMes: number;
  totalRendimentoMes: number;
  saldoFinalMes: number;
  diasUteisTotais: number;
  diaAporteConfigurado: number;
  dias: EvolucaoDiaItem[];
};

/**
 * Calcula a evolução detalhada dia a dia de um mês específico,
 * considerando a data exata em que o aporte regular cai e eventuais aportes extras.
 */
export function calcularEvolucaoDiariaDoMes(params: {
  dataReferencia: string | Date;
  saldoInicialMes: number;
  aporteRegular: number;
  diaAporteRegular?: number;
  aportesExtras?: Array<{ data?: string; valor: number; origem?: string; pessoaNome?: string }>;
  taxaCdiAnual: number;
  tipoInvestimento?: string;
}): EvolucaoMesResultado {
  const dRef = typeof params.dataReferencia === "string" 
    ? new Date(params.dataReferencia.includes("T") ? params.dataReferencia : `${params.dataReferencia}T12:00:00Z`)
    : new Date(params.dataReferencia);

  const ano = dRef.getUTCFullYear() || new Date().getUTCFullYear();
  const mesIndex = !Number.isNaN(dRef.getUTCMonth()) ? dRef.getUTCMonth() : new Date().getUTCMonth();
  const mesNum = mesIndex + 1;

  const diasNoMes = new Date(Date.UTC(ano, mesNum, 0)).getUTCDate();
  const diaAporteConfigurado = Math.min(Math.max(1, params.diaAporteRegular ?? 5), diasNoMes);

  const diasSemanaNomes = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const mesesNomes = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const taxaDiaria = taxaDiariaEfetivaPorTipoInvestimento(params.taxaCdiAnual, params.tipoInvestimento);

  let saldoAtual = Math.max(0, params.saldoInicialMes || 0);
  let totalRendimentoMes = 0;
  let totalAportesExtrasMes = 0;
  let diasUteisTotais = 0;

  const dias: EvolucaoDiaItem[] = [];

  for (let dia = 1; dia <= diasNoMes; dia++) {
    const dataDia = new Date(Date.UTC(ano, mesIndex, dia, 12, 0, 0));
    const diaSemanaIdx = dataDia.getUTCDay();
    const diaSemana = diasSemanaNomes[diaSemanaIdx];
    const isDiaUtil = diaSemanaIdx >= 1 && diaSemanaIdx <= 5;
    if (isDiaUtil) diasUteisTotais++;

    const diaIso = `${ano}-${String(mesNum).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    const isDiaAporteRegular = dia === diaAporteConfigurado;
    const aporteReg = isDiaAporteRegular ? Math.max(0, params.aporteRegular || 0) : 0;

    const extrasDesteDia = (params.aportesExtras || []).filter(e => {
      if (!e.data) return false;
      const iso = e.data.split("T")[0];
      return iso === diaIso || iso.endsWith(`-${String(dia).padStart(2, "0")}`);
    });

    const somaExtrasDia = extrasDesteDia.reduce((s, e) => s + (Number(e.valor) || 0), 0);
    totalAportesExtrasMes += somaExtrasDia;

    const totalAportesDoDia = aporteReg + somaExtrasDia;
    const saldoInicial = saldoAtual;
    const saldoAposAporte = saldoInicial + totalAportesDoDia;

    const rendimentoDoDia = isDiaUtil && saldoAposAporte > 0 ? saldoAposAporte * taxaDiaria : 0;
    totalRendimentoMes += rendimentoDoDia;

    const saldoFinal = saldoAposAporte + rendimentoDoDia;
    saldoAtual = saldoFinal;

    dias.push({
      dia,
      dataISO: diaIso,
      diaSemana,
      isDiaUtil,
      saldoInicial,
      aporteRegular: aporteReg,
      aportesExtras: somaExtrasDia,
      detalhesExtras: extrasDesteDia.map(e => ({
        origem: e.origem || "Aporte Extra",
        valor: Number(e.valor) || 0,
        pessoaNome: e.pessoaNome,
      })),
      totalAportesDoDia,
      saldoAposAporte,
      rendimentoDoDia,
      rendimentoAcumuladoAteDia: totalRendimentoMes,
      saldoFinal,
      isDiaAporteRegular,
    });
  }

  return {
    ano,
    mes: mesNum,
    nomeMes: `${mesesNomes[mesIndex]}/${ano}`,
    saldoInicialMes: params.saldoInicialMes,
    totalAporteRegular: params.aporteRegular,
    totalAportesExtras: totalAportesExtrasMes,
    totalAportesMes: params.aporteRegular + totalAportesExtrasMes,
    totalRendimentoMes,
    saldoFinalMes: saldoAtual,
    diasUteisTotais,
    diaAporteConfigurado,
    dias,
  };
}

export function rendimentoEstimadoMensal(valor: number, taxaCdiAnual: number, tipo?: string) {
  return valor * taxaMensalEfetivaPorTipoInvestimento(taxaCdiAnual, tipo);
}

export function rendimentoEstimadoAnual(valor: number, taxaCdiAnual: number, tipo?: string) {
  const mensal = taxaMensalEfetivaPorTipoInvestimento(taxaCdiAnual, tipo);
  return valor * (Math.pow(1 + mensal, 12) - 1);
}

export function percentualCdiPorTipoInvestimento(tipo?: string) {
  switch (tipo) {
    case "poupanca":
      return 70;
    case "conta_corrente":
      return 25;
    case "cdb_100":
    case "tesouro_selic":
    case "fundo_di":
    case "lci_lca":
      return 100;
    case "cdb_120":
      return 120;
    default:
      return 100;
  }
}

export function nomeTipoInvestimento(tipo?: string) {
  switch (tipo) {
    case "poupanca":
      return "Poupança";
    case "conta_corrente":
      return "Conta Corrente";
    case "cdb_100":
      return "CDB / Renda Fixa";
    case "cdb_120":
      return "CDB 120% CDI";
    case "lci_lca":
      return "LCI / LCA";
    case "tesouro_selic":
      return "Tesouro Selic";
    case "fundo_di":
      return "Fundo DI";
    default:
      return "Investimento";
  }
}

export function taxaCdiAnualEstimadoPorTipo(tipo: string | undefined, taxaCdiAnual = 10.5) {
  return (taxaCdiAnual * percentualCdiPorTipoInvestimento(tipo)) / 100;
}

export function totalMesMaisRendimentoLiquido(totalMes: number, rendimentoLiquido: number) {
  return totalMes + rendimentoLiquido;
}

export function simular(input: SimInput): SimResult {
  const cenario: CenarioSimulacao = input.cenario ?? "realista";
  const taxaCdiEfetiva = Math.max(0, input.taxaCdiAnual + CENARIO_CDI_DELTA[cenario]);
  const meta = calcularMeta(input);
  const custosExtras = calcularCustosExtras(input.valorImovel, input.percentualCustosExtras);
  const valorEntrada = calcularEntrada(input.valorImovel, input.percentualEntrada);
  const faltava = Math.max(0, meta - input.valorJaGuardado);
  const taxaMes = taxaMensalEfetiva(taxaCdiEfetiva, input.percentualCdi);
  const padding = input.mesesExtrasAposMeta ?? 6;
  let prazoMax = (input.prazoMaxMeses ?? 600) + padding;
  let inicio: Date;
  if (typeof input.dataInicio === 'string' && input.dataInicio) {
    inicio = new Date(input.dataInicio + 'T12:00:00');
  } else if (input.dataInicio instanceof Date) {
    inicio = input.dataInicio;
  } else {
    inicio = new Date();
  }
  if (isNaN(inicio.getTime())) {
    inicio = new Date();
  }

  const extrasPorMes = new Map<number, number>();
  let extrasMes0 = 0;
  for (const a of input.aportesExtras) {
    const mesOffset = mesDaSimulacaoParaData(a.data, inicio);
    if (mesOffset !== null) {
      const existing = extrasPorMes.get(mesOffset) ?? 0;
      extrasPorMes.set(mesOffset, existing + a.valor);
    } else {
      extrasMes0 += a.valor;
    }
  }

  const checkpoints = input.checkpoints ?? [];
  const saldoTeoricoSubstituido = checkpoints.reduce((sum, checkpoint) => sum + checkpoint.valorInicial, 0);
  const saldoSemCheckpoints = input.valorJaGuardado - saldoTeoricoSubstituido;
  const checkpointsAtivos = checkpoints.filter((checkpoint) => monthKey(checkpoint.dataValorAtual) <= monthKey(inicio));
  let saldo = saldoSemCheckpoints + checkpointsAtivos.reduce((sum, checkpoint) => sum + checkpoint.valorAtual, 0) + extrasMes0;
  let totalInvestido = saldo;
  const rows: SimRow[] = [];
  let atingiuMeta = false;
  let mesAtingiu: number | undefined;
  let dataAtingiu: string | undefined;



  // Registro inicial (Mês 0) – exibe o saldo ao início do plano
  const startOfMonth = new Date(inicio.getFullYear(), inicio.getMonth(), 1);
  const safeStartIso = isNaN(startOfMonth.getTime()) ? new Date().toISOString() : startOfMonth.toISOString();
  rows.push({
    mes: 0,
    data: safeStartIso,
    aporteRegular: 0,
    aportesExtras: 0,
    rendimentoBruto: 0,
    imposto: 0,
    rendimentoLiquido: 0,
    saldoAcumulado: saldo,
    totalInvestido,
  });

  if (saldo >= meta) {
    atingiuMeta = true;
    mesAtingiu = 0;
    dataAtingiu = safeStartIso;
  }

  for (let mes = 1; mes <= prazoMax; mes++) {
    const dataRef = new Date(inicio.getFullYear(), inicio.getMonth() + mes, 1);
    const dataRefIso = monthKey(dataRef);
    for (const checkpoint of checkpoints) {
      if (monthKey(checkpoint.dataValorAtual) === dataRefIso) {
        saldo += checkpoint.valorAtual;
        totalInvestido += checkpoint.valorAtual;
      }
    }

    const defaultAporte = input.aporteMensalTotal;
    const aporteRegular = input.aportesRegularesEditados?.[mes] ?? defaultAporte;
    const aportesExtras = extrasPorMes.get(mes) ?? 0;
    saldo += aporteRegular + aportesExtras;
    totalInvestido += aporteRegular + aportesExtras;

    const rendimentoBruto = saldo * taxaMes;
    const dias = mes * 30;
    const ir = aliquotaIR(dias);
    const imposto = rendimentoBruto * ir;
    const rendimentoLiquido = rendimentoBruto - imposto;
    saldo += rendimentoLiquido;

    rows.push({
      mes,
      data: dataRef.toISOString(),
      aporteRegular,
      aportesExtras,
      rendimentoBruto,
      imposto,
      rendimentoLiquido,
      saldoAcumulado: saldo,
      totalInvestido,
    });

    // Registra quando a meta foi atingida
    if (!atingiuMeta && saldo >= meta) {
      atingiuMeta = true;
      mesAtingiu = mes;
      dataAtingiu = dataRef.toISOString();
      if (padding === 0) {
        prazoMax = mes;
      }
    }
  }


  // ── Sugestões quando a meta não é atingida no prazo ──
  let sugestoes: Sugestoes | undefined;
  if (!input.pularSugestoes && !atingiuMeta && input.prazoMaxMeses && input.prazoMaxMeses > 0 && input.prazoMaxMeses < 600) {
    // 1. Aporte adicional necessário para cumprir o prazo atual
    const aporteNecessario = aporteNecessarioParaPrazo({
      ...input,
      cenario: "realista",
      taxaCdiAnual: taxaCdiEfetiva,
      prazoMeses: input.prazoMaxMeses,
    });
    const aumentoAporteNecessario = Math.max(0, aporteNecessario - input.aporteMensalTotal);

    // 2. Em quantos meses a meta seria atingida com o aporte atual
    const simSemPrazo = simular({ ...input, cenario, prazoMaxMeses: 600, mesesExtrasAposMeta: 0, pularSugestoes: true });
    const novoPrazoNecessarioMeses = simSemPrazo.mesAtingiuMeta ?? 600;

    // 3. Qual valor de imóvel se encaixa no prazo + aporte atual
    // Busca binária: diminui valorImovel até que a meta seja atingida no prazo
    const prazo = input.prazoMaxMeses;
    let loV = 0;
    let hiV = input.valorImovel;
    for (let i = 0; i < 50; i++) {
      const midV = (loV + hiV) / 2;
      const t = simular({ ...input, cenario, valorImovel: midV, prazoMaxMeses: prazo, mesesExtrasAposMeta: 0, pularSugestoes: true });
      if (t.atingiuMeta) hiV = midV; else loV = midV;
    }
    const reducaoImovelNecessaria = Math.max(0, input.valorImovel - Math.floor(hiV));

    sugestoes = { aumentoAporteNecessario, novoPrazoNecessarioMeses, reducaoImovelNecessaria };
  }

  return {
    meta,
    custosExtras,
    valorEntrada,
    faltava,
    rows,
    atingiuMeta,
    mesAtingiuMeta: mesAtingiu,
    dataAtingiuMeta: dataAtingiu,
    saldoFinal: rows[rows.length - 1]?.saldoAcumulado ?? input.valorJaGuardado,
    totalInvestido: rows[rows.length - 1]?.totalInvestido ?? input.valorJaGuardado,
    lucroLiquido: (rows[rows.length - 1]?.saldoAcumulado ?? input.valorJaGuardado) - (rows[rows.length - 1]?.totalInvestido ?? input.valorJaGuardado),
    cenario,
    sugestoes,
  };
}

function monthKey(value: string | Date): string {
  if (value instanceof Date) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
  }
  return value.slice(0, 7);
}

// Diferença em meses (arredondando) entre duas datas ISO (YYYY-MM-DD).
export function mesesEntre(inicioISO: string, fimISO: string): number {
  const [inicioAno, inicioMes] = inicioISO.split("-").map(Number);
  const [fimAno, fimMes] = fimISO.split("-").map(Number);
  if (!inicioAno || !inicioMes || !fimAno || !fimMes) return 1;

  const m = (fimAno - inicioAno) * 12 + (fimMes - inicioMes);
  return Math.max(1, m);
}

// Calcula em quantos meses o usuário atinge a meta dado o aporte total.
export function mesesParaMeta(input: Omit<SimInput, "prazoMaxMeses">): number | null {
  const r = simular({ ...input, prazoMaxMeses: 600, mesesExtrasAposMeta: 0, pularSugestoes: true });
  return r.mesAtingiuMeta ?? null;
}

// Calcula o aporte mensal necessário para atingir a meta em N meses (busca binária).
export function aporteNecessarioParaPrazo(input: Omit<SimInput, "aporteMensalTotal" | "prazoMaxMeses"> & { prazoMeses: number }): number {
  const meta = calcularMeta(input);
  if (input.valorJaGuardado >= meta) return 0;
  let lo = 0;
  let hi = Math.max(meta, 1);
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const r = simular({ ...input, aporteMensalTotal: mid, prazoMaxMeses: input.prazoMeses, mesesExtrasAposMeta: 0, pularSugestoes: true });
    const final = r.rows[r.rows.length - 1]?.saldoAcumulado ?? 0;
    if (final >= meta) hi = mid; else lo = mid;
  }
  return Math.ceil(hi);
}

export const brl = (n: number | undefined | null) =>
  (n ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });