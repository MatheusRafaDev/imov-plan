using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using ImovPlan.Application.DTOs;
using ImovPlan.Application.Services.Interfaces;
using ImovPlan.Domain.Entities;
using ImovPlan.Domain.Enums;
using ImovPlan.Domain.Interfaces;

namespace ImovPlan.Application.Services
{
    public class PlanejamentoService : IPlanoService
    {
        private readonly IPlanejamentoRepository _planejamentoRepo;
        private readonly IParticipanteRepository _participanteRepo;
        private readonly IAporteExtraRepository _aporteExtraRepo;
        private readonly IHistoricoAporteRepository _historicoAporteRepo;
        private readonly IGastoDetalhadoRepository _gastoDetalhadoRepo;
        private readonly IParametrosFinanceirosRepository _parametrosRepo;

        public PlanejamentoService(
            IPlanejamentoRepository planejamentoRepo,
            IParticipanteRepository participanteRepo,
            IAporteExtraRepository aporteExtraRepo,
            IHistoricoAporteRepository historicoAporteRepo,
            IGastoDetalhadoRepository gastoDetalhadoRepo,
            IParametrosFinanceirosRepository parametrosRepo)
        {
            _planejamentoRepo = planejamentoRepo;
            _participanteRepo = participanteRepo;
            _aporteExtraRepo = aporteExtraRepo;
            _historicoAporteRepo = historicoAporteRepo;
            _gastoDetalhadoRepo = gastoDetalhadoRepo;
            _parametrosRepo = parametrosRepo;
        }

        public async Task<PlanoDraftDto?> GetDraftBySessionIdAsync(string sessionId)
        {
            var planejamento = await _planejamentoRepo.GetBySessionIdAsync(sessionId);
            if (planejamento == null) return null;

            return await BuildDraftDtoAsync(planejamento);
        }

        public async Task<PlanoDraftDto?> GetDraftByUsuarioIdAsync(string usuarioId)
        {
            var planejamento = await _planejamentoRepo.GetByUsuarioIdAsync(usuarioId);
            if (planejamento == null) return null;

            return await BuildDraftDtoAsync(planejamento);
        }

        public async Task<PlanoDraftDto> GetOrCreateDraftForUserAsync(string usuarioId)
        {
            // Reutiliza o plano existente do usuário, se houver, em vez de criar um novo.
            // Evita duplicar Planejamento para o mesmo usuarioId (não há índice único
            // garantindo isso no banco, então a checagem precisa acontecer aqui).
            var existing = await _planejamentoRepo.GetByUsuarioIdAsync(usuarioId);
            if (existing != null)
            {
                return await BuildDraftDtoAsync(existing);
            }

            var planejamento = new Planejamento
            {
                UsuarioId = usuarioId,
                Status = "Draft"
            };

            await _planejamentoRepo.CreateAsync(planejamento);
            return await BuildDraftDtoAsync(planejamento);
        }

        public async Task<bool> LinkPlanToUserAsync(string id, string usuarioId)
        {
            var planejamento = await _planejamentoRepo.GetByIdAsync(id);
            if (planejamento == null) return false;

            planejamento.UsuarioId = usuarioId;
            await _planejamentoRepo.UpdateAsync(id, planejamento);
            return true;
        }

        public async Task<string> CreateDraftAsync(string sessionId)
        {
            var existing = await _planejamentoRepo.GetBySessionIdAsync(sessionId);
            if (existing != null)
            {
                return existing.Id;
            }

            var planejamento = new Planejamento
            {
                SessionId = sessionId,
                Status = "Draft"
            };

            await _planejamentoRepo.CreateAsync(planejamento);
            return planejamento.Id;
        }

