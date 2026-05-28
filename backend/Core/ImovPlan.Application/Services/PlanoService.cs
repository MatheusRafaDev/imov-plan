using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using ImovPlan.Application.DTOs;
using ImovPlan.Application.Services.Interfaces;
using ImovPlan.Domain.Entities;
using ImovPlan.Domain.Interfaces;

namespace ImovPlan.Application.Services
{
    public class PlanoService : IPlanoService
    {
        private readonly IObjetivoRepository _objetivoRepo;
        private readonly IPessoaRepository _pessoaRepo;

        public PlanoService(IObjetivoRepository objetivoRepo, IPessoaRepository pessoaRepo)
        {
            _objetivoRepo = objetivoRepo;
            _pessoaRepo = pessoaRepo;
        }

        public async Task<string> CreateDraftAsync(string sessionId)
        {
            var objetivo = new ObjetivoImovel
            {
                SessionId = sessionId,
                Status = "Draft"
            };

            await _objetivoRepo.CreateAsync(objetivo);
            return objetivo.Id;
        }

        public async Task<bool> UpdateDraftAsync(string id, PlanoDraftDto draftDto)
        {
            var existingObjetivo = await _objetivoRepo.GetByIdAsync(id);
            if (existingObjetivo == null || existingObjetivo.SessionId != draftDto.SessionId)
            {
                return false;
            }

            // ── Map Objetivo fields ──
            if (draftDto.Objetivo != null)
            {
                var o = draftDto.Objetivo;
                existingObjetivo.ValorImovel = o.ValorImovel;
                existingObjetivo.PercentualEntrada = o.PercentualEntrada;
                existingObjetivo.PercentualCustosExtras = o.PercentualCustosExtras;
                existingObjetivo.ValorJaGuardado = o.ValorJaGuardado;
                existingObjetivo.TaxaCdiAnual = o.TaxaCdiAnual;
                existingObjetivo.PercentualCdi = o.PercentualCdi;
                existingObjetivo.PrazoMaxMeses = o.PrazoMaxMeses;
                existingObjetivo.NomePlano = string.IsNullOrWhiteSpace(o.NomePlano) ? "Imóvel" : o.NomePlano.Trim();

                if (!string.IsNullOrEmpty(o.DataInicio))
                {
                    if (DateTime.TryParse(o.DataInicio, out var dt))
                        existingObjetivo.DataInicio = dt;
                }

                // Computed fields
                existingObjetivo.ValorEntrada = o.ValorImovel * o.PercentualEntrada / 100m;
                existingObjetivo.TotalNecessario = existingObjetivo.ValorEntrada + (o.ValorImovel * o.PercentualCustosExtras / 100m);
            }

            // ── Map Banco Escolhido ──
            if (draftDto.BancoEscolhido != null)
            {
                existingObjetivo.BancoEscolhidoId = draftDto.BancoEscolhido.Id;
                existingObjetivo.BancoEscolhidoNome = draftDto.BancoEscolhido.Nome;
                existingObjetivo.BancoEscolhidoTaxa = draftDto.BancoEscolhido.Taxa;
            }

            // ── Map Aportes Extras ──
            if (draftDto.AportesExtras != null)
            {
                existingObjetivo.AportesExtras = draftDto.AportesExtras.Select(a => new AporteExtra
                {
                    Data = !string.IsNullOrEmpty(a.Data) && DateTime.TryParse(a.Data, out var d) ? d : DateTime.UtcNow,
                    Valor = a.Valor,
                    Origem = a.Origem,
                    PessoaNome = a.PessoaNome ?? string.Empty
                }).ToList();
            }

            await _objetivoRepo.UpdateAsync(id, existingObjetivo);

            // ── Upsert Pessoas ──
            if (draftDto.Pessoas != null && draftDto.Pessoas.Count > 0)
            {
                // Delete existing pessoas for this plan and recreate
                // This is simpler and avoids orphan records when people are removed
                var allPessoas = await _pessoaRepo.GetAllAsync();
                var planPessoas = allPessoas.Where(p => p.ObjetivoImovelId == id).ToList();
                foreach (var old in planPessoas)
                {
                    await _pessoaRepo.DeleteAsync(old.Id);
                }

                var newPessoaIds = new List<string>();
                foreach (var pDto in draftDto.Pessoas)
                {
                    var pessoa = new Pessoa
                    {
                        Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString(),
                        ObjetivoImovelId = id,
                        Nome = pDto.Nome,
                        RendaMensal = pDto.Renda_mensal,
                        RendaComplementar = pDto.Renda_complementar,
                        GastosMensais = pDto.Gastos_mensais,
                        UsarGastosDetalhados = pDto.Usar_gastos_detalhados,
                        GastosDetalhados = pDto.Gastos_detalhados?.Select(g => new GastoDetalhado
                        {
                            Id = g.Id ?? Guid.NewGuid().ToString(),
                            Nome = g.Nome,
                            Valor = g.Valor
                        }).ToList() ?? new List<GastoDetalhado>(),
                        SobraMensal = pDto.Renda_mensal + pDto.Renda_complementar - pDto.Gastos_mensais,
                        AporteMensal = pDto.Aporte_mensal,
                    };
                    await _pessoaRepo.CreateAsync(pessoa);
                    newPessoaIds.Add(pessoa.Id);
                }

                // Update pessoasIds reference on the objetivo
                existingObjetivo.PessoasIds = newPessoaIds;
                await _objetivoRepo.UpdateAsync(id, existingObjetivo);
            }

            return true;
        }

