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
  gerarMarcosEvolucaoDiaria,
  calcularEvolucaoDiariaDoMes,
  mesesEntre,
  formatBrlCompact
} from './finance';

describe('finance.ts unit tests', () => {
  test('prazo de setembro a julho mantém julho quando a meta é atingida antes', () => {
    const prazo = mesesEntre('2026-09-01', '2027-07-01');
    const resultado = simular({
      valorImovel: 150000,
      percentualEntrada: 100,
      percentualCustosExtras: 0,
      valorJaGuardado: 0,
      aporteMensalTotal: 50000,
      taxaCdiAnual: 0,
      percentualCdi: 100,
      aportesExtras: [],
      prazoMaxMeses: prazo,
      respeitarPrazoMaximo: true,
      dataInicio: new Date('2026-09-01T12:00:00'),
    });

    expect(prazo).toBe(10);
    expect(resultado.mesAtingiuMeta).toBe(3);
    expect(resultado.rows).toHaveLength(11);
    expect(resultado.rows.at(-1)?.data.slice(0, 7)).toBe('2027-07');
  });

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
    // Sem a opção de manter o prazo, a simulação mostra seis meses após a meta.
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
    
    // A meta é atingida no mês 50; com padding zero, a simulação para nesse mês.
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

    // Mês 0 (Jul 2026, offset === 0): aporte de 200 é computado no Mês 0; Junho 2026 é anterior ao início do plano e descartado.
    expect(res.rows[0]?.aportesExtras).toBe(200);
    expect(res.rows[0]?.saldoAcumulado).toBe(1000 + 200); // 1200
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

  test('calcularEvolucaoDiariaDoMes com data e dia do aporte', () => {
    const res = calcularEvolucaoDiariaDoMes({
      dataReferencia: '2026-10-01',
      saldoInicialMes: 25000,
      aporteRegular: 3320,
      diaAporteRegular: 5,
      taxaCdiAnual: 10.5,
      tipoInvestimento: 'cdb_100',
    });

    expect(res.dias.length).toBe(31);
    expect(res.ano).toBe(2026);
    expect(res.mes).toBe(10);
    expect(res.saldoInicialMes).toBe(25000);
    expect(res.totalAporteRegular).toBe(3320);
    expect(res.diaAporteConfigurado).toBe(5);

    // O aporte de 3320 deve entrar exatamente no dia 5
    const dia5 = res.dias.find(d => d.dia === 5)!;
    expect(dia5.isDiaAporteRegular).toBe(true);
    expect(dia5.aporteRegular).toBe(3320);
    expect(dia5.totalAportesDoDia).toBe(3320);

    // Dias antes do dia 5 não tiveram aporte
    const dia1 = res.dias.find(d => d.dia === 1)!;
    expect(dia1.aporteRegular).toBe(0);

    // Rendimento total do mês deve ser positivo e saldo final deve ser superior à soma inicial + aporte
    expect(res.totalRendimentoMes).toBeGreaterThan(0);
    expect(res.saldoFinalMes).toBeGreaterThan(25000 + 3320);
    expect(res.diasUteisTotais).toBeGreaterThanOrEqual(20);

    // Fins de semana têm rendimento 0
    const fimDeSemana = res.dias.find(d => !d.isDiaUtil)!;
    expect(fimDeSemana.rendimentoDoDia).toBe(0);
  });

  test('calcularEvolucaoDiariaDoMes calcula saldo acumulado até o dia 16 com precisão', () => {
    const res = calcularEvolucaoDiariaDoMes({
      dataReferencia: '2026-10-01',
      saldoInicialMes: 43000,
      aporteRegular: 3320,
      diaAporteRegular: 5,
      taxaCdiAnual: 10.5,
      tipoInvestimento: 'cdb_100',
    });

    const dia16 = res.dias.find(d => d.dia === 16)!;
    expect(dia16).toBeDefined();
    // Saldo no dia 16 já inclui o aporte do dia 5 + rendimento dos dias úteis decorridos
    expect(dia16.saldoFinal).toBeGreaterThan(43000 + 3320);
    expect(dia16.saldoFinal).toBeLessThan(res.saldoFinalMes);
  });

  test('calcularEvolucaoDiariaDoMes com aportes de múltiplos participantes em dias diferentes', () => {
    const res = calcularEvolucaoDiariaDoMes({
      dataReferencia: '2026-10-01',
      saldoInicialMes: 43000,
      aporteRegular: 3320,
      taxaCdiAnual: 10.5,
      tipoInvestimento: 'cdb_100',
      aportesParticipantes: [
        { pessoaId: '1', pessoaNome: 'Matheus', valor: 2520, diaAporte: 5 },
        { pessoaId: '2', pessoaNome: 'Rayane', valor: 800, diaAporte: 15 },
      ],
    });

    // Dia 5: recebe apenas o aporte de Matheus (2520)
    const dia5 = res.dias.find(d => d.dia === 5)!;
    expect(dia5.isDiaAporteRegular).toBe(true);
    expect(dia5.aporteRegular).toBe(2520);
    expect(dia5.detalhesAportesRegulares).toHaveLength(1);
    expect(dia5.detalhesAportesRegulares[0].pessoaNome).toBe('Matheus');

    // Dia 10: nenhum aporte regular
    const dia10 = res.dias.find(d => d.dia === 10)!;
    expect(dia10.isDiaAporteRegular).toBe(false);
    expect(dia10.aporteRegular).toBe(0);

    // Dia 15: recebe o aporte de Rayane (800)
    const dia15 = res.dias.find(d => d.dia === 15)!;
    expect(dia15.isDiaAporteRegular).toBe(true);
    expect(dia15.aporteRegular).toBe(800);
    expect(dia15.detalhesAportesRegulares).toHaveLength(1);
    expect(dia15.detalhesAportesRegulares[0].pessoaNome).toBe('Rayane');

    // Total de aportes regulares do mês bate 3320
    expect(res.totalAporteRegular).toBe(3320);
  });

  test('calcularEvolucaoDiariaDoMes calcula saldoPorPessoa no dia 16 diferente e anterior ao dia 31', () => {
    const res = calcularEvolucaoDiariaDoMes({
      dataReferencia: '2026-10-01',
      saldoInicialMes: 45000,
      saldosIniciaisPorPessoa: { 'p1': 27000, 'p2': 18000 },
      aporteRegular: 300,
      taxaCdiAnual: 10.5,
      tipoInvestimento: 'cdb_100',
      aportesParticipantes: [
        { pessoaId: 'p1', pessoaNome: 'Pessoa 1', valor: 200, diaAporte: 5 },
        { pessoaId: 'p2', pessoaNome: 'Pessoa 2', valor: 100, diaAporte: 10 },
      ],
    });

    const dia16 = res.dias.find(d => d.dia === 16)!;
    const dia31 = res.dias.find(d => d.dia === 31)!;

    expect(dia16).toBeDefined();
    expect(dia31).toBeDefined();

    expect(dia16.saldoPorPessoa).toBeDefined();
    expect(dia31.saldoPorPessoa).toBeDefined();

    // No dia 16, cada participante tem o saldo com os aportes e rendimentos até o dia 16
    expect(dia16.saldoPorPessoa!['p1']).toBeGreaterThan(27000 + 200);
    expect(dia16.saldoPorPessoa!['p2']).toBeGreaterThan(18000 + 100);

    // O saldo no dia 16 é menor do que no final do mês (dia 31), pois o mês ainda não terminou
    expect(dia16.saldoPorPessoa!['p1']).toBeLessThan(dia31.saldoPorPessoa!['p1']);
    expect(dia16.saldoPorPessoa!['p2']).toBeLessThan(dia31.saldoPorPessoa!['p2']);
    expect(dia16.saldoFinal).toBeLessThan(dia31.saldoFinal);
  });

  test('calcularEvolucaoDiariaDoMes nao contabiliza aportes de outros meses ou anos com mesmo dia', () => {
    // Teste crítico: aportes no dia 15 em Jan/2025, Fev/2025 e Jan/2026
    const aportesExtras = [
      { data: '2025-01-15', valor: 1000, origem: 'Jan 2025' },
      { data: '2025-02-15', valor: 2500, origem: 'Fev 2025' },
      { data: '2026-01-15', valor: 9000, origem: 'Jan 2026' },
    ];

    // Simulação do mês de Fevereiro/2025
    const resFev2025 = calcularEvolucaoDiariaDoMes({
      dataReferencia: '2025-02-01',
      saldoInicialMes: 10000,
      aporteRegular: 0,
      taxaCdiAnual: 10.5,
      aportesExtras,
    });

    const dia15Fev = resFev2025.dias.find(d => d.dia === 15)!;
    expect(dia15Fev.aportesExtras).toBe(2500);
    expect(dia15Fev.detalhesExtras).toHaveLength(1);
    expect(dia15Fev.detalhesExtras[0].origem).toBe('Fev 2025');
    expect(resFev2025.totalAportesExtras).toBe(2500);

    // Simulação do mês de Janeiro/2025: só deve ter 1000, sem 2500 nem 9000
    const resJan2025 = calcularEvolucaoDiariaDoMes({
      dataReferencia: '2025-01-01',
      saldoInicialMes: 10000,
      aporteRegular: 0,
      taxaCdiAnual: 10.5,
      aportesExtras,
    });

    const dia15Jan = resJan2025.dias.find(d => d.dia === 15)!;
    expect(dia15Jan.aportesExtras).toBe(1000);
    expect(resJan2025.totalAportesExtras).toBe(1000);
  });

  test('simular com retiradas reduz saldo, desconta do totalInvestido e registra totalRetirado', () => {
    const res = simular({
      valorImovel: 300000,
      percentualEntrada: 20,
      percentualCustosExtras: 5,
      valorJaGuardado: 50000,
      aporteMensalTotal: 1000,
      taxaCdiAnual: 0, // 0 juros para testar fluxo de caixa puro
      percentualCdi: 100,
      prazoMaxMeses: 10,
      mesesExtrasAposMeta: 0,
      dataInicio: new Date('2025-01-01T12:00:00'),
      aportesExtras: [
        { data: '2025-03-10', valor: 5000, origem: 'Resgate emergência', tipo: 'retirada' },
        { data: '2025-05-15', valor: 2000, origem: 'Aporte extra', tipo: 'aporte' },
      ],
    });

    // Mês 0 (Jan/2025): 50000
    expect(res.rows[0].saldoAcumulado).toBe(50000);
    // Mês 1 (Fev/2025): 50000 + 1000 = 51000
    expect(res.rows[1].saldoAcumulado).toBe(51000);
    // Mês 2 (Mar/2025): 51000 + 1000 - 5000 = 47000
    expect(res.rows[2].retiradas).toBe(5000);
    expect(res.rows[2].saldoAcumulado).toBe(47000);
    // Mês 3 (Abr/2025): 47000 + 1000 = 48000
    expect(res.rows[3].saldoAcumulado).toBe(48000);
    // Mês 4 (Mai/2025): 48000 + 1000 + 2000 = 51000
    expect(res.rows[4].aportesExtras).toBe(2000);
    expect(res.rows[4].saldoAcumulado).toBe(51000);
    expect(res.totalRetirado).toBe(5000);
  });

  test('simular com investimento LCI/LCA tem isenção de imposto de renda (imposto = 0)', () => {
    const res = simular({
      valorImovel: 300000,
      percentualEntrada: 20,
      percentualCustosExtras: 5,
      valorJaGuardado: 50000,
      aporteMensalTotal: 2000,
      taxaCdiAnual: 12.0,
      percentualCdi: 100,
      prazoMaxMeses: 12,
      tipoInvestimento: 'lci_lca',
      dataInicio: new Date('2025-01-01T12:00:00'),
      aportesExtras: [],
    });

    // Em todos os meses com rendimento, o imposto deve ser exatamente 0
    for (let i = 1; i < res.rows.length; i++) {
      expect(res.rows[i].imposto).toBe(0);
      expect(res.rows[i].rendimentoLiquido).toBe(res.rows[i].rendimentoBruto);
    }
  });

  test('formatBrlCompact formata valores monetários de forma compacta', () => {
    expect(formatBrlCompact(0)).toBe('R$ 0');
    expect(formatBrlCompact(2500)).toBe('R$ 2.500');
    expect(formatBrlCompact(2500.5)).toBe('R$ 2.500,50');
    expect(formatBrlCompact(150000)).toBe('R$ 150.000');
    expect(formatBrlCompact(1500000)).toBe('R$ 1,5M');
    expect(formatBrlCompact(-5000)).toBe('-R$ 5.000');
  });
});