        public async Task<bool> UpdateDraftAsync(string id, PlanoDraftDto draftDto)
        {
            var existingPlanejamento = await _planejamentoRepo.GetByIdAsync(id);
            if (existingPlanejamento == null)
            {
                return false;
            }

            // Check authorization: for logged-in users, verify UsuarioId; for session-based, verify SessionId
            if (!string.IsNullOrEmpty(existingPlanejamento.UsuarioId))
            {
                // Logged-in user plan: verify UsuarioId matches
                if (string.IsNullOrEmpty(draftDto.UsuarioId) || existingPlanejamento.UsuarioId != draftDto.UsuarioId)
                {
                    return false;
                }
            }
            else
            {
                // Session-based plan: verify SessionId matches
                if (existingPlanejamento.SessionId != draftDto.SessionId)
                {
                    return false;
                }
            }

            // ── Map Planejamento fields ──
            if (draftDto.Objetivo != null)
            {
                var o = draftDto.Objetivo;
                existingPlanejamento.ValorImovel = o.ValorImovel;
                existingPlanejamento.PercentualEntrada = o.PercentualEntrada;
                existingPlanejamento.PercentualCustosExtras = o.PercentualCustosExtras;
                existingPlanejamento.ValorJaGuardado = o.ValorJaGuardado;
                existingPlanejamento.TaxaCdiAnual = o.TaxaCdiAnual;
                existingPlanejamento.PercentualCdi = o.PercentualCdi;
                existingPlanejamento.PrazoMaxMeses = o.PrazoMaxMeses;
                existingPlanejamento.NomePlano = string.IsNullOrWhiteSpace(o.NomePlano) ? "Imóvel" : o.NomePlano.Trim();
                existingPlanejamento.TipoInvestimento = o.TipoInvestimento;

                if (!string.IsNullOrEmpty(o.DataInicio))
                {
                    if (DateTime.TryParse(o.DataInicio, out var dt))
                        existingPlanejamento.DataInicio = dt;
                }

                // Update CustosCompra subdocument directly in Planejamento
                var parametros = await _parametrosRepo.GetAtivoAsync();
                var valorEntrada = o.ValorImovel * o.PercentualEntrada / 100m;
                var custoITBI = o.ValorImovel * parametros.CustoItbiPadrao;
                var custoEscritura = o.ValorImovel * parametros.CustoEscrituraPadrao;
                var custoRegistro = o.ValorImovel * parametros.CustoRegistroPadrao;
                var totalNecessario = valorEntrada + (o.ValorImovel * o.PercentualCustosExtras / 100m);

                existingPlanejamento.CustosCompra = new CustosCompra
                {
                    ValorEntrada = valorEntrada,
                    TotalNecessario = totalNecessario,
                    CustoITBI = custoITBI,
                    CustoEscritura = custoEscritura,
                    CustoRegistro = custoRegistro,
                    CalculadoEm = DateTime.UtcNow,
                };
            }

            // ── Map Banco Escolhido ──
            if (draftDto.BancoEscolhido != null)
            {
                existingPlanejamento.BancoEscolhidoId = draftDto.BancoEscolhido.Id;
                existingPlanejamento.BancoEscolhidoNome = draftDto.BancoEscolhido.Nome;
                existingPlanejamento.BancoEscolhidoTaxa = draftDto.BancoEscolhido.Taxa;
            }

            // ── Map Aportes Extras → AporteExtraRepository ──
            if (draftDto.AportesExtras != null)
            {
                // Delete existing AportesExtras to prevent duplication on save
                await _aporteExtraRepo.DeleteByPlanejamentoIdAsync(id);

                foreach (var a in draftDto.AportesExtras)
                {
                    await _aporteExtraRepo.AddAsync(new AporteExtra
                    {
                        PlanejamentoId = id,
                        ParticipanteId = string.IsNullOrEmpty(a.PessoaId) ? "" : a.PessoaId,
                        Data = !string.IsNullOrEmpty(a.Data) && DateTime.TryParse(a.Data, out var d) ? d : DateTime.UtcNow,
                        Valor = a.Valor,
                        Origem = a.Origem,
                    });
                }
            }

            // ── Map AportesRegularesEditados → HistoricoAporteRepository ──
            if (draftDto.AportesRegularesEditados != null || draftDto.AportesRegularesEditadosPorPessoa != null)
            {
                // Delete existing edits to prevent accumulation of obsolete entries
                await _historicoAporteRepo.DeleteByPlanejamentoIdAsync(id);
            }

            if (draftDto.AportesRegularesEditados != null)
            {
                foreach (var kvp in draftDto.AportesRegularesEditados)
                {
                    await _historicoAporteRepo.UpsertByMesAsync(new HistoricoAporte
                    {
                        PlanejamentoId = id,
                        ParticipanteId = string.Empty, // Plan-level edit, not person-specific
                        Mes = kvp.Key,
                        ValorEditado = kvp.Value,
                        EditadoEm = DateTime.UtcNow,
                    });
                }
            }

            // ── Map AportesRegularesEditadosPorPessoa → HistoricoAporteRepository ──
            if (draftDto.AportesRegularesEditadosPorPessoa != null)
            {
                foreach (var participanteKvp in draftDto.AportesRegularesEditadosPorPessoa)
                {
                    var participanteId = participanteKvp.Key;
                    foreach (var mesKvp in participanteKvp.Value)
                    {
                        await _historicoAporteRepo.UpsertByMesAsync(new HistoricoAporte
                        {
                            PlanejamentoId = id,
                            ParticipanteId = participanteId,
                            Mes = mesKvp.Key,
                            ValorEditado = mesKvp.Value,
                            EditadoEm = DateTime.UtcNow,
                        });
                    }
                }
            }

            // ── Map Monthly Tracking Data ──
            if (draftDto.MesesConcluidos != null)
            {
                existingPlanejamento.MesesConcluidos = draftDto.MesesConcluidos;
            }

            // ── Upsert Participantes ──
            if (draftDto.Pessoas != null && draftDto.Pessoas.Count > 0)
            {
                // Load existing people for this plan
                var existingPlanParticipantes = (await _participanteRepo.GetByPlanejamentoIdAsync(id)).ToList();

                var keptParticipanteIds = new List<string>();

                foreach (var pDto in draftDto.Pessoas)
                {
                    // Try to find existing participante by Id only
                    Participante? participante = null;
                    if (!string.IsNullOrEmpty(pDto.Id))
                        participante = existingPlanParticipantes.FirstOrDefault(p => p.Id == pDto.Id);

                    if (participante != null)
                    {
                        // Update existing participante fields
                        participante.Nome = pDto.Nome;
                        participante.RendaMensal = pDto.Renda_mensal;
                        participante.RendaComplementar = pDto.Renda_complementar;
                        participante.GastosMensais = pDto.Gastos_mensais;
                        participante.UsarGastosDetalhados = pDto.Usar_gastos_detalhados;
                        participante.SobraMensal = pDto.Renda_mensal + pDto.Renda_complementar - pDto.Gastos_mensais;
                        participante.AporteMensal = pDto.Aporte_mensal;
                        
                        // Update PatrimonioInicial subdocument directly
                        if (pDto.ValorInicial > 0)
                        {
                            var tipoInvestimento = pDto.TipoInvestimento ?? draftDto.Objetivo?.TipoInvestimento;
                            var fonte = MapTipoInvestimentoToFonte(tipoInvestimento);
                            participante.PatrimonioInicial = new PatrimonioInicial
                            {
                                Valor = pDto.ValorInicial,
                                Fonte = fonte,
                                TipoInvestimento = tipoInvestimento,
                                RegistradoEm = DateTime.UtcNow,
                            };
                        }
                        else
                        {
                            participante.PatrimonioInicial = null;
                        }
                        
                        await _participanteRepo.UpdateAsync(participante.Id, participante);
                        keptParticipanteIds.Add(participante.Id);
                    }
                    else
                    {
                        // Create new participante
                        participante = new Participante
                        {
                            Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString(),
                            PlanejamentoId = id,
                            Nome = pDto.Nome,
                            RendaMensal = pDto.Renda_mensal,
                            RendaComplementar = pDto.Renda_complementar,
                            GastosMensais = pDto.Gastos_mensais,
                            UsarGastosDetalhados = pDto.Usar_gastos_detalhados,
                            SobraMensal = pDto.Renda_mensal + pDto.Renda_complementar - pDto.Gastos_mensais,
                            AporteMensal = pDto.Aporte_mensal,
                        };

                        // Set PatrimonioInicial subdocument
                        if (pDto.ValorInicial > 0)
                        {
                            var tipoInvestimento = pDto.TipoInvestimento ?? draftDto.Objetivo?.TipoInvestimento;
                            var fonte = MapTipoInvestimentoToFonte(tipoInvestimento);
                            participante.PatrimonioInicial = new PatrimonioInicial
                            {
                                Valor = pDto.ValorInicial,
                                Fonte = fonte,
                                TipoInvestimento = tipoInvestimento,
                                RegistradoEm = DateTime.UtcNow,
                            };
                        }

                        await _participanteRepo.CreateAsync(participante);
                        keptParticipanteIds.Add(participante.Id);
                    }

                    // Replace GastosDetalhados for this participante
                    var existingGastos = await _gastoDetalhadoRepo.GetByParticipanteIdAsync(participante.Id);
                    foreach (var g in existingGastos)
                        await _gastoDetalhadoRepo.DeleteAsync(g.Id);
                    if (pDto.Gastos_detalhados != null)
                    {
                        foreach (var gDto in pDto.Gastos_detalhados)
                        {
                            await _gastoDetalhadoRepo.AddAsync(new GastoDetalhado
                            {
                                PlanejamentoId = id,
                                ParticipanteId = participante.Id,
                                Nome = gDto.Nome,
                                Valor = gDto.Valor,
                                Categoria = gDto.Categoria,
                            });
                        }
                    }
                }

                // Delete any participantes that were removed from the draft
                var toDelete = existingPlanParticipantes.Where(p => !keptParticipanteIds.Contains(p.Id)).ToList();
                foreach (var old in toDelete)
                {
                    var gastos = await _gastoDetalhadoRepo.GetByParticipanteIdAsync(old.Id);
                    foreach (var g in gastos)
                        await _gastoDetalhadoRepo.DeleteAsync(g.Id);
                    await _participanteRepo.DeleteAsync(old.Id);
                }

                // Update planejamento reference list
                existingPlanejamento.ParticipantesIds = keptParticipanteIds;
            }

            await _planejamentoRepo.UpdateAsync(id, existingPlanejamento);
            return true;
        }

