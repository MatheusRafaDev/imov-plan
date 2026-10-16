import { expect, test, describe } from 'vitest';
import { 
  calcularMeta, 
  simular, 
  aporteNecessarioParaPrazo, 
  mesesParaMeta, 
  aliquotaIR, 
  totalMesMaisRendimentoLiquido, 
  rendimentoEstimadoDiario, 
  taxaDiariaEfetivaPorTipoInvestimento,
  contarDiasUteis,
  calcularSaldoCompostoDiario,
  gerarMarcosEvolucaoDiaria
} from './finance';

describe('finance.ts unit tests', () => {
  test('calcularMeta', () => {
    expect(calcularMeta({ valorImovel: 300000, percentualEntrada: 20, percentualCustosExtras: 5 })).toBe(75000);
    expect(calcularMeta({ valorImovel: 500000, percentualEntrada: 10, percentualCustosExtras: 0 })).toBe(50000);
  });

  test('aliquotaIR', () => {
    expect(aliquotaIR(1)).toBe(0.225);
    expect(aliquotaIR(180)).toBe(0.225);
    expect(aliquotaIR(181)).toBe(0.20);
    expect(aliquotaIR(360)).toBe(0.20);
    expect(aliquotaIR(361)).toBe(0.175);
    expect(aliquotaIR(720)).toBe(0.175);
    expect(aliquotaIR(721)).toBe(0.15);
  });

  test('mesesParaMeta', () => {
    // 75000 meta, 0 guardado, 1500 por mes, 0 taxa -> 50 meses
    expect(mesesParaMeta({
        valorImovel: 300000,
        percentualEntrada: 20,
        percentualCustosExtras: 5,
        valorJaGuardado: 0,
        aporteMensalTotal: 1500,
        taxaCdiAnual: 0,
        percentualCdi: 100,
        aportesExtras: [],
        dataInicio: new Date()
    })).toBe(50);
  });

  test('aporteNecessarioParaPrazo', () => {
    // 75000 meta, 0 guardado, prazo 50 meses, 0 taxa -> 1500
    expect(aporteNecessarioParaPrazo({
        valorImovel: 300000,
        percentualEntrada: 20,
        percentualCustosExtras: 5,
        valorJaGuardado: 0,
        taxaCdiAnual: 0,
        percentualCdi: 100,
        aportesExtras: [],
        dataInicio: new Date(),
        prazoMeses: 50
    })).toBe(1500);
  });
  
  test('simular (sem aportes extras, 0 juros)', () => {
    const res = simular({
        valorImovel: 300000,
        percentualEntrada: 20,
        percentualCustosExtras: 5,
        valorJaGuardado: 0,
        aporteMensalTotal: 1500,
        taxaCdiAnual: 0, 
        percentualCdi: 100,
        aportesExtras: [],
        prazoMaxMeses: 360,
        dataInicio: new Date()
    });
    
    expect(res.meta).toBe(75000);
    expect(res.atingiuMeta).toBe(true);
    expect(res.mesAtingiuMeta).toBe(50); // 50 * 1500 = 75000
    // Como a simulação estende 6 meses a partir da meta, o prazo simulado foi 56.
    expect(res.totalInvestido).toBe(549000); 
    expect(res.saldoFinal).toBe(549000);
  });

  test('totalMesMaisRendimentoLiquido soma contribuição e rendimento líquido', () => {
    expect(totalMesMaisRendimentoLiquido(28600, 4050.52)).toBe(32650.52);
  });

  test('simular com mesesExtrasAposMeta: 0 não estende o prazo', () => {
    const res = simular({
        valorImovel: 300000,
        percentualEntrada: 20,
        percentualCustosExtras: 5,
        valorJaGuardado: 0,
        aporteMensalTotal: 1500,
        taxaCdiAnual: 0, 
        percentualCdi: 100,
        aportesExtras: [],
        prazoMaxMeses: 360,
        mesesExtrasAposMeta: 0,
        dataInicio: new Date()
    });
    
    // A meta é batida no mês 50. Como padding é 0, o prazo maximo final vira min(360, 50+0) = 50.
    // O loop for vai até <= prazoMax. Com prazoMax = 50, ele terá as linhas de 0 até 50 (51 linhas).
    expect(res.rows.length).toBe(51); 
    expect(res.rows[res.rows.length - 1]?.mes).toBe(50);
  });

  test('aportes extras: offset de meses e mês 0', () => {
    const dataInicio = new Date("2026-07-01T12:00:00");
    const res = simular({
        valorImovel: 100000,
        percentualEntrada: 10,
        percentualCustosExtras: 0,
        valorJaGuardado: 1000,
        aporteMensalTotal: 0,
        taxaCdiAnual: 0, 
        percentualCdi: 100,
        prazoMaxMeses: 5,
        mesesExtrasAposMeta: 0,
        dataInicio: dataInicio,
        aportesExtras: [
          { data: "2026-06-15", valor: 100, origem: "Mesmo mês, antes" },
          { data: "2026-07-15", valor: 200, origem: "Mesmo mês" },
          { data: "2026-08-05", valor: 300, origem: "Mês 1" },
          { data: "2026-09-01", valor: 400, origem: "Mês 2" },
          { data: "2026-10-31", valor: 500, origem: "Mês 3" },
        ]
    });

    // Mês 0 (Jul 2026 e Junho 2026, offset <= 0): caem no start e se somam ao saldo inicial
    expect(res.rows[0]?.saldoAcumulado).toBe(1000 + 100 + 200); // 1300
    // Mês 1 (Ago 2026): recebe 300
    expect(res.rows[1]?.aportesExtras).toBe(300);
    // Mês 2 (Set 2026): recebe 400
    expect(res.rows[2]?.aportesExtras).toBe(400);
    // Mês 3 (Out 2026): recebe 500
    expect(res.rows[3]?.aportesExtras).toBe(500);
  });

  test('checkpoint substitui o saldo teórico a partir do mês informado', () => {
    const res = simular({
      valorImovel: 100000,
      percentualEntrada: 10,
      percentualCustosExtras: 0,
      valorJaGuardado: 1000,
      aporteMensalTotal: 0,
      taxaCdiAnual: 0,
      percentualCdi: 100,
      aportesExtras: [],
      prazoMaxMeses: 3,
      mesesExtrasAposMeta: 0,
      dataInicio: new Date("2026-07-01T12:00:00"),
      checkpoints: [{ valorInicial: 1000, valorAtual: 2500, dataValorAtual: "2026-08-15" }],
    });

    expect(res.rows[0]?.saldoAcumulado).toBe(0);
    expect(res.rows[1]?.saldoAcumulado).toBe(2500);
    expect(res.rows[2]?.saldoAcumulado).toBe(2500);
  });

  test('rendimentoEstimadoDiario e taxaDiariaEfetivaPorTipoInvestimento', () => {
    // CDB 100% CDI com taxa 10.5% a.a. sobre 25.000
    const taxaDiaria = taxaDiariaEfetivaPorTipoInvestimento(10.5, 'cdb_100');
    expect(taxaDiaria).toBeGreaterThan(0.00039);
    expect(taxaDiaria).toBeLessThan(0.00041);

    const rendimentoDia = rendimentoEstimadoDiario(25000, 10.5, 'cdb_100');
    // 25.000 * 0.0003964 ~= 9.91
    expect(rendimentoDia).toBeGreaterThan(9.5);
    expect(rendimentoDia).toBeLessThan(10.5);

    // Saldo zerado retorna 0
    expect(rendimentoEstimadoDiario(0, 10.5, 'cdb_100')).toBe(0);
  });

  test('contarDiasUteis conta apenas dias de semana', () => {
    // 2026-10-12 (segunda) até 2026-10-16 (sexta) = 4 dias úteis
    expect(contarDiasUteis('2026-10-12', '2026-10-16')).toBe(4);
    // Sexta para segunda = 1 dia útil (apenas a segunda)
    expect(contarDiasUteis('2026-10-16', '2026-10-19')).toBe(1);
    // Data invertida ou igual
    expect(contarDiasUteis('2026-10-16', '2026-10-16')).toBe(0);
  });

  test('calcularSaldoCompostoDiario e gerarMarcosEvolucaoDiaria', () => {
    // 25.000 a 10.5% CDI por 30 dias úteis
    const res = calcularSaldoCompostoDiario(25000, 30, 10.5, 'cdb_100');
    expect(res.saldoAtualizado).toBeGreaterThan(25000);
    expect(res.rendimentoAcumulado).toBeGreaterThan(250);
    // O rendimento diário no dia 30 é maior do que no dia 0
    const rendInicial = rendimentoEstimadoDiario(25000, 10.5, 'cdb_100');
    expect(res.rendimentoNaqueleDia).toBeGreaterThan(rendInicial);

    // Marcos de evolução
    const marcos = gerarMarcosEvolucaoDiaria(25000, 10.5, 'cdb_100');
    expect(marcos.length).toBe(6);
    expect(marcos[0].saldo).toBe(25000);
    expect(marcos[5].saldo).toBeGreaterThan(27000);
    // Cada marco tem rendimento naquele ponto estritamente crescente
    for (let i = 1; i < marcos.length; i++) {
      expect(marcos[i].rendimentoNaqueleDia).toBeGreaterThan(marcos[i - 1].rendimentoNaqueleDia);
      expect(marcos[i].saldo).toBeGreaterThan(marcos[i - 1].saldo);
    }
  });
});
