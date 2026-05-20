using System;
using System.Collections.Generic;
using ImovPlan.Application.Services.Interfaces;

namespace ImovPlan.Application.Services
{
    public class FinanciamentoService : IFinanciamentoService
    {
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
            var limite = rendaBrutaFamiliar * 0.30m;
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
                var desconto = parcelaAtual * 0.80m;
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
    }
}
