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
        private readonly IParametrosFinanceirosRepository _parametrosRepo;

        public SimulacaoService(
            IHistoricoSimulacaoRepository historicoSimulacaoRepo,
            IParticipanteRepository participanteRepo,
            IParametrosFinanceirosRepository parametrosRepo)
        {
            _historicoSimulacaoRepo = historicoSimulacaoRepo;
            _participanteRepo = participanteRepo;
            _parametrosRepo = parametrosRepo;
        }

        public async Task<SimulacaoResultado> ExecutarSimulacaoAsync(
            SimulacaoRequestDto request,
            Planejamento planejamento,
            decimal totalNecessario,
            string origem = "auto",
            int stepAtual = 0)
        {
            var parametros = await _parametrosRepo.GetAtivoAsync();
            var percentualCdi = request.PercentualCdi > 0 ? request.PercentualCdi : planejamento.PercentualCdi ?? parametros.PercentualCdiPadrao;
            var taxaAnualEfetiva = (request.TaxaCDI / 100m) * (percentualCdi / 100m);
            var taxaMensal = (decimal)(Math.Pow((double)(1 + taxaAnualEfetiva), 1.0 / 12.0) - 1);
            
            // Fetch per-person initial balances from Participante.PatrimonioInicial
            var saldoInicialTotal = 0m;
            foreach (var pid in planejamento.ParticipantesIds)
            {
                var participante = await _participanteRepo.GetByIdAsync(pid);
                if (participante?.PatrimonioInicial != null)
                {
                    saldoInicialTotal += participante.PatrimonioInicial.Valor;
                }
            }
            
            // Calculate ValorJaGuardado dynamically from participants; fallback to plan objective if none exists.
            var valorJaGuardado = saldoInicialTotal > 0
                ? saldoInicialTotal
                : planejamento.ValorJaGuardado ?? 0m;
            var saldo = valorJaGuardado;
            var totalInvestido = saldo;

            var totalAporteMensal = request.AportesMensais.Sum(a => a.Valor);
            var aportesRegularesEditados = request.AportesRegularesEditados ?? new Dictionary<int, decimal>();
            var aportesRegularesEditadosPorPessoa = request.AportesRegularesEditadosPorPessoa ?? new Dictionary<string, Dictionary<int, decimal>>();

            var resultado = new SimulacaoResultado();
            var meses = 0;
            var dataReferencia = planejamento.DataInicio ?? DateTime.UtcNow;
            int? mesAtingiu = null;
            DateTime? dataAtingiu = null;
            var limiteMeses = (planejamento.PrazoMaxMeses.HasValue && planejamento.PrazoMaxMeses.Value > 0)
                ? planejamento.PrazoMaxMeses.Value + 6
                : parametros.PrazoFinanciamentoPadraoMeses;

            // Registro inicial (Mês 0)
            resultado.DetalhesMensais.Add(new DetalheMensal
            {
                Mes = 0,
                DataReferencia = dataReferencia,
                AporteMensal = 0,
                AportesExtras = 0,
                RendimentoBruto = 0,
                Imposto = 0,
                RendimentoLiquido = 0,
                TotalAcumulado = saldo
            });

            while (meses < limiteMeses)
            {
                meses++;
                dataReferencia = dataReferencia.AddMonths(1);

                var aporteExtraMes = request.AportesExtras
                    .Where(a => a.Data.Year == dataReferencia.Year && a.Data.Month == dataReferencia.Month)
                    .Sum(a => a.Valor);

                var aporteRegular = aportesRegularesEditados.GetValueOrDefault(meses, totalAporteMensal);
                
                bool isEditedInMonth = false;
                decimal totalForMonth = 0m;

                foreach (var aporteRequest in request.AportesMensais)
                {
                    if (aportesRegularesEditadosPorPessoa.TryGetValue(aporteRequest.PessoaId, out var dict) 
                        && dict.TryGetValue(meses, out var editedValue))
                    {
                        isEditedInMonth = true;
                        totalForMonth += editedValue;
                    }
                    else
                    {
                        totalForMonth += aporteRequest.Valor;
                    }
                }

                if (isEditedInMonth)
                {
                    aporteRegular = totalForMonth;
                }

                var aporteMes = aporteRegular + aporteExtraMes;
                totalInvestido += aporteMes;

                // Mirrors finance.ts: yield is calculated on (saldo + contributions) before compounding
                var rendimentoMes = (saldo + aporteMes) * taxaMensal;
                var imposto = CalcularIR(meses, rendimentoMes, parametros.AliquotasIr);
                var rendimentoLiquido = rendimentoMes - imposto;
                var novoSaldo = saldo + aporteMes + rendimentoLiquido;

                resultado.DetalhesMensais.Add(new DetalheMensal
                {
                    Mes = meses,
                    DataReferencia = dataReferencia,
                    AporteMensal = aporteRegular,
                    AportesExtras = aporteExtraMes,
                    RendimentoBruto = rendimentoMes,
                    Imposto = imposto,
                    RendimentoLiquido = rendimentoLiquido,
                    TotalAcumulado = novoSaldo
                });

                saldo = novoSaldo;

                if (!mesAtingiu.HasValue && saldo >= totalNecessario)
                {
                    mesAtingiu = meses;
                    dataAtingiu = dataReferencia;
                    if (!planejamento.PrazoMaxMeses.HasValue || planejamento.PrazoMaxMeses.Value <= 0)
                    {
                        limiteMeses = Math.Min(parametros.PrazoFinanciamentoPadraoMeses, meses + 6);
                    }
                    else
                    {
                        limiteMeses = Math.Max(planejamento.PrazoMaxMeses.Value, meses + 6);
                    }
                }
            }

            resultado.MesesParaAtingir = mesAtingiu ?? meses;
            resultado.DataPrevistaAlvo = dataAtingiu ?? dataReferencia;
            resultado.TotalAcumulado = saldo;
            resultado.TotalInvestido = totalInvestido;
            resultado.LucroLiquido = saldo - totalInvestido;

            // Remover simulações anteriores para não poluir o banco e manter sempre apenas a mais recente
            await _historicoSimulacaoRepo.DeleteAllByPlanejamentoIdAsync(planejamento.Id);
            var versao = 1;

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
                ValorImovel = planejamento.ValorImovel ?? 0m,
                TotalNecessario = totalNecessario,
                ValorJaGuardado = valorJaGuardado,
                AporteMensalTotal = totalAporteMensal,
                TaxaCdiAnual = planejamento.TaxaCdiAnual ?? 0m,
                PercentualCdi = percentualCdi,
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
            return CalcularIR(meses, rendimento, ParametrosFinanceiros.DefaultAliquotasIr());
        }

        private decimal CalcularIR(int meses, decimal rendimento, List<AliquotaIrParametro> aliquotas)
        {
            if (rendimento <= 0) return 0;

            var dias = meses * 30;
            var aliquota = aliquotas
                .OrderBy(a => a.AteDias ?? int.MaxValue)
                .FirstOrDefault(a => a.AteDias == null || dias <= a.AteDias)?.Aliquota ?? 0.15m;
            return rendimento * aliquota;
        }

        public decimal AplicarJurosCompostos(decimal capital, decimal taxaMensal, int meses)
        {
            return capital * (decimal)Math.Pow((double)(1 + taxaMensal), meses);
        }
    }
}
