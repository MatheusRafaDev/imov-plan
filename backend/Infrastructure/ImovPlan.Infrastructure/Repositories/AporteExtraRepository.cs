using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using MongoDB.Bson;
using ImovPlan.Domain.Entities;
using ImovPlan.Domain.Interfaces;
using ImovPlan.Infrastructure.Data;

namespace ImovPlan.Infrastructure.Repositories
{
    public class AporteExtraRepository : IAporteExtraRepository
    {
        private readonly AppDbContext _context;

        public AporteExtraRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<AporteExtra>> GetByPlanejamentoIdAsync(string planejamentoId)
        {
            if (string.IsNullOrEmpty(planejamentoId) || !ObjectId.TryParse(planejamentoId, out _))
                return Enumerable.Empty<AporteExtra>();

            return await _context.AportesExtras
                .Where(a => a.PlanejamentoId == planejamentoId)
                .ToListAsync();
        }

        public async Task<IEnumerable<AporteExtra>> GetByParticipanteIdAsync(string participanteId)
        {
            if (string.IsNullOrEmpty(participanteId))
                return Enumerable.Empty<AporteExtra>();

            return await _context.AportesExtras
                .Where(a => a.ParticipanteId != null && a.ParticipanteId == participanteId)
                .ToListAsync();
        }

        public async Task<AporteExtra> AddAsync(AporteExtra aporte)
        {
            _context.AportesExtras.Add(aporte);
            await _context.SaveChangesAsync();
            return aporte;
        }

        public async Task AddRangeAsync(IEnumerable<AporteExtra> aportes)
        {
            var list = aportes.ToList();
            if (list.Count == 0) return;
            _context.AportesExtras.AddRange(list);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteByPlanejamentoIdAsync(string planejamentoId)
        {
            if (string.IsNullOrEmpty(planejamentoId) || !ObjectId.TryParse(planejamentoId, out _))
                return;

            var aportes = await _context.AportesExtras
                .Where(a => a.PlanejamentoId == planejamentoId)
                .ToListAsync();
                
            if (aportes.Any())
            {
                _context.AportesExtras.RemoveRange(aportes);
                await _context.SaveChangesAsync();
            }
        }
    }
}
