using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ImovPlan.Domain.Entities;
using ImovPlan.Domain.Interfaces;
using ImovPlan.Infrastructure.Data;

namespace ImovPlan.Infrastructure.Repositories
{
    public class HistoricoSimulacaoRepository : IHistoricoSimulacaoRepository
    {
        private readonly AppDbContext _context;

        public HistoricoSimulacaoRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<HistoricoSimulacao?> GetUltimoByPlanejamentoIdAsync(string planejamentoId)
        {
            return await _context.HistoricosSimulacao
                .Where(s => s.PlanejamentoId == planejamentoId)
                .OrderByDescending(s => s.GeradoEm)
                .FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<HistoricoSimulacao>> GetAllByPlanejamentoIdAsync(string planejamentoId)
        {
            return await _context.HistoricosSimulacao
                .Where(s => s.PlanejamentoId == planejamentoId)
                .OrderByDescending(s => s.GeradoEm)
                .ToListAsync();
        }

        public async Task<HistoricoSimulacao> AddAsync(HistoricoSimulacao registro)
        {
            _context.HistoricosSimulacao.Add(registro);
            await _context.SaveChangesAsync();
            return registro;
        }

        public async Task<IEnumerable<EvolucaoMensalSimulacao>> GetEvolucaoBySimulacaoIdAsync(string simulacaoId)
        {
            return await _context.EvolucoesMensaisSimulacao
                .Where(e => e.SimulacaoId == simulacaoId)
                .OrderBy(e => e.Mes)
                .ToListAsync();
        }

        public async Task DeleteAsync(string id)
        {
            // Limpa o tracker para evitar DbUpdateConcurrencyException
            _context.ChangeTracker.Clear();

            var evolucoes = await _context.EvolucoesMensaisSimulacao
                .Where(e => e.SimulacaoId == id)
                .ToListAsync();

            if (evolucoes.Any())
            {
                _context.EvolucoesMensaisSimulacao.RemoveRange(evolucoes);
                await _context.SaveChangesAsync();
                _context.ChangeTracker.Clear();
            }

            var historico = await _context.HistoricosSimulacao
                .FirstOrDefaultAsync(s => s.Id == id);

            if (historico != null)
            {
                _context.HistoricosSimulacao.Remove(historico);
                await _context.SaveChangesAsync();
            }
        }

        public async Task DeleteAllByPlanejamentoIdAsync(string planejamentoId)
        {
            // Limpa o tracker antes de comecar para evitar DbUpdateConcurrencyException.
            // MongoDB EF Core nao suporta ExecuteDeleteAsync — unico caminho e
            // ToList + RemoveRange + SaveChangesAsync, com tracker limpo a cada ciclo.
            _context.ChangeTracker.Clear();

            var simIds = await _context.HistoricosSimulacao
                .Where(s => s.PlanejamentoId == planejamentoId)
                .Select(s => s.Id)
                .ToListAsync();

            if (!simIds.Any()) return;

            // Deleta evolucoes por simulacao, salvando e limpando o tracker a cada lote
            foreach (var simId in simIds)
            {
                var evolucoes = await _context.EvolucoesMensaisSimulacao
                    .Where(e => e.SimulacaoId == simId)
                    .ToListAsync();

                if (evolucoes.Any())
                {
                    _context.EvolucoesMensaisSimulacao.RemoveRange(evolucoes);
                    await _context.SaveChangesAsync();
                    _context.ChangeTracker.Clear();
                }
            }

            // Deleta os historicos de simulacao
            var historicos = await _context.HistoricosSimulacao
                .Where(s => s.PlanejamentoId == planejamentoId)
                .ToListAsync();

            if (historicos.Any())
            {
                _context.HistoricosSimulacao.RemoveRange(historicos);
                await _context.SaveChangesAsync();
            }
        }

        public async Task AddEvolucaoAsync(IEnumerable<EvolucaoMensalSimulacao> evolucao)
        {
            await _context.EvolucoesMensaisSimulacao.AddRangeAsync(evolucao);
            await _context.SaveChangesAsync();
        }
    }
}
