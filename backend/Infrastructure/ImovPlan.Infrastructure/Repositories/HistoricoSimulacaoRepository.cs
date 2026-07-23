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
            var existingEvolutions = await _context.EvolucoesMensaisSimulacao.Where(e => e.SimulacaoId == id).ToListAsync();
            if (existingEvolutions.Any())
            {
                _context.EvolucoesMensaisSimulacao.RemoveRange(existingEvolutions);
            }

            var existing = await _context.HistoricosSimulacao.FirstOrDefaultAsync(s => s.Id == id);
            if (existing != null)
            {
                _context.HistoricosSimulacao.Remove(existing);
            }

            await _context.SaveChangesAsync();
        }

        public async Task DeleteAllByPlanejamentoIdAsync(string planejamentoId)
        {
            var existingSims = await _context.HistoricosSimulacao.Where(s => s.PlanejamentoId == planejamentoId).ToListAsync();
            if (existingSims.Any())
            {
                var simIds = existingSims.Select(s => s.Id).ToList();
                var existingEvolutions = new List<EvolucaoMensalSimulacao>();
                foreach (var simId in simIds)
                {
                    var evolucoes = await _context.EvolucoesMensaisSimulacao.Where(e => e.SimulacaoId == simId).ToListAsync();
                    existingEvolutions.AddRange(evolucoes);
                }
                
                if (existingEvolutions.Any())
                {
                    _context.EvolucoesMensaisSimulacao.RemoveRange(existingEvolutions);
                }

                _context.HistoricosSimulacao.RemoveRange(existingSims);
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
