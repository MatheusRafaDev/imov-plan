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
                return false; // Unauthorized or not found
            }

            // Update Objetivo fields if provided
            if (draftDto.Objetivo != null)
            {
                existingObjetivo.ValorImovel = draftDto.Objetivo.ValorImovel;
                existingObjetivo.PercentualEntrada = draftDto.Objetivo.PercentualEntrada;
                existingObjetivo.PrazoMeses = draftDto.Objetivo.PrazoMeses;
                existingObjetivo.TaxaCDI = draftDto.Objetivo.TaxaCDI;
                existingObjetivo.CustoITBI = draftDto.Objetivo.CustoITBI;
                existingObjetivo.CustoEscritura = draftDto.Objetivo.CustoEscritura;
                existingObjetivo.ValorJaGuardado = draftDto.Objetivo.ValorJaGuardado;
                
                await _objetivoRepo.UpdateAsync(id, existingObjetivo);
            }

            // Upsert Pessoas
            if (draftDto.Pessoas != null && draftDto.Pessoas.Count > 0)
            {
                var existingPessoas = await _pessoaRepo.GetAllAsync();
                var planPessoas = existingPessoas.Where(p => p.ObjetivoImovelId == id).ToList();

                foreach (var pessoa in draftDto.Pessoas)
                {
                    pessoa.ObjetivoImovelId = id;

                    // Extremely simple UPSERT logic for MVP
                    // Se a pessoa já tem ID de mongo válido (24 hex), tenta atualizar
                    if (!string.IsNullOrEmpty(pessoa.Id) && pessoa.Id.Length == 24)
                    {
                        var dbPessoa = await _pessoaRepo.GetByIdAsync(pessoa.Id);
                        if (dbPessoa != null)
                        {
                            await _pessoaRepo.UpdateAsync(pessoa.Id, pessoa);
                            continue;
                        }
                    }
                    
                    // Se chegou aqui, precisa criar
                    // Reset ID to let MongoDB generate it correctly if the frontend passed a fake one
                    pessoa.Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString();
                    await _pessoaRepo.CreateAsync(pessoa);
                }
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
                Objetivo = objetivo,
                Pessoas = pessoasDoPlano
            };
        }
    }
}