        public async Task<PlanoDraftDto?> GetDraftAsync(string id, string sessionId)
        {
            var planejamento = await _planejamentoRepo.GetByIdAsync(id);
            if (planejamento == null)
            {
                return null;
            }

            // Skip SessionId validation if the plan is linked to a user (JWT auth already guarantees identity)
            if (!string.IsNullOrEmpty(planejamento.UsuarioId))
            {
                return await BuildDraftDtoAsync(planejamento);
            }

            // For session-based plans, validate SessionId
            if ((planejamento.SessionId ?? string.Empty) != (sessionId ?? string.Empty))
            {
                return null;
            }

            return await BuildDraftDtoAsync(planejamento);
        }

        private async Task<PlanoDraftDto> BuildDraftDtoAsync(Planejamento planejamento)
        {
            var id = planejamento.Id;

            var participantesDoPlano = (await _participanteRepo.GetByPlanejamentoIdAsync(id)).ToList();

            // Fetch AportesExtras
            var aportesExtras = await _aporteExtraRepo.GetByPlanejamentoIdAsync(id);

            // Fetch AportesRegularesEditados → reconstruct Dictionary<int, decimal>
            var aporteEdits = await _historicoAporteRepo.GetByPlanejamentoIdAsync(id);
            var aportesRegularesEditados = aporteEdits
                .Where(a => string.IsNullOrEmpty(a.ParticipanteId))
                .ToDictionary(a => a.Mes, a => a.ValorEditado);

            // Fetch per-person aporte edits → reconstruct Dictionary<string, Dictionary<int, decimal>>
            var aportesRegularesEditadosPorPessoa = aporteEdits
                .Where(a => !string.IsNullOrEmpty(a.ParticipanteId))
                .GroupBy(a => a.ParticipanteId)
                .ToDictionary(
                    g => g.Key,
                    g => g.ToDictionary(a => a.Mes, a => a.ValorEditado)
                );

            // Calculate ValorJaGuardado dynamically from Participante.PatrimonioInicial
            var valorJaGuardado = participantesDoPlano.Sum(p => p.PatrimonioInicial?.Valor ?? 0);

            // Build participante DTOs with their nested data
            var participanteDtos = new List<PessoaDraftDto>();
            foreach (var p in participantesDoPlano)
            {
                var valorInicial = p.PatrimonioInicial?.Valor ?? 0;
                var tipoInvParticipante = p.PatrimonioInicial != null 
                    ? MapFonteToTipoInvestimento(p.PatrimonioInicial.Fonte, p.PatrimonioInicial.TipoInvestimento) 
                    : null;

                var gastos = await _gastoDetalhadoRepo.GetByParticipanteIdAsync(p.Id);

                participanteDtos.Add(new PessoaDraftDto
                {
                    Id = p.Id,
                    Nome = p.Nome,
                    Renda_mensal = p.RendaMensal,
                    Renda_complementar = p.RendaComplementar,
                    Gastos_mensais = p.GastosMensais,
                    Usar_gastos_detalhados = p.UsarGastosDetalhados,
                    Gastos_detalhados = gastos.Select(g => new GastoDetalhadoDraftDto
                    {
                        Id = g.Id,
                        Nome = g.Nome,
                        Valor = g.Valor,
                        Categoria = g.Categoria,
                    }).ToList(),
                    Aporte_mensal = p.AporteMensal,
                    ValorInicial = valorInicial,
                    TipoInvestimento = tipoInvParticipante,
                });
            }

            return new PlanoDraftDto
            {
                Id = planejamento.Id,
                SessionId = planejamento.SessionId,
                Objetivo = new ObjetivoDraftDto
                {
                    ValorImovel = planejamento.ValorImovel ?? 0m,
                    PercentualEntrada = planejamento.PercentualEntrada ?? 0m,
                    PercentualCustosExtras = planejamento.PercentualCustosExtras ?? 0m,
                    ValorJaGuardado = valorJaGuardado,
                    TaxaCdiAnual = planejamento.TaxaCdiAnual ?? 0m,
                    PercentualCdi = planejamento.PercentualCdi ?? 0m,
                    PrazoMaxMeses = planejamento.PrazoMaxMeses ?? 0,
                    DataInicio = planejamento.DataInicio?.ToString("yyyy-MM-dd"),
                    NomePlano = planejamento.NomePlano,
                    TipoInvestimento = planejamento.TipoInvestimento,
                },
                Pessoas = participanteDtos,
                BancoEscolhido = !string.IsNullOrEmpty(planejamento.BancoEscolhidoId)
                    ? new BancoDraftDto
                    {
                        Id = planejamento.BancoEscolhidoId,
                        Nome = planejamento.BancoEscolhidoNome ?? string.Empty,
                        Taxa = planejamento.BancoEscolhidoTaxa ?? 0,
                    }
                    : null,
                AportesExtras = aportesExtras.Select(a => new AporteExtraDraftDto
                {
                    Data = a.Data.ToString("yyyy-MM-dd"),
                    Valor = a.Valor,
                    Origem = a.Origem,
                    PessoaId = a.ParticipanteId,
                }).ToList(),
                AportesRegularesEditados = aportesRegularesEditados,
                AportesRegularesEditadosPorPessoa = aportesRegularesEditadosPorPessoa,
                MesesConcluidos = planejamento.MesesConcluidos ?? new List<int>(),
            };
        }

