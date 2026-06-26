using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ImovPlan.Domain.Entities;
using ImovPlan.Domain.Interfaces;
using ImovPlan.Infrastructure.Data;

namespace ImovPlan.Infrastructure.Repositories
{
    public class GastoDetalhadoRepository : IGastoDetalhadoRepository
    {
        private readonly AppDbContext _context;

        public GastoDetalhadoRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<GastoDetalhado>> GetByParticipanteIdAsync(string participanteId)
        {
            return await _context.GastosDetalhados
                .Where(g => g.ParticipanteId == participanteId)
                .ToListAsync();
        }

        public async Task<IEnumerable<GastoDetalhado>> GetByPlanejamentoIdAsync(string planejamentoId)
        {
            return await _context.GastosDetalhados
                .Where(g => g.PlanejamentoId == planejamentoId)
                .ToListAsync();
        }

        public async Task<GastoDetalhado> AddAsync(GastoDetalhado gasto)
        {
            _context.GastosDetalhados.Add(gasto);
            await _context.SaveChangesAsync();
            return gasto;
        }

        public async Task DeleteAsync(string id)
        {
            var existing = await _context.GastosDetalhados.FirstOrDefaultAsync(g => g.Id == id);
            if (existing != null)
            {
                _context.GastosDetalhados.Remove(existing);
                await _context.SaveChangesAsync();
            }
        }

        public async Task DeleteByParticipanteIdAsync(string participanteId)
        {
            var gastos = await _context.GastosDetalhados
                .Where(g => g.ParticipanteId == participanteId)
                .ToListAsync();

            if (gastos.Any())
            {
                _context.GastosDetalhados.RemoveRange(gastos);
                await _context.SaveChangesAsync();
            }
        }

        public async Task DeleteByPlanejamentoIdAsync(string planejamentoId)
        {
            var gastos = await _context.GastosDetalhados
                .Where(g => g.PlanejamentoId == planejamentoId)
                .ToListAsync();

            if (gastos.Any())
            {
                _context.GastosDetalhados.RemoveRange(gastos);
                await _context.SaveChangesAsync();
            }
        }
    }
}
