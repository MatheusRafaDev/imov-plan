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
            var i = ConverterTaxaAnualParaMensal(taxaAnual);
            var amortizacao = pv / prazoMeses;
            var fluxosDeCaixa = new double[prazoMeses + 1];
            fluxosDeCaixa[0] = -(double)pv;
            var saldoDevedor = pv;

            for (int k = 1; k <= prazoMeses; k++)
            {
                var juros = saldoDevedor * i;
                var parcela = amortizacao + juros;
                var seguroMip = saldoDevedor * taxaMip;
                var seguroDfi = pv * taxaDfi; 
                var custoMensal = parcela + seguroMip + seguroDfi + taxaAdmin;
                
                fluxosDeCaixa[k] = (double)custoMensal;
                saldoDevedor -= amortizacao;
            }

            // Newton-Raphson para TIR (IRR)
            double tirMensal = (double)i; // Chute inicial
            for (int iter = 0; iter < 100; iter++)
            {
                double npv = 0;
                double dNpv = 0;
                for (int k = 0; k <= prazoMeses; k++)
                {
                    double factor = Math.Pow(1 + tirMensal, k);
                    npv += fluxosDeCaixa[k] / factor;
                    if (k > 0)
                    {
                        dNpv -= k * fluxosDeCaixa[k] / (factor * (1 + tirMensal));
                    }
                }
                
                if (Math.Abs(npv) < 1e-6) break;
                
                double nextTir = tirMensal - npv / dNpv;
                if (Math.Abs(nextTir - tirMensal) < 1e-7)
                {
                    tirMensal = nextTir;
                    break;
                }
                tirMensal = nextTir;
            }

            var cetAnual = (decimal)Math.Pow(1 + tirMensal, 12) - 1;
            return Math.Round(cetAnual * 100, 2);
        }

        public async Task<bool> VerificarComprometimentoRendaAsync(decimal rendaBrutaFamiliar, decimal parcelaCalculada)
        {
            var parametros = await _parametrosRepo.GetAtivoAsync();
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
            if (modalidade == 2) // Redução de prazo mantendo a parcela
            {
                // TODO: Funcionalidade incompleta/não planejada.
                return new { Erro = "Modalidade 2 (Redução de prazo) ainda não suportada." };
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
