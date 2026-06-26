using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using Microsoft.EntityFrameworkCore;
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
            return await _context.AportesExtras
                .Where(a => a.PlanejamentoId == planejamentoId)
                .ToListAsync();
        }

        public async Task<IEnumerable<AporteExtra>> GetByParticipanteIdAsync(string participanteId)
        {
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

        public async Task DeleteByPlanejamentoIdAsync(string planejamentoId)
        {
            var aportes = await _context.AportesExtras
                .Where(a => a.PlanejamentoId == planejamentoId)
                .ToListAsync();
                
            if (aportes.Any())
            {
                foreach (var a in aportes)
                {
                    _context.AportesExtras.Remove(a);
                }
                await _context.SaveChangesAsync();
            }
        }
    }
}
