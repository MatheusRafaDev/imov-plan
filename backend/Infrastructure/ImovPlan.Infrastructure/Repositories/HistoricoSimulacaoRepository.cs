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
            // ExecuteDeleteAsync bypassa o change tracker — evita DbUpdateConcurrencyException
            await _context.EvolucoesMensaisSimulacao
                .Where(e => e.SimulacaoId == id)
                .ExecuteDeleteAsync();

            await _context.HistoricosSimulacao
                .Where(s => s.Id == id)
                .ExecuteDeleteAsync();
        }

        public async Task DeleteAllByPlanejamentoIdAsync(string planejamentoId)
        {
            // 1. Obtemos os IDs das simulacoes para este planejamento
            var simIds = await _context.HistoricosSimulacao
                .Where(s => s.PlanejamentoId == planejamentoId)
                .Select(s => s.Id)
                .ToListAsync();

            if (!simIds.Any()) return;

            // 2. ExecuteDeleteAsync bypassa o change tracker do EF Core e envia
            //    o delete diretamente ao MongoDB — sem conflitos de concorrencia.
            await _context.EvolucoesMensaisSimulacao
                .Where(e => simIds.Contains(e.SimulacaoId))
                .ExecuteDeleteAsync();

            await _context.HistoricosSimulacao
                .Where(s => s.PlanejamentoId == planejamentoId)
                .ExecuteDeleteAsync();
        }

        public async Task AddEvolucaoAsync(IEnumerable<EvolucaoMensalSimulacao> evolucao)
        {
            await _context.EvolucoesMensaisSimulacao.AddRangeAsync(evolucao);
            await _context.SaveChangesAsync();
        }
    }
}

