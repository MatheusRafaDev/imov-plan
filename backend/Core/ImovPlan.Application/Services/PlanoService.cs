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
        private readonly ICustosImovelRepository _custosRepo;
        private readonly ISaldoInicialRepository _saldoRepo;
        private readonly IAporteExtraRepository _aporteExtraRepo;
        private readonly IAporteRegularEditRepository _aporteRegularEditRepo;
        private readonly IGastoDetalhadoRepository _gastoDetalhadoRepo;

        public PlanoService(
            IObjetivoRepository objetivoRepo,
            IPessoaRepository pessoaRepo,
            ICustosImovelRepository custosRepo,
            ISaldoInicialRepository saldoRepo,
            IAporteExtraRepository aporteExtraRepo,
            IAporteRegularEditRepository aporteRegularEditRepo,
            IGastoDetalhadoRepository gastoDetalhadoRepo)
        {
            _objetivoRepo = objetivoRepo;
            _pessoaRepo = pessoaRepo;
            _custosRepo = custosRepo;
            _saldoRepo = saldoRepo;
            _aporteExtraRepo = aporteExtraRepo;
            _aporteRegularEditRepo = aporteRegularEditRepo;
            _gastoDetalhadoRepo = gastoDetalhadoRepo;
        }

        public async Task<string> CreateDraftAsync(string sessionId)
        {
            var existing = await _objetivoRepo.GetBySessionIdAsync(sessionId);
            if (existing != null)
            {
                return existing.Id;
            }

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

                // Persist CustosImovel (computed from objetivo fields)
                var valorEntrada = o.ValorImovel * o.PercentualEntrada / 100m;
                var custoITBI = o.ValorImovel * 0.02m;
                var custoEscritura = o.ValorImovel * 0.01m;
                var custoRegistro = o.ValorImovel * 0.005m;
                var totalNecessario = valorEntrada + (o.ValorImovel * o.PercentualCustosExtras / 100m);

                await _custosRepo.UpsertAsync(new CustosImovel
                {
                    ObjetivoImovelId = id,
                    ValorEntrada = valorEntrada,
                    TotalNecessario = totalNecessario,
                    PercentualCustosExtras = o.PercentualCustosExtras,
                    CustoITBI = custoITBI,
                    CustoEscritura = custoEscritura,
                    CustoRegistro = custoRegistro,
                    CalculadoEm = DateTime.UtcNow,
                });
            }

            // ── Map Banco Escolhido ──
            if (draftDto.BancoEscolhido != null)
            {
                existingObjetivo.BancoEscolhidoId = draftDto.BancoEscolhido.Id;
                existingObjetivo.BancoEscolhidoNome = draftDto.BancoEscolhido.Nome;
                existingObjetivo.BancoEscolhidoTaxa = draftDto.BancoEscolhido.Taxa;
            }

            // ── Map Aportes Extras → AporteExtraRepository ──
            if (draftDto.AportesExtras != null)
            {
                // Delete existing AportesExtras to prevent duplication on save
                await _aporteExtraRepo.DeleteByObjetivoIdAsync(id);

                foreach (var a in draftDto.AportesExtras)
                {
                    await _aporteExtraRepo.AddAsync(new AporteExtra
                    {
                        ObjetivoImovelId = id,
                        PessoaId = a.PessoaId ?? string.Empty,
                        PessoaNome = a.PessoaNome ?? string.Empty,
                        Data = !string.IsNullOrEmpty(a.Data) && DateTime.TryParse(a.Data, out var d) ? d : DateTime.UtcNow,
                        Valor = a.Valor,
                        Origem = a.Origem,
                    });
                }
            }

            // ── Map AportesRegularesEditados → AporteRegularEditRepository ──
            if (draftDto.AportesRegularesEditados != null)
            {
                foreach (var kvp in draftDto.AportesRegularesEditados)
                {
                    await _aporteRegularEditRepo.UpsertByMesAsync(new AporteRegularEdit
                    {
                        ObjetivoImovelId = id,
                        PessoaId = string.Empty, // Plan-level edit, not person-specific
                        Mes = kvp.Key,
                        ValorEditado = kvp.Value,
                        EditadoEm = DateTime.UtcNow,
                    });
                }
            }

            // ── Map Monthly Tracking Data ──
            if (draftDto.MesesConcluidos != null)
            {
                existingObjetivo.MesesConcluidos = draftDto.MesesConcluidos;
            }

            await _objetivoRepo.UpdateAsync(id, existingObjetivo);

            // ── Upsert Pessoas ──
            if (draftDto.Pessoas != null && draftDto.Pessoas.Count > 0)
            {
                // Delete existing pessoas and their related data, then recreate
                var allPessoas = await _pessoaRepo.GetAllAsync();
                var planPessoas = allPessoas.Where(p => p.ObjetivoImovelId == id).ToList();
                foreach (var old in planPessoas)
                {
                    // Delete related gastos detalhados
                    var gastos = await _gastoDetalhadoRepo.GetByPessoaIdAsync(old.Id);
                    foreach (var g in gastos)
                        await _gastoDetalhadoRepo.DeleteAsync(g.Id);

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
                        SobraMensal = pDto.Renda_mensal + pDto.Renda_complementar - pDto.Gastos_mensais,
                        AporteMensal = pDto.Aporte_mensal,
                    };
                    await _pessoaRepo.CreateAsync(pessoa);
                    newPessoaIds.Add(pessoa.Id);

                    // Persist SaldoInicial
                    if (pDto.ValorInicial > 0)
                    {
                        await _saldoRepo.AddAsync(new SaldoInicial
                        {
                            PessoaId = pessoa.Id,
                            ObjetivoImovelId = id,
                            Valor = pDto.ValorInicial,
                            Fonte = "Poupança", // Default source; can be expanded later
                            RegistradoEm = DateTime.UtcNow,
                        });
                    }

                    // Persist GastosDetalhados
                    if (pDto.Gastos_detalhados != null)
                    {
                        foreach (var gDto in pDto.Gastos_detalhados)
                        {
                            await _gastoDetalhadoRepo.AddAsync(new GastoDetalhado
                            {
                                PessoaId = pessoa.Id,
                                Nome = gDto.Nome,
                                Valor = gDto.Valor,
                                Categoria = gDto.Categoria,
                            });
                        }
                    }
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

            // Fetch CustosImovel
            var custos = await _custosRepo.GetByObjetivoIdAsync(id);

            // Fetch AportesExtras
            var aportesExtras = await _aporteExtraRepo.GetByObjetivoIdAsync(id);

            // Fetch AportesRegularesEditados → reconstruct Dictionary<int, decimal>
            var aporteEdits = await _aporteRegularEditRepo.GetByObjetivoIdAsync(id);
            var aportesRegularesEditados = aporteEdits
                .Where(a => string.IsNullOrEmpty(a.PessoaId))
                .ToDictionary(a => a.Mes, a => a.ValorEditado);

            // Build pessoa DTOs with their nested data
            var pessoaDtos = new List<PessoaDraftDto>();
            foreach (var p in pessoasDoPlano)
            {
                var saldos = await _saldoRepo.GetByPessoaIdAsync(p.Id);
                var valorInicial = saldos.Sum(s => s.Valor);

                var gastos = await _gastoDetalhadoRepo.GetByPessoaIdAsync(p.Id);

                pessoaDtos.Add(new PessoaDraftDto
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
                });
            }

            return new PlanoDraftDto
            {
                Id = objetivo.Id,
                SessionId = objetivo.SessionId,
                Objetivo = new ObjetivoDraftDto
                {
                    ValorImovel = objetivo.ValorImovel,
                    PercentualEntrada = objetivo.PercentualEntrada,
                    PercentualCustosExtras = custos?.PercentualCustosExtras ?? 0,
                    ValorJaGuardado = objetivo.ValorJaGuardado,
                    TaxaCdiAnual = objetivo.TaxaCdiAnual,
                    PercentualCdi = objetivo.PercentualCdi,
                    PrazoMaxMeses = objetivo.PrazoMaxMeses,
                    DataInicio = objetivo.DataInicio?.ToString("yyyy-MM-dd"),
                    NomePlano = objetivo.NomePlano,
                },
                Pessoas = pessoaDtos,
                BancoEscolhido = !string.IsNullOrEmpty(objetivo.BancoEscolhidoId)
                    ? new BancoDraftDto
                    {
                        Id = objetivo.BancoEscolhidoId,
                        Nome = objetivo.BancoEscolhidoNome ?? string.Empty,
                        Taxa = objetivo.BancoEscolhidoTaxa ?? 0,
                    }
                    : null,
                AportesExtras = aportesExtras.Select(a => new AporteExtraDraftDto
                {
                    Data = a.Data.ToString("yyyy-MM-dd"),
                    Valor = a.Valor,
                    Origem = a.Origem,
                    PessoaNome = a.PessoaNome,
                    PessoaId = a.PessoaId,
                }).ToList(),
                AportesRegularesEditados = aportesRegularesEditados,
                MesesConcluidos = objetivo.MesesConcluidos ?? new List<int>(),
            };
        }

        public async Task ConcluirPlanoAsync(string id)
        {
            var objetivo = await _objetivoRepo.GetByIdAsync(id);
            if (objetivo != null)
            {
                objetivo.Status = "Completed";
                await _objetivoRepo.UpdateAsync(id, objetivo);
            }
        }
    }
}
