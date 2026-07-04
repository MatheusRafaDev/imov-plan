using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ImovPlan.Domain.Entities;
using ImovPlan.Domain.Interfaces;
using ImovPlan.Infrastructure.Data;

namespace ImovPlan.Infrastructure.Repositories
{
    public class HistoricoAporteRepository : IHistoricoAporteRepository
    {
        private readonly AppDbContext _context;

        public HistoricoAporteRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<HistoricoAporte>> GetByPlanejamentoIdAsync(string planejamentoId)
        {
            return await _context.HistoricosAportes
                .Where(a => a.PlanejamentoId == planejamentoId)
                .ToListAsync();
        }

        public async Task<IEnumerable<HistoricoAporte>> GetByPlanejamentoEParticipanteAsync(string planejamentoId, string participanteId)
        {
            return await _context.HistoricosAportes
                .Where(a => a.PlanejamentoId == planejamentoId && a.ParticipanteId == participanteId)
                .ToListAsync();
        }

        public async Task UpsertByMesAsync(HistoricoAporte aporte)
        {
            // Upsert keyed by (PlanejamentoId, ParticipanteId, Mes)
            var existing = await _context.HistoricosAportes
                .FirstOrDefaultAsync(a =>
                    a.PlanejamentoId == aporte.PlanejamentoId &&
                    a.ParticipanteId == aporte.ParticipanteId &&
                    a.Mes == aporte.Mes);

            if (existing != null)
            {
                existing.ValorEditado = aporte.ValorEditado;
                existing.EditadoEm = aporte.EditadoEm;
                _context.HistoricosAportes.Update(existing);
            }
            else
            {
                _context.HistoricosAportes.Add(aporte);
            }

            await _context.SaveChangesAsync();
        }

        public async Task AddRangeAsync(IEnumerable<HistoricoAporte> aportes)
        {
            var list = aportes.ToList();
            if (list.Count == 0) return;
            _context.HistoricosAportes.AddRange(list);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteByPlanejamentoIdAsync(string planejamentoId)
        {
            var toDelete = await _context.HistoricosAportes
                .Where(a => a.PlanejamentoId == planejamentoId)
                .ToListAsync();

            if (toDelete.Any())
            {
                _context.HistoricosAportes.RemoveRange(toDelete);
                await _context.SaveChangesAsync();
            }
        }
    }
}
