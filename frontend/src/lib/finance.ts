// Lógica financeira — pura, testável, sem React.
// Convenções: valores em BRL, taxas em % a.a.

export type Aporte = {
  data: string; // ISO
  valor: number;
  origem: string;
  pessoaNome?: string;
};

export type SimInput = {
  valorImovel: number;
  percentualEntrada: number; // ex 20
  percentualCustosExtras: number; // ex 5 (ITBI+escritura+registro estimado)
  valorJaGuardado: number;
  aporteMensalTotal: number; // soma dos aportes do casal
  taxaCdiAnual: number; // ex 13.65 (%)
  percentualCdi: number; // ex 100 (% do CDI que o investimento rende)
  aportesExtras: Aporte[]; // datados
  prazoMaxMeses?: number; // limite p/ busca, default 600
  dataInicio?: Date;
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

export function simular(input: SimInput): SimResult {
  const meta = calcularMeta(input);
  const custosExtras = calcularCustosExtras(input.valorImovel, input.percentualCustosExtras);
  const valorEntrada = calcularEntrada(input.valorImovel, input.percentualEntrada);
  const faltava = Math.max(0, meta - input.valorJaGuardado);
  const taxaMes = taxaMensalEfetiva(input.taxaCdiAnual, input.percentualCdi);
  const prazoMax = input.prazoMaxMeses ?? 600;
  const inicio = input.dataInicio ?? new Date();

  const extrasPorMes = new Map<number, number>();
  for (const a of input.aportesExtras) {
    const d = new Date(a.data);
    const mesOffset = (d.getFullYear() - inicio.getFullYear()) * 12 + (d.getMonth() - inicio.getMonth()) + 1;
    if (mesOffset >= 1) extrasPorMes.set(mesOffset, (extrasPorMes.get(mesOffset) ?? 0) + a.valor);
  }

  let saldo = input.valorJaGuardado;
  let totalInvestido = input.valorJaGuardado;
  const rows: SimRow[] = [];
  let atingiuMeta = false;
  let mesAtingiu: number | undefined;
  let dataAtingiu: string | undefined;

  for (let mes = 1; mes <= prazoMax; mes++) {
    const aporteRegular = input.aporteMensalTotal;
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

    if (!atingiuMeta && saldo >= meta) {
      atingiuMeta = true;
      mesAtingiu = mes;
      dataAtingiu = dataRef.toISOString();
      // Para a simulação assim que atinge a meta da entrada
      break;
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
  const a = new Date(inicioISO);
  const b = new Date(fimISO);
  const m = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
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
