using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ImovPlan.Domain.Entities;
using ImovPlan.Domain.Interfaces;
using ImovPlan.Infrastructure.Data;

namespace ImovPlan.Infrastructure.Repositories
{
    public class SnapshotSimulacaoRepository : ISnapshotSimulacaoRepository
    {
        private readonly AppDbContext _context;

        public SnapshotSimulacaoRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<SnapshotSimulacao?> GetUltimoByObjetivoIdAsync(string objetivoId)
        {
            return await _context.SnapshotsSimulacao
                .Where(s => s.ObjetivoImovelId == objetivoId)
                .OrderByDescending(s => s.GeradoEm)
                .FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<SnapshotSimulacao>> GetAllByObjetivoIdAsync(string objetivoId)
        {
            return await _context.SnapshotsSimulacao
                .Where(s => s.ObjetivoImovelId == objetivoId)
                .OrderByDescending(s => s.GeradoEm)
                .ToListAsync();
        }

        public async Task<SnapshotSimulacao> AddAsync(SnapshotSimulacao snapshot)
        {
            _context.SnapshotsSimulacao.Add(snapshot);
            await _context.SaveChangesAsync();
            return snapshot;
        }
    }
}
