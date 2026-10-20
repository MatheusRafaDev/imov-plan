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
            
            decimal cenarioDelta = (request.Cenario?.ToLower()) switch
            {
                "pessimista" => -2.0m,
                "otimista" => 2.0m,
                _ => 0m
            };
            var taxaCdiEfetiva = Math.Max(0, request.TaxaCDI + cenarioDelta);

            var taxaAnualEfetiva = (taxaCdiEfetiva / 100m) * (percentualCdi / 100m);
            var taxaMensal = (decimal)(Math.Pow((double)(1 + taxaAnualEfetiva), 1.0 / 12.0) - 1);
            
            // Fetch participants
            var participantesDb = new Dictionary<string, Participante>();
            var saldosIndividuais = new Dictionary<string, decimal>();
            var saldosTeoricosIniciais = new Dictionary<string, decimal>();
            var nomesIndividuais = new Dictionary<string, string>();
            var checkpoints = new Dictionary<string, (decimal Valor, DateTime Data)>();
            
            foreach (var pid in planejamento.ParticipantesIds)
            {
                var p = await _participanteRepo.GetByIdAsync(pid);
                if (p != null)
                {
                    participantesDb[pid] = p;
                    var saldoTeorico = p.PatrimonioInicial?.Valor ?? 0m;
                    saldosTeoricosIniciais[pid] = saldoTeorico;
                    saldosIndividuais[pid] = saldoTeorico;
                    if (p.ValorAtual.HasValue && p.DataValorAtual.HasValue)
                    {
                        checkpoints[pid] = (p.ValorAtual.Value, p.DataValorAtual.Value.Date);
                    }
                    nomesIndividuais[pid] = p.Nome;
                }
            }

            var saldoInicialTotal = saldosIndividuais.Values.Sum();
            
            // Calculate ValorJaGuardado dynamically from participants; fallback to plan objective if none exists.
            var valorJaGuardado = saldoInicialTotal > 0
                ? saldoInicialTotal
                : planejamento.ValorJaGuardado ?? 0m;
            
            // A global balance remains unassigned until the user explicitly assigns
            // it to a participant; never split it automatically.

            var saldoConjunto = valorJaGuardado;
            var totalInvestido = saldoConjunto;

            var aportesMensaisRequest = request.AportesMensais ?? new List<AporteMensalDto>();
            var totalAporteMensal = aportesMensaisRequest.Sum(a => a.Valor);
            var aportesRegularesEditados = request.AportesRegularesEditados ?? new Dictionary<int, decimal>();
            var aportesRegularesEditadosPorPessoa = request.AportesRegularesEditadosPorPessoa ?? new Dictionary<string, Dictionary<int, decimal>>();

            var resultado = new SimulacaoResultado();
            var meses = 0;
            var dataReferencia = planejamento.DataInicio ?? DateTime.UtcNow;

            // O saldo inicial (Mês 0) reflete o patrimônio guardado do participante (PatrimonioInicial ou ValorAtual)
            foreach (var pid in participantesDb.Keys)
            {
                var p = participantesDb[pid];
                var saldoTeorico = p.PatrimonioInicial?.Valor ?? 0m;
                var valorAtual = p.ValorAtual ?? 0m;
                saldosIndividuais[pid] = valorAtual > 0 ? valorAtual : saldoTeorico;
            }
            saldoConjunto = saldosIndividuais.Values.Sum();
            if (saldoConjunto == 0 && (planejamento.ValorJaGuardado ?? 0m) > 0)
            {
                saldoConjunto = planejamento.ValorJaGuardado.GetValueOrDefault();
            }
            valorJaGuardado = saldoConjunto;
            totalInvestido = saldoConjunto;
            var saldosBaseSimulacao = new Dictionary<string, decimal>(saldosIndividuais);
            int? mesAtingiu = null;
            DateTime? dataAtingiu = null;
            var temPrazoUsuario = planejamento.PrazoMaxMeses.HasValue && planejamento.PrazoMaxMeses.Value > 0;
            var limiteMesesOriginal = temPrazoUsuario
                ? planejamento.PrazoMaxMeses.GetValueOrDefault()
                : parametros.PrazoFinanciamentoPadraoMeses;
            var limiteMeses = limiteMesesOriginal;
            var totalRetiradoAcumulado = 0m;

            // Aportes extras e retiradas do Mês 0 (competência da DataInicio)
            var aportesExtrasRequest = request.AportesExtras ?? new List<AporteExtraDto>();
            var extrasMes0List = aportesExtrasRequest
                .Where(a => a.Data.Year == dataReferencia.Year && a.Data.Month == dataReferencia.Month && a.Revertido != true)
                .ToList();

            var extrasMes0Aportes = extrasMes0List.Where(a => a.Tipo != "retirada").Sum(a => a.Valor);
            var extrasMes0Retiradas = extrasMes0List.Where(a => a.Tipo == "retirada").Sum(a => a.Valor);
            var netMes0 = extrasMes0Aportes - extrasMes0Retiradas;

            saldoConjunto += netMes0;
            totalInvestido += netMes0;
            totalRetiradoAcumulado += extrasMes0Retiradas;

            // Registro inicial (Mês 0)
            var partesMes0 = new List<EvolucaoMensalParticipante>();
            foreach (var p in participantesDb.Keys)
            {
                var extrasPessoaMes0 = extrasMes0List
                    .Where(a => a.PessoaId == p && a.Tipo != "retirada")
                    .Sum(a => a.Valor);
                var retiradasPessoaMes0 = extrasMes0List
                    .Where(a => a.PessoaId == p && a.Tipo == "retirada")
                    .Sum(a => a.Valor);
                saldosIndividuais[p] += (extrasPessoaMes0 - retiradasPessoaMes0);

                partesMes0.Add(new EvolucaoMensalParticipante
                {
                    ParticipanteId = p,
                    Nome = nomesIndividuais[p],
                    AporteMensal = 0,
                    AportesExtras = extrasPessoaMes0,
                    RendimentoLiquido = 0,
                    Saldo = saldosIndividuais[p]
                });
            }

            resultado.DetalhesMensais.Add(new DetalheMensal
            {
                Mes = 0,
                DataReferencia = dataReferencia,
                AporteMensal = 0,
                AportesExtras = extrasMes0Aportes,
                Retiradas = extrasMes0Retiradas,
                RendimentoBruto = 0,
                Imposto = 0,
                RendimentoLiquido = 0,
                TotalAcumulado = saldoConjunto,
                Participantes = partesMes0
            });

            while (meses < limiteMeses)
            {
                meses++;
                dataReferencia = dataReferencia.AddMonths(1);

                // Aportes extras e retiradas do mês
                var extrasGlobaisMes = 0m;
                var extrasPorPessoa = new Dictionary<string, decimal>();
                foreach (var p in participantesDb.Keys) extrasPorPessoa[p] = 0m;

                var movimentacoesMes = aportesExtrasRequest
                    .Where(a => a.Data.Year == dataReferencia.Year && a.Data.Month == dataReferencia.Month && a.Revertido != true)
                    .ToList();

                var aportesExtrasMes = movimentacoesMes.Where(a => a.Tipo != "retirada").ToList();
                var retiradasMes = movimentacoesMes.Where(a => a.Tipo == "retirada").ToList();

                foreach (var extra in aportesExtrasMes)
                {
                    if (!string.IsNullOrEmpty(extra.PessoaId) && extrasPorPessoa.ContainsKey(extra.PessoaId))
                    {
                        extrasPorPessoa[extra.PessoaId] += extra.Valor;
                    }
                    else
                    {
                        extrasGlobaisMes += extra.Valor;
                    }
                }

                var totalExtrasMes = extrasPorPessoa.Values.Sum() + extrasGlobaisMes;
                var totalRetiradasMes = retiradasMes.Sum(a => a.Valor);

                // Aportes regulares por pessoa
                var aporteRegularPorPessoa = new Dictionary<string, decimal>();
                foreach (var p in participantesDb.Keys) aporteRegularPorPessoa[p] = 0m;

                bool isLegacyEdited = aportesRegularesEditados.ContainsKey(meses);
                var defaultAporte = totalAporteMensal;

                foreach (var aporteRequest in aportesMensaisRequest)
                {
                    var pid = aporteRequest.PessoaId;
                    if (!aporteRegularPorPessoa.ContainsKey(pid)) continue;

                    if (aportesRegularesEditadosPorPessoa.TryGetValue(pid, out var dict) && dict.TryGetValue(meses, out var editedValue))
                    {
                        aporteRegularPorPessoa[pid] = editedValue;
                    }
                    else if (isLegacyEdited && defaultAporte > 0)
                    {
                        aporteRegularPorPessoa[pid] = (aporteRequest.Valor / defaultAporte) * aportesRegularesEditados[meses];
                    }
                    else
                    {
                        aporteRegularPorPessoa[pid] = aporteRequest.Valor;
                    }
                }

                // Diff global (se houver legacy edit mas default aporte 0)
                var aporteRegularGlobal = aporteRegularPorPessoa.Values.Sum();
                if (isLegacyEdited && defaultAporte == 0)
                {
                    aporteRegularGlobal = aportesRegularesEditados[meses];
                }

                // Base de cálculo pro-rata de rendimentos:
                // - Saldo do início do mês rende pelo mês inteiro (30/30).
                // - Aporte regular rende a partir do dia de aporte (dia 5 padrão -> 25/30).
                // - Aportes extras rendem pelos dias restantes a partir da data de crédito.
                // - Retiradas são deduzidas da base.
                var diaReg = 5m;
                var fatorReg = Math.Max(0m, (30m - diaReg) / 30m);
                var rendimentoAportesExtras = aportesExtrasMes.Sum(e => e.Valor * Math.Max(0m, (30m - Math.Clamp(e.Data.Day, 1, 30)) / 30m));
                var baseRendimento = saldoConjunto + (aporteRegularGlobal * fatorReg) + rendimentoAportesExtras - totalRetiradasMes;
                baseRendimento = Math.Max(0m, baseRendimento);

                var rendimentoMesGlobal = baseRendimento * taxaMensal;
                var isLciLca = (planejamento.TipoInvestimento ?? string.Empty).ToLower() == "lci_lca";
                var impostoGlobal = isLciLca ? 0m : CalcularIR(meses, rendimentoMesGlobal, parametros.AliquotasIr);
                var rendimentoLiquidoGlobal = rendimentoMesGlobal - impostoGlobal;

                var novoSaldoConjunto = Math.Max(0m, saldoConjunto + aporteRegularGlobal + totalExtrasMes - totalRetiradasMes + rendimentoLiquidoGlobal);
                totalInvestido += (aporteRegularGlobal + totalExtrasMes - totalRetiradasMes);
                totalRetiradoAcumulado += totalRetiradasMes;

                // Rendimento por Pessoa
                var evolucoesIndividuais = new List<EvolucaoMensalParticipante>();
                var somaSaldosComAportesIndividuais = saldosIndividuais.Values.Sum() + aporteRegularPorPessoa.Values.Sum() + extrasPorPessoa.Values.Sum();

                foreach (var p in participantesDb.Keys)
                {
                    var saldoAnterior = saldosIndividuais[p];
                    var aportePessoa = aporteRegularPorPessoa[p];
                    var extraPessoa = extrasPorPessoa[p];
                    var saldoPessoaComAportes = saldoAnterior + aportePessoa + extraPessoa;

                    var proporcao = somaSaldosComAportesIndividuais > 0 ? saldoPessoaComAportes / somaSaldosComAportesIndividuais : 0m;
                    var rendPessoa = proporcao * rendimentoLiquidoGlobal;
                    var novoSaldoPessoa = saldoPessoaComAportes + rendPessoa;

                    if (extrasGlobaisMes > 0 || (isLegacyEdited && defaultAporte == 0))
                    {
                        var aporteGlobalOrfao = extrasGlobaisMes + (isLegacyEdited && defaultAporte == 0 ? aportesRegularesEditados[meses] : 0);
                        novoSaldoPessoa += proporcao * aporteGlobalOrfao;
                    }

                    saldosIndividuais[p] = novoSaldoPessoa;

                    evolucoesIndividuais.Add(new EvolucaoMensalParticipante
                    {
                        ParticipanteId = p,
                        Nome = nomesIndividuais[p],
                        AporteMensal = aportePessoa,
                        AportesExtras = extraPessoa,
                        RendimentoLiquido = rendPessoa,
                        Saldo = novoSaldoPessoa
                    });
                }

                resultado.DetalhesMensais.Add(new DetalheMensal
                {
                    Mes = meses,
                    DataReferencia = dataReferencia,
                    AporteMensal = aporteRegularGlobal,
                    AportesExtras = totalExtrasMes,
                    Retiradas = totalRetiradasMes,
                    RendimentoBruto = rendimentoMesGlobal,
                    Imposto = impostoGlobal,
                    RendimentoLiquido = rendimentoLiquidoGlobal,
                    TotalAcumulado = novoSaldoConjunto,
                    Participantes = evolucoesIndividuais
                });

                saldoConjunto = novoSaldoConjunto;

                if (!mesAtingiu.HasValue && saldoConjunto >= totalNecessario)
                {
                    mesAtingiu = meses;
                    dataAtingiu = dataReferencia;
                    limiteMeses = Math.Min(limiteMeses, meses + 6);
                }
            }

            resultado.MesesParaAtingir = mesAtingiu ?? meses;
            resultado.DataPrevistaAlvo = dataAtingiu ?? dataReferencia;
            resultado.TotalAcumulado = saldoConjunto;
            resultado.TotalInvestido = totalInvestido;
            resultado.TotalRetirado = totalRetiradoAcumulado;
            resultado.LucroLiquido = saldoConjunto - totalInvestido;

            // Remover simulações anteriores para não poluir o banco e manter sempre apenas a mais recente
            await _historicoSimulacaoRepo.DeleteAllByPlanejamentoIdAsync(planejamento.Id);
            var versao = 1;

            // Persistir registro da simulação
            var participantesSnapshot = new List<ParticipanteSnapshot>();
            foreach (var aporte in aportesMensaisRequest)
            {
                var participante = participantesDb.GetValueOrDefault(aporte.PessoaId);
                if (participante != null)
                {
                    participantesSnapshot.Add(new ParticipanteSnapshot
                    {
                        ParticipanteId = participante.Id,
                        Nome = participante.Nome,
                        AporteMensal = aporte.Valor,
                        ValorInicial = saldosBaseSimulacao.GetValueOrDefault(participante.Id),
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
                TotalRetirado = resultado.TotalRetirado,
                TotalAcumulado = resultado.TotalAcumulado,
                LucroLiquido = resultado.LucroLiquido,
                AtingiuMeta = saldoConjunto >= totalNecessario,
                Falta = Math.Max(0, totalNecessario - saldoConjunto),
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
                Retiradas = d.Retiradas,
                RendimentoBruto = d.RendimentoBruto,
                Imposto = d.Imposto,
                RendimentoLiquido = d.RendimentoLiquido,
                TotalAcumulado = d.TotalAcumulado,
                Participantes = d.Participantes
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
