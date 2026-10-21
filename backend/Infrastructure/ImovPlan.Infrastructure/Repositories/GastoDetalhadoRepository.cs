using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using MongoDB.Bson;
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
            if (string.IsNullOrEmpty(participanteId))
                return Enumerable.Empty<GastoDetalhado>();

            return await _context.GastosDetalhados
                .Where(g => g.ParticipanteId == participanteId)
                .ToListAsync();
        }

        public async Task<IEnumerable<GastoDetalhado>> GetByPlanejamentoIdAsync(string planejamentoId)
        {
            if (string.IsNullOrEmpty(planejamentoId) || !ObjectId.TryParse(planejamentoId, out _))
                return Enumerable.Empty<GastoDetalhado>();

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

        public async Task AddRangeAsync(IEnumerable<GastoDetalhado> gastos)
        {
            var list = gastos.ToList();
            if (list.Count == 0) return;
            _context.GastosDetalhados.AddRange(list);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(string id)
        {
            if (string.IsNullOrEmpty(id) || !ObjectId.TryParse(id, out _))
                return;

            var existing = await _context.GastosDetalhados.FirstOrDefaultAsync(g => g.Id == id);
            if (existing != null)
            {
                _context.GastosDetalhados.Remove(existing);
                await _context.SaveChangesAsync();
            }
        }

        public async Task DeleteByParticipanteIdAsync(string participanteId)
        {
            if (string.IsNullOrEmpty(participanteId))
                return;

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
            if (string.IsNullOrEmpty(planejamentoId) || !ObjectId.TryParse(planejamentoId, out _))
                return;

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
