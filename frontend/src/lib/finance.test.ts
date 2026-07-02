import { expect, test, describe } from 'vitest';
import { calcularMeta, simular, aporteNecessarioParaPrazo, mesesParaMeta, aliquotaIR } from './finance';

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
    })).toBe(1340);
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
});
