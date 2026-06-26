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
        private readonly IHistoricoSimulacaoRepository _historicoSimulacaoRepo;
        private readonly IParticipanteRepository _participanteRepo;

        public SimulacaoService(IHistoricoSimulacaoRepository historicoSimulacaoRepo, IParticipanteRepository participanteRepo)
        {
            _historicoSimulacaoRepo = historicoSimulacaoRepo;
            _participanteRepo = participanteRepo;
        }

        public async Task<SimulacaoResultado> ExecutarSimulacaoAsync(
            SimulacaoRequestDto request,
            Planejamento planejamento,
            decimal totalNecessario,
            string origem = "auto",
            int stepAtual = 0)
        {
            var taxaMensal = (decimal)(Math.Pow((double)(1 + request.TaxaCDI / 100), 1.0 / 12.0) - 1);
            
            // Fetch per-person initial balances from Participante.PatrimonioInicial
            var saldoInicialTotal = 0m;
            foreach (var aporte in request.AportesMensais)
            {
                var participante = await _participanteRepo.GetByIdAsync(aporte.PessoaId);
                if (participante?.PatrimonioInicial != null)
                {
                    saldoInicialTotal += participante.PatrimonioInicial.Valor;
                }
            }
            
            // Calculate ValorJaGuardado dynamically from all participantes
            var valorJaGuardado = saldoInicialTotal > 0 ? saldoInicialTotal : 0m;
            var saldo = valorJaGuardado;
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

                var aporteMes = totalAporteMensal + aporteExtraMes;
                totalInvestido += aporteMes;

                // Mirrors finance.ts: yield is calculated on (saldo + contributions) before compounding
                var rendimentoMes = (saldo + aporteMes) * taxaMensal;
                var imposto = CalcularIR(meses, rendimentoMes);
                var rendimentoLiquido = rendimentoMes - imposto;
                var novoSaldo = saldo + aporteMes + rendimentoLiquido;

                resultado.DetalhesMensais.Add(new DetalheMensal
                {
                    Mes = meses,
                    DataReferencia = dataReferencia,
                    AporteMensal = totalAporteMensal,
                    AportesExtras = aporteExtraMes,
                    RendimentoBruto = rendimentoMes,
                    Imposto = imposto,
                    RendimentoLiquido = rendimentoLiquido,
                    TotalAcumulado = novoSaldo
                });

                saldo = novoSaldo;
            }

            resultado.MesesParaAtingir = meses;
            resultado.DataPrevistaAlvo = dataReferencia;
            resultado.TotalAcumulado = saldo;
            resultado.TotalInvestido = totalInvestido;
            resultado.LucroLiquido = saldo - totalInvestido;

            // Determinar a próxima versão do snapshot
            var allRegistros = await _historicoSimulacaoRepo.GetAllByPlanejamentoIdAsync(planejamento.Id);
            var versao = allRegistros.Count() + 1;

            // Persistir registro da simulação
            var participantesSnapshot = new List<ParticipanteSnapshot>();
            foreach (var aporte in request.AportesMensais)
            {
                var participante = await _participanteRepo.GetByIdAsync(aporte.PessoaId);
                if (participante != null)
                {
                    participantesSnapshot.Add(new ParticipanteSnapshot
                    {
                        ParticipanteId = participante.Id,
                        Nome = participante.Nome,
                        AporteMensal = aporte.Valor,
                        ValorInicial = participante.PatrimonioInicial?.Valor ?? 0,
                        SobraMensal = participante.SobraMensal,
                    });
                }
            }

            var registro = new HistoricoSimulacao
            {
                PlanejamentoId = planejamento.Id,
                GeradoEm = DateTime.UtcNow,
                Origem = origem,
                StepAtual = stepAtual,
                Versao = versao,
                // Inputs
                ValorImovel = planejamento.ValorImovel,
                TotalNecessario = totalNecessario,
                ValorJaGuardado = valorJaGuardado,
                AporteMensalTotal = totalAporteMensal,
                TaxaCdiAnual = planejamento.TaxaCdiAnual,
                PercentualCdi = planejamento.PercentualCdi,
                // Outputs
                MesesParaAtingir = resultado.MesesParaAtingir,
                DataPrevistaAlvo = resultado.DataPrevistaAlvo,
                TotalInvestido = resultado.TotalInvestido,
                TotalAcumulado = resultado.TotalAcumulado,
                LucroLiquido = resultado.LucroLiquido,
                AtingiuMeta = saldo >= totalNecessario,
                Falta = Math.Max(0, totalNecessario - saldo),
                ParticipantesSnapshot = participantesSnapshot,
            };

            await _historicoSimulacaoRepo.AddAsync(registro);

            // Persist EvolucaoMensalSimulacao separately
            var evolucaoMensal = resultado.DetalhesMensais.Select(d => new EvolucaoMensalSimulacao
            {
                SimulacaoId = registro.Id,
                Mes = d.Mes,
                DataReferencia = d.DataReferencia,
                AporteMensal = d.AporteMensal,
                AportesExtras = d.AportesExtras,
                RendimentoBruto = d.RendimentoBruto,
                Imposto = d.Imposto,
                RendimentoLiquido = d.RendimentoLiquido,
                TotalAcumulado = d.TotalAcumulado,
            });

            await _historicoSimulacaoRepo.AddEvolucaoAsync(evolucaoMensal);

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
