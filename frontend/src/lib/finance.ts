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

export type SimInput = {
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
  dataInicio?: Date;
  tipoInvestimento?: string; // ex "poupanca", "cdb_100", "tesouro_selic"
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

export function simular(input: SimInput): SimResult {
  const meta = calcularMeta(input);
  const custosExtras = calcularCustosExtras(input.valorImovel, input.percentualCustosExtras);
  const valorEntrada = calcularEntrada(input.valorImovel, input.percentualEntrada);
  const faltava = Math.max(0, meta - input.valorJaGuardado);
  const taxaMes = taxaMensalEfetiva(input.taxaCdiAnual, input.percentualCdi);
  let prazoMax = (input.prazoMaxMeses ?? 600) + 6; // Sempre adiciona 6 meses extras ao planejamento
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
  for (const a of input.aportesExtras) {
    const d = new Date(a.data + 'T12:00:00');
    const mesOffset = (d.getFullYear() - inicio.getFullYear()) * 12 + (d.getMonth() - inicio.getMonth());
    if (mesOffset >= 1) {
      const existing = extrasPorMes.get(mesOffset) ?? 0;
      extrasPorMes.set(mesOffset, existing + a.valor);
    }
  }

  let saldo = input.valorJaGuardado;
  let totalInvestido = input.valorJaGuardado;
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

    const dataRef = new Date(inicio.getFullYear(), inicio.getMonth() + mes, 1);

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

    // Registra quando a meta foi atingida e continua o loop por mais 6 meses
    if (!atingiuMeta && saldo >= meta) {
      atingiuMeta = true;
      mesAtingiu = mes;
      dataAtingiu = dataRef.toISOString();
      prazoMax = Math.min(prazoMax, mes + 6);
    }
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
  };
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
  const r = simular({ ...input, prazoMaxMeses: 600 });
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
    const r = simular({ ...input, aporteMensalTotal: mid, prazoMaxMeses: input.prazoMeses });
    const final = r.rows[r.rows.length - 1]?.saldoAcumulado ?? 0;
    if (final >= meta) hi = mid; else lo = mid;
  }
  return Math.ceil(hi);
}

export const brl = (n: number | undefined | null) =>
  (n ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });