using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ImovPlan.Domain.Entities;
using ImovPlan.Domain.Interfaces;
using ImovPlan.Infrastructure.Data;

namespace ImovPlan.Infrastructure.Repositories
{
    public class ParametrosFinanceirosRepository : IParametrosFinanceirosRepository
    {
        private readonly AppDbContext _context;

        public ParametrosFinanceirosRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ParametrosFinanceiros> GetAtivoAsync()
        {
            var parametros = await _context.ParametrosFinanceiros
                .FirstOrDefaultAsync(p => p.Ativo && p.Codigo == "default");

            if (parametros != null)
            {
                return parametros;
            }

            parametros = ParametrosFinanceiros.Default();
            _context.ParametrosFinanceiros.Add(parametros);
            await _context.SaveChangesAsync();
            return parametros;
        }

        public async Task<ParametrosFinanceiros> UpsertAsync(ParametrosFinanceiros parametros)
        {
            var existing = await _context.ParametrosFinanceiros
                .FirstOrDefaultAsync(p => p.Codigo == (parametros.Codigo == string.Empty ? "default" : parametros.Codigo));

            parametros.Codigo = string.IsNullOrWhiteSpace(parametros.Codigo) ? "default" : parametros.Codigo;
            parametros.Ativo = true;
            parametros.AtualizadoEm = DateTime.UtcNow;

            if (existing == null)
            {
                _context.ParametrosFinanceiros.Add(parametros);
                await _context.SaveChangesAsync();
                return parametros;
            }

            existing.Descricao = parametros.Descricao;
            existing.TaxaCdiAnualPadrao = parametros.TaxaCdiAnualPadrao;
            existing.PercentualCdiPadrao = parametros.PercentualCdiPadrao;
            existing.PrazoMaxSimulacaoMeses = parametros.PrazoMaxSimulacaoMeses;
            existing.PrazoFinanciamentoPadraoMeses = parametros.PrazoFinanciamentoPadraoMeses;
            existing.TaxaFinanciamentoAnualPadrao = parametros.TaxaFinanciamentoAnualPadrao;
            existing.LimiteComprometimentoRenda = parametros.LimiteComprometimentoRenda;
            existing.FgtsPercentualParcela = parametros.FgtsPercentualParcela;
            existing.CustoItbiPadrao = parametros.CustoItbiPadrao;
            existing.CustoEscrituraPadrao = parametros.CustoEscrituraPadrao;
            existing.CustoRegistroPadrao = parametros.CustoRegistroPadrao;
            existing.ItbiIsencaoSp = parametros.ItbiIsencaoSp;
            existing.TetoSfh = parametros.TetoSfh;
            existing.ItbiCheio = parametros.ItbiCheio;
            existing.ItbiSfh = parametros.ItbiSfh;
            existing.CapCustosCompra = parametros.CapCustosCompra;
            existing.Investimentos = parametros.Investimentos;
            existing.AliquotasIr = parametros.AliquotasIr;
            existing.FaixasCartorio = parametros.FaixasCartorio;
            existing.BancosFinanciamento = parametros.BancosFinanciamento;
            existing.AtualizadoEm = parametros.AtualizadoEm;

            _context.ParametrosFinanceiros.Update(existing);
            await _context.SaveChangesAsync();
            return existing;
        }
    }
}
