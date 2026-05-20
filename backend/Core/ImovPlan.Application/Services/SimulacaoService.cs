using System;
using System.Linq;
using System.Collections.Generic;
using ImovPlan.Application.DTOs;
using ImovPlan.Domain.Entities;
using ImovPlan.Application.Services.Interfaces;

namespace ImovPlan.Application.Services
{
    public class SimulacaoService : ISimulacaoService
    {
        public SimulacaoResultado ExecutarSimulacao(SimulacaoRequestDto request, ObjetivoImovel objetivo)
        {
            var taxaMensal = (decimal)(Math.Pow((double)(1 + request.TaxaCDI / 100), 1.0 / 12.0) - 1);
            var saldo = objetivo.ValorJaGuardado;
            var totalInvestido = saldo;
            
            var totalAporteMensal = request.AportesMensais.Sum(a => a.Valor);
            
            var resultado = new SimulacaoResultado();
            var meses = 0;
            var dataReferencia = DateTime.UtcNow;

            while (saldo < objetivo.TotalNecessario && meses < 360) // Limite de 30 anos
            {
                meses++;
                dataReferencia = dataReferencia.AddMonths(1);

                var aporteExtraMes = request.AportesExtras
                    .Where(a => a.Data.Year == dataReferencia.Year && a.Data.Month == dataReferencia.Month)
                    .Sum(a => a.Valor);

                totalInvestido += totalAporteMensal + aporteExtraMes;
                
                var novoSaldo = (saldo + totalAporteMensal + aporteExtraMes) * (1 + taxaMensal);
                var rendimentoBruto = novoSaldo - totalInvestido;
                var imposto = CalcularIR(meses, rendimentoBruto);
                var saldoLiquido = novoSaldo - imposto;

                resultado.DetalhesMensais.Add(new DetalheMensal
                {
                    Mes = meses,
                    DataReferencia = dataReferencia,
                    AporteMensal = totalAporteMensal,
                    AportesExtras = aporteExtraMes,
                    RendimentoBruto = rendimentoBruto,
                    Imposto = imposto,
                    RendimentoLiquido = rendimentoBruto - imposto,
                    TotalAcumulado = saldoLiquido
                });

                saldo = saldoLiquido;
            }

            resultado.MesesParaAtingir = meses;
            resultado.DataPrevistaAlvo = dataReferencia;
            resultado.TotalAcumulado = saldo;
            resultado.TotalInvestido = totalInvestido;
            resultado.LucroLiquido = saldo - totalInvestido;

            return resultado;
        }

        public decimal CalcularIR(int meses, decimal rendimento)
        {
            if (rendimento <= 0) return 0;
            
            if (meses <= 6) return rendimento * 0.225m;
            if (meses <= 12) return rendimento * 0.20m;
            if (meses <= 24) return rendimento * 0.175m;
            return rendimento * 0.15m;
        }

        public decimal AplicarJurosCompostos(decimal capital, decimal taxaMensal, int meses)
        {
            return capital * (decimal)Math.Pow((double)(1 + taxaMensal), meses);
        }
    }
}
