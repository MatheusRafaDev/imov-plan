using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ImovPlan.Application.DTOs;
using ImovPlan.Domain.Entities;
using ImovPlan.Domain.Interfaces;
using ImovPlan.Application.Services.Interfaces;

namespace ImovPlan.Application.Services
{
    public class SimulacaoService : ISimulacaoService
    {
        private readonly ISnapshotSimulacaoRepository _snapshotRepo;

        public SimulacaoService(ISnapshotSimulacaoRepository snapshotRepo)
        {
            _snapshotRepo = snapshotRepo;
        }

        public async Task<SimulacaoResultado> ExecutarSimulacaoAsync(
            SimulacaoRequestDto request,
            ObjetivoImovel objetivo,
            decimal totalNecessario,
            string origem = "auto",
            int stepAtual = 0)
        {
            var taxaMensal = (decimal)(Math.Pow((double)(1 + request.TaxaCDI / 100), 1.0 / 12.0) - 1);
            var saldo = objetivo.ValorJaGuardado;
            var totalInvestido = saldo;

            var totalAporteMensal = request.AportesMensais.Sum(a => a.Valor);

            var resultado = new SimulacaoResultado();
            var meses = 0;
            var dataReferencia = DateTime.UtcNow;

            while (saldo < totalNecessario && meses < 360) // Limite de 30 anos
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

            // Determinar a próxima versão do snapshot
            var allSnapshots = await _snapshotRepo.GetAllByObjetivoIdAsync(objetivo.Id);
            var versao = allSnapshots.Count() + 1;

            // Persistir snapshot automático
            var pessoasSnapshot = request.AportesMensais.Select(a => new PessoaSnapshot
            {
                PessoaId = a.PessoaId,
                AporteMensal = a.Valor,
            }).ToList();

            var snapshot = new SnapshotSimulacao
            {
                ObjetivoImovelId = objetivo.Id,
                GeradoEm = DateTime.UtcNow,
                Origem = origem,
                StepAtual = stepAtual,
                Versao = versao,
                // Inputs
                ValorImovel = objetivo.ValorImovel,
                TotalNecessario = totalNecessario,
                ValorJaGuardado = objetivo.ValorJaGuardado,
                AporteMensalTotal = totalAporteMensal,
                TaxaCdiAnual = objetivo.TaxaCdiAnual,
                PercentualCdi = objetivo.PercentualCdi,
                // Outputs
                MesesParaAtingir = resultado.MesesParaAtingir,
                DataPrevistaAlvo = resultado.DataPrevistaAlvo,
                TotalInvestido = resultado.TotalInvestido,
                TotalAcumulado = resultado.TotalAcumulado,
                LucroLiquido = resultado.LucroLiquido,
                AtingiuMeta = saldo >= totalNecessario,
                Falta = Math.Max(0, totalNecessario - saldo),
                PessoasSnapshot = pessoasSnapshot,
                DetalhesMensais = resultado.DetalhesMensais,
            };

            await _snapshotRepo.AddAsync(snapshot);

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
