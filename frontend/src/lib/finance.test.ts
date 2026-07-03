import { expect, test, describe } from 'vitest';
import { calcularMeta, simular, aporteNecessarioParaPrazo, mesesParaMeta, aliquotaIR, totalMesMaisRendimentoLiquido } from './finance';

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
    expect(res.totalInvestido).toBe(84000); 
    expect(res.saldoFinal).toBe(84000);
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
});