        public async Task ConcluirPlanoAsync(string id)
        {
            var planejamento = await _planejamentoRepo.GetByIdAsync(id);
            if (planejamento != null)
            {
                planejamento.Status = "Completed";
                await _planejamentoRepo.UpdateAsync(id, planejamento);
            }
        }

        /// <summary>
        /// Maps frontend investment type string to FonteSaldo enum.
        /// </summary>
        private static FonteSaldo MapTipoInvestimentoToFonte(string? tipo)
        {
            return tipo?.ToLowerInvariant() switch
            {
                "poupanca" => FonteSaldo.Poupanca,
                "cdb_100" => FonteSaldo.RendaFixa,
                "cdb_120" => FonteSaldo.RendaFixa,
                "tesouro_selic" => FonteSaldo.RendaFixa,
                "lci_lca" => FonteSaldo.RendaFixa,
                "fundo_di" => FonteSaldo.Investimento,
                "fgts" => FonteSaldo.FGTS,
                "cripto" => FonteSaldo.Criptomoedas,
                "previdencia" => FonteSaldo.Previdencia,
                "conta_corrente" => FonteSaldo.ContaCorrente,
                _ => FonteSaldo.Poupanca,
            };
        }

        /// <summary>
        /// Maps FonteSaldo enum back to frontend investment type string.
        /// If tipoInvestimento is provided (stored original value), it takes precedence.
        /// </summary>
        private static string? MapFonteToTipoInvestimento(FonteSaldo fonte, string? tipoInvestimento = null)
        {
            // If we have the stored original investment type, use it
            if (!string.IsNullOrEmpty(tipoInvestimento))
                return tipoInvestimento;

            // Otherwise, fall back to the enum-based mapping
            return fonte switch
            {
                FonteSaldo.Poupanca => "poupanca",
                FonteSaldo.RendaFixa => "cdb_100",
                FonteSaldo.RendaVariavel => "manual",
                FonteSaldo.Investimento => "fundo_di",
                FonteSaldo.FGTS => "fgts",
                FonteSaldo.Criptomoedas => "cripto",
                FonteSaldo.Previdencia => "previdencia",
                FonteSaldo.ContaCorrente => "conta_corrente",
                FonteSaldo.Outros => "manual",
                _ => null,
            };
        }
    }
}
