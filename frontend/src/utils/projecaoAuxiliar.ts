/**
 * projecaoAuxiliar.ts
 *
 * Projeção complementar de data estimada para atingir a meta.
 * Só é executada quando atingiuMeta = false.
 *
 * Regras:
 * - Reutiliza os mesmos parâmetros retornados pela API (taxa CDI, % CDI, aporte mensal).
 * - Aportes extras NÃO são incluídos na projeção — são pontuais e imprevisíveis.
 *   Incluí-los tornaria a estimativa otimista demais.
 * - Limite de 600 meses (~50 anos) para evitar loop infinito.
 * - A alíquota de IR segue a tabela regressiva brasileira para renda fixa,
 *   exatamente como o backend faz.
 */

import type { BackendSimulacaoResult } from "@/services/SimulacaoService";

export type ProjecaoResult =
  | { tipo: "atingiu" }
  | { tipo: "estimativa"; data: string; mesesExtras: number }
  | { tipo: "impossivel" };

const MAX_MESES = 600;

/** Alíquota IR regressiva para renda fixa (tabela brasileira). */
function aliquotaIR(prazoMesesTotal: number): number {
  if (prazoMesesTotal <= 6) return 0.225;
  if (prazoMesesTotal <= 12) return 0.2;
  if (prazoMesesTotal <= 24) return 0.175;
  return 0.15;
}

/**
 * Projeta mês a mês, a partir do saldo final da simulação,
 * até atingir a meta ou esgotar o limite de segurança.
 *
 * @param result - Resultado bruto da API de simulação
 * @returns ProjecaoResult com o tipo e a data estimada (se aplicável)
 */
export function projetarDataMeta(
  result: BackendSimulacaoResult | null
): ProjecaoResult {
  if (!result) return { tipo: "impossivel" };

  // Se o backend já reportou que atingiu, não há nada a projetar
  if (result.atingiuMeta) return { tipo: "atingiu" };

  const { totalNecessario, totalAcumulado, aporteMensalTotal, taxaCdiAnual, percentualCdi } =
    result;

  // Se não há aportes E o saldo já está abaixo da meta, nunca atingirá
  if (aporteMensalTotal <= 0 && totalAcumulado < totalNecessario) {
    return { tipo: "impossivel" };
  }

  // Taxa mensal equivalente: (1 + CDI_anual * percentual_CDI / 10000)^(1/12) - 1
  const taxaAnualDecimal = (taxaCdiAnual * percentualCdi) / 10000;
  const taxaMensal = Math.pow(1 + taxaAnualDecimal, 1 / 12) - 1;

  // Prazo já decorrido na simulação (para aplicar IR correto na continuação)
  const mesesJaSimulados = result.detalhesMensais?.length ?? 0;

  let saldo = totalAcumulado;
  let mesesExtras = 0;

  // Ponto de partida: último mês da simulação
  const dataBase = result.dataPrevistaAlvo
    ? new Date(result.dataPrevistaAlvo)
    : new Date();

  for (let i = 1; i <= MAX_MESES; i++) {
    const prazoTotal = mesesJaSimulados + i;
    const rendimentoBruto = saldo * taxaMensal;
    const aliquota = aliquotaIR(prazoTotal);
    const imposto = rendimentoBruto * aliquota;
    const rendimentoLiquido = rendimentoBruto - imposto;

    saldo = saldo + aporteMensalTotal + rendimentoLiquido;
    mesesExtras = i;

    if (saldo >= totalNecessario) {
      // Calcula a data do mês atingido
      const dataEstimada = new Date(dataBase);
      dataEstimada.setMonth(dataEstimada.getMonth() + i);

      return {
        tipo: "estimativa",
        // Formato ISO para ser compatível com formatDate()
        data: dataEstimada.toISOString(),
        mesesExtras,
      };
    }
  }

  return { tipo: "impossivel" };
}
