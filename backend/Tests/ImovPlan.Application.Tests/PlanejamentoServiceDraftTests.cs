using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using ImovPlan.Application.DTOs;
using ImovPlan.Application.Services;
using ImovPlan.Domain.Entities;
using ImovPlan.Domain.Interfaces;
using ImovPlan.Infrastructure.Data;
using ImovPlan.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;
using MongoDB.Bson;
using Moq;
using Xunit;

namespace ImovPlan.Application.Tests
{
    public class PlanejamentoServiceDraftTests
    {
        [Fact]
        public async Task UpdateDraftAsync_WithExistingPlanAndPeople_SucceedsWithoutException()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            using var context = new AppDbContext(options);
            var cache = new MemoryCache(new MemoryCacheOptions());

            var planRepo = new PlanejamentoRepository(context);
            var partRepo = new ParticipanteRepository(context);
            var extraRepo = new AporteExtraRepository(context);
            var histRepo = new HistoricoAporteRepository(context);
            var gastoRepo = new GastoDetalhadoRepository(context);
            var paramRepo = new ParametrosFinanceirosRepository(context, cache);
            var simRepo = new Mock<IHistoricoSimulacaoRepository>().Object;

            var planId = ObjectId.GenerateNewId().ToString();
            var userId = ObjectId.GenerateNewId().ToString();
            var pessoaId = ObjectId.GenerateNewId().ToString();

            // Seed initial data
            var plan = new Planejamento
            {
                Id = planId,
                UsuarioId = userId,
                NomePlano = "Plano Teste",
                ParticipantesIds = new List<string> { pessoaId }
            };
            context.Planejamentos.Add(plan);

            var part = new Participante
            {
                Id = pessoaId,
                PlanejamentoId = planId,
                Nome = "Rafael",
                RendaMensal = 5000,
                PatrimonioInicial = new PatrimonioInicial
                {
                    Valor = 10000,
                    TipoInvestimento = "cdb_100"
                }
            };
            context.Participantes.Add(part);
            await context.SaveChangesAsync();

            var service = new PlanejamentoService(
                planRepo,
                partRepo,
                extraRepo,
                histRepo,
                gastoRepo,
                paramRepo,
                simRepo,
                NullLogger<PlanejamentoService>.Instance
            );

            var draftDto = new PlanoDraftDto
            {
                Objetivo = new ObjetivoDraftDto
                {
                    NomePlano = "Novo Nome",
                    ValorImovel = 500000,
                    PercentualEntrada = 20,
                    PercentualCustosExtras = 5,
                    ValorJaGuardado = 20000,
                    TaxaCdiAnual = 10.5m,
                    PercentualCdi = 100,
                    PrazoMaxMeses = 120,
                    TipoInvestimento = "cdb_100"
                },
                Pessoas = new List<PessoaDraftDto>
                {
                    new PessoaDraftDto
                    {
                        Id = pessoaId,
                        Nome = "Rafael Atualizado",
                        Renda_mensal = 6000,
                        ValorInicial = 20000,
                        TipoInvestimento = "cdb_100"
                    }
                },
                AportesExtras = new List<AporteExtraDraftDto>
                {
                    new AporteExtraDraftDto
                    {
                        Data = DateTime.UtcNow.ToString("yyyy-MM-dd"),
                        Valor = 5000,
                        Origem = "13º Salário",
                        PessoaId = pessoaId
                    }
                }
            };

            var result = await service.UpdateDraftAsync(planId, draftDto, userId);
            Assert.True(result);

            // Second save (simulates autosave debounce firing again on user typing)
            draftDto.Objetivo.ValorImovel = 550000;
            var result2 = await service.UpdateDraftAsync(planId, draftDto, userId);
            Assert.True(result2);
        }

        [Fact]
        public async Task GetDraftAsync_And_UpdateDraftAsync_WithLegacyAporteExtraNullFields_SucceedsAndMapsDefaults()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            using var context = new AppDbContext(options);
            var cache = new MemoryCache(new MemoryCacheOptions());

            var planRepo = new PlanejamentoRepository(context);
            var partRepo = new ParticipanteRepository(context);
            var extraRepo = new AporteExtraRepository(context);
            var histRepo = new HistoricoAporteRepository(context);
            var gastoRepo = new GastoDetalhadoRepository(context);
            var paramRepo = new ParametrosFinanceirosRepository(context, cache);
            var simRepo = new Mock<IHistoricoSimulacaoRepository>().Object;

            var planId = ObjectId.GenerateNewId().ToString();
            var userId = ObjectId.GenerateNewId().ToString();

            var plan = new Planejamento
            {
                Id = planId,
                UsuarioId = userId,
                NomePlano = "Plano Legado",
                ParticipantesIds = new List<string>()
            };
            context.Planejamentos.Add(plan);

            // Legacy aporte extra without revertido, tipo, or createdAt (null)
            var legacyAporte = new AporteExtra
            {
                Id = ObjectId.GenerateNewId().ToString(),
                PlanejamentoId = planId,
                Valor = 1500,
                Data = DateTime.UtcNow,
                Origem = "Bônus",
                Tipo = null,
                Revertido = null,
                CreatedAt = null
            };
            context.AportesExtras.Add(legacyAporte);
            await context.SaveChangesAsync();

            var service = new PlanejamentoService(
                planRepo,
                partRepo,
                extraRepo,
                histRepo,
                gastoRepo,
                paramRepo,
                simRepo,
                NullLogger<PlanejamentoService>.Instance
            );

            // Fetch draft and assert safe fallback mapping
            var draft = await service.GetDraftAsync(planId, userId);
            Assert.NotNull(draft);
            Assert.NotNull(draft.AportesExtras);
            Assert.Single(draft.AportesExtras);
            Assert.False(draft.AportesExtras[0].Revertido);
            Assert.Equal("Aporte", draft.AportesExtras[0].Tipo);

            // Update draft (deletes existing and adds new)
            Assert.NotNull(draft.Objetivo);
            draft.Objetivo.NomePlano = "Plano Atualizado";
            var updated = await service.UpdateDraftAsync(planId, draft, userId);
            Assert.True(updated);
        }
    }
}