        public async Task<PlanoDraftDto?> GetDraftAsync(string id, string sessionId)
        {
            var objetivo = await _objetivoRepo.GetByIdAsync(id);
            if (objetivo == null || objetivo.SessionId != sessionId)
            {
                return null;
            }

            var allPessoas = await _pessoaRepo.GetAllAsync();
            var pessoasDoPlano = allPessoas.Where(p => p.ObjetivoImovelId == id).ToList();

            return new PlanoDraftDto
            {
                Id = objetivo.Id,
                SessionId = objetivo.SessionId,
                Objetivo = new ObjetivoDraftDto
                {
                    ValorImovel = objetivo.ValorImovel,
                    PercentualEntrada = objetivo.PercentualEntrada,
                    PercentualCustosExtras = objetivo.PercentualCustosExtras,
                    ValorJaGuardado = objetivo.ValorJaGuardado,
                    TaxaCdiAnual = objetivo.TaxaCdiAnual,
                    PercentualCdi = objetivo.PercentualCdi,
                    PrazoMaxMeses = objetivo.PrazoMaxMeses,
                    DataInicio = objetivo.DataInicio?.ToString("yyyy-MM-dd"),
                    NomePlano = objetivo.NomePlano,
                },
                Pessoas = pessoasDoPlano.Select(p => new PessoaDraftDto
                {
                    Id = p.Id,
                    Nome = p.Nome,
                    Renda_mensal = p.RendaMensal,
                    Renda_complementar = p.RendaComplementar,
                    Gastos_mensais = p.GastosMensais,
                    Usar_gastos_detalhados = p.UsarGastosDetalhados,
                    Gastos_detalhados = p.GastosDetalhados?.Select(g => new GastoDetalhadoDraftDto
                    {
                        Id = g.Id,
                        Nome = g.Nome,
                        Valor = g.Valor
                    }).ToList() ?? new List<GastoDetalhadoDraftDto>(),
                    Aporte_mensal = p.AporteMensal,
                }).ToList(),
                BancoEscolhido = !string.IsNullOrEmpty(objetivo.BancoEscolhidoId)
                    ? new BancoDraftDto
                    {
                        Id = objetivo.BancoEscolhidoId,
                        Nome = objetivo.BancoEscolhidoNome ?? string.Empty,
                        Taxa = objetivo.BancoEscolhidoTaxa ?? 0,
                    }
                    : null,
                AportesExtras = objetivo.AportesExtras?.Select(a => new AporteExtraDraftDto
                {
                    Data = a.Data.ToString("yyyy-MM-dd"),
                    Valor = a.Valor,
                    Origem = a.Origem,
                    PessoaNome = a.PessoaNome,
                }).ToList() ?? new List<AporteExtraDraftDto>(),
            };
        }
    }
}
