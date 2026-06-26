using System;
using System.Collections.Generic;
using System.Linq;
using ImovPlan.Application.Services.Interfaces;
using ImovPlan.Application.DTOs;
using ImovPlan.Domain.Interfaces;

namespace ImovPlan.Application.Services
{
    public class FinanciamentoService : IFinanciamentoService
    {
        private readonly IParametrosFinanceirosRepository _parametrosRepo;

        public FinanciamentoService(IParametrosFinanceirosRepository parametrosRepo)
        {
            _parametrosRepo = parametrosRepo;
        }

        public object SimularSAC(decimal pv, decimal taxaAnual, int prazoMeses)
        {
            var i = ConverterTaxaAnualParaMensal(taxaAnual);
            var amortizacaoFixa = pv / prazoMeses;
            var saldoDevedor = pv;
            var parcelas = new List<object>();

            for (int k = 1; k <= prazoMeses; k++)
            {
                var juros = saldoDevedor * i;
                var parcela = amortizacaoFixa + juros;
                saldoDevedor -= amortizacaoFixa;
                
                // Correção de precisão no último mês
                if (k == prazoMeses) saldoDevedor = 0;

                parcelas.Add(new {
                    Mes = k,
                    Amortizacao = Math.Round(amortizacaoFixa, 2),
                    Juros = Math.Round(juros, 2),
                    Parcela = Math.Round(parcela, 2),
                    SaldoDevedor = Math.Round(saldoDevedor, 2)
                });
            }

            return new { Sistema = "SAC", Parcelas = parcelas };
        }

        public object SimularPrice(decimal pv, decimal taxaAnual, int prazoMeses)
        {
            var i = ConverterTaxaAnualParaMensal(taxaAnual);
            var pmt = pv * (i * (decimal)Math.Pow((double)(1 + i), prazoMeses)) / ((decimal)Math.Pow((double)(1 + i), prazoMeses) - 1);
            var saldoDevedor = pv;
            var parcelas = new List<object>();

            for (int k = 1; k <= prazoMeses; k++)
            {
                var juros = saldoDevedor * i;
                var amortizacao = pmt - juros;
                saldoDevedor -= amortizacao;

                if (k == prazoMeses) saldoDevedor = 0;

                parcelas.Add(new {
                    Mes = k,
                    Amortizacao = Math.Round(amortizacao, 2),
                    Juros = Math.Round(juros, 2),
                    Parcela = Math.Round(pmt, 2),
                    SaldoDevedor = Math.Round(saldoDevedor, 2)
                });
            }

            return new { Sistema = "PRICE", Parcelas = parcelas };
        }

        public object CompararSistemas(decimal pv, decimal taxaAnual, int prazoMeses)
        {
            return new {
                SAC = SimularSAC(pv, taxaAnual, prazoMeses),
                PRICE = SimularPrice(pv, taxaAnual, prazoMeses)
            };
        }

        public decimal CalcularCET(decimal pv, decimal taxaAnual, int prazoMeses, decimal taxaMip, decimal taxaDfi, decimal taxaAdmin)
        {
            // O cálculo exato do CET requer iteração (Newton-Raphson) 
            // Para efeitos de simulação inicial, adicionamos os custos ao fluxo para obter a taxa real
            var i = ConverterTaxaAnualParaMensal(taxaAnual);
            
            // Taxa estimada aproximada simplificada para fins de demonstração
            var custoMedioSeguros = (taxaMip + taxaDfi) * (pv / 2); // média
            var custoTotalMedioMes = custoMedioSeguros + taxaAdmin;
            
            // Incremento aproximado na taxa mensal
            var cetMensal = i + (custoTotalMedioMes / pv); 
            var cetAnual = (decimal)Math.Pow((double)(1 + cetMensal), 12) - 1;
            
            return Math.Round(cetAnual * 100, 2);
        }

        public bool VerificarComprometimentoRenda(decimal rendaBrutaFamiliar, decimal parcelaCalculada)
        {
            var parametros = _parametrosRepo.GetAtivoAsync().GetAwaiter().GetResult();
            var limite = rendaBrutaFamiliar * parametros.LimiteComprometimentoRenda;
            return parcelaCalculada <= limite;
        }

        public object SimularFGTS(decimal saldoDevedor, decimal saldoFgts, int modalidade, decimal parcelaAtual, int prazoRestante)
        {
            if (modalidade == 1) // Entrada/Abatimento SD
            {
                var novoSaldo = saldoDevedor - saldoFgts;
                return new { NovoSaldo = novoSaldo > 0 ? novoSaldo : 0 };
            }
            if (modalidade == 3) // 80% da Parcela
            {
                var parametros = _parametrosRepo.GetAtivoAsync().GetAwaiter().GetResult();
                var desconto = parcelaAtual * parametros.FgtsPercentualParcela;
                var parcelaPagaPeloCliente = parcelaAtual - desconto;
                return new { ParcelaPagaPeloCliente = parcelaPagaPeloCliente, DuracaoMeses = 12 };
            }
            return new { Erro = "Modalidade inválida" };
        }

        private decimal ConverterTaxaAnualParaMensal(decimal taxaAnualPercentual)
        {
            var taxaDecimal = taxaAnualPercentual / 100;
            return (decimal)Math.Pow((double)(1 + taxaDecimal), 1.0 / 12.0) - 1;
        }

        // Aliquota de IR regressiva baseada em dias corridos
        private decimal AliquotaIR(int diasCorridos)
        {
            var parametros = _parametrosRepo.GetAtivoAsync().GetAwaiter().GetResult();
            return parametros.AliquotasIr
                .OrderBy(a => a.AteDias ?? int.MaxValue)
                .FirstOrDefault(a => a.AteDias == null || diasCorridos <= a.AteDias)?.Aliquota ?? 0.15m;
        }

        // Conversão da taxa CDI anual e percentual CDI para taxa mensal efetiva
        private decimal TaxaMensalEfetiva(decimal taxaCdiAnual, decimal percentualCdi)
        {
            var anual = (taxaCdiAnual / 100m) * (percentualCdi / 100m);
            return (decimal)Math.Pow((double)(1 + anual), 1.0 / 12.0) - 1;
        }

        public SimResultDto Simular(SimInputDto input)
        {
            // Cálculo da meta
            var meta = (input.ValorImovel * input.PercentualEntrada) / 100m + (input.ValorImovel * input.PercentualCustosExtras) / 100m;
            var custosExtras = (input.ValorImovel * input.PercentualCustosExtras) / 100m;
            var valorEntrada = (input.ValorImovel * input.PercentualEntrada) / 100m;
            var faltava = Math.Max(0, meta - input.ValorJaGuardado);

            var taxaMes = TaxaMensalEfetiva(input.TaxaCdiAnual, input.PercentualCdi);
            var parametros = _parametrosRepo.GetAtivoAsync().GetAwaiter().GetResult();
            var prazoMax = input.PrazoMaxMeses ?? parametros.PrazoMaxSimulacaoMeses;
            var dataInicio = input.DataInicio ?? DateTime.UtcNow;

            // Agrupar aportes extras por mês
            var extrasPorMes = new Dictionary<int, decimal>();
            foreach (var a in input.AportesExtras)
            {
                var d = a.Data;
                var mesOffset = (d.Year - dataInicio.Year) * 12 + (d.Month - dataInicio.Month) + 1;
                if (mesOffset >= 1)
                {
                    if (!extrasPorMes.ContainsKey(mesOffset)) extrasPorMes[mesOffset] = 0;
                    extrasPorMes[mesOffset] += a.Valor;
                }
            }

            decimal saldo = input.ValorJaGuardado;
            decimal totalInvestido = input.ValorJaGuardado;
            var rows = new List<SimRowDto>();
            bool atingiuMeta = false;
            int? mesAtingiuMeta = null;
            string? dataAtingiuMeta = null;

            for (int mes = 1; mes <= prazoMax; mes++)
            {
                var aporteRegular = input.AporteMensalTotal;
                var aporteExtra = extrasPorMes.ContainsKey(mes) ? extrasPorMes[mes] : 0m;

                saldo += aporteRegular + aporteExtra;
                totalInvestido += aporteRegular + aporteExtra;

                var rendimentoBruto = saldo * taxaMes;
                var dias = mes * 30;
                var ir = AliquotaIR(dias);
                var imposto = rendimentoBruto * ir;
                var rendimentoLiquido = rendimentoBruto - imposto;
                saldo += rendimentoLiquido;

                var dataRef = new DateTime(dataInicio.Year, dataInicio.Month, 1).AddMonths(mes - 1);

                rows.Add(new SimRowDto
                {
                    Mes = mes,
                    Data = dataRef.ToString("yyyy-MM-dd"),
                    AporteRegular = aporteRegular,
                    AportesExtras = aporteExtra,
                    RendimentoBruto = rendimentoBruto,
                    Imposto = imposto,
                    RendimentoLiquido = rendimentoLiquido,
                    SaldoAcumulado = saldo,
                    TotalInvestido = totalInvestido
                });

                if (!atingiuMeta && saldo >= meta)
                {
                    atingiuMeta = true;
                    mesAtingiuMeta = mes;
                    dataAtingiuMeta = dataRef.ToString("yyyy-MM-dd");
                    break;
                }
            }

            var result = new SimResultDto
            {
                Meta = meta,
                CustosExtras = custosExtras,
                ValorEntrada = valorEntrada,
                Falta = faltava,
                Rows = rows,
                AtingiuMeta = atingiuMeta,
                MesAtingiuMeta = mesAtingiuMeta,
                DataAtingiuMeta = dataAtingiuMeta,
                SaldoFinal = saldo,
                TotalInvestido = totalInvestido,
                LucroLiquido = saldo - totalInvestido
            };

            return result;
        }
    }
}
