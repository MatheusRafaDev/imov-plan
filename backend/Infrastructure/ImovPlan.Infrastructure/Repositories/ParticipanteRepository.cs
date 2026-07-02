using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using MongoDB.Bson;
using ImovPlan.Domain.Entities;
using ImovPlan.Domain.Interfaces;
using ImovPlan.Infrastructure.Data;

namespace ImovPlan.Infrastructure.Repositories
{
    public class ParticipanteRepository : IParticipanteRepository
    {
        private readonly AppDbContext _context;

        public ParticipanteRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Participante?> GetByIdAsync(string id)
        {
            if (!ObjectId.TryParse(id, out _))
                return null;

            return await _context.Participantes.FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<IEnumerable<Participante>> GetByPlanejamentoIdAsync(string planejamentoId)
        {
            return await _context.Participantes
                .Where(p => p.PlanejamentoId == planejamentoId)
                .ToListAsync();
        }

        public async Task<Participante> CreateAsync(Participante participante)
        {
            _context.Participantes.Add(participante);
            await _context.SaveChangesAsync();
            return participante;
        }

        public async Task UpdateAsync(string id, Participante participante)
        {
            var existing = await _context.Participantes.FirstOrDefaultAsync(p => p.Id == id);
            if (existing != null)
            {
                existing.Nome = participante.Nome;
                existing.RendaMensal = participante.RendaMensal;
                existing.RendaComplementar = participante.RendaComplementar;
                existing.GastosMensais = participante.GastosMensais;
                existing.UsarGastosDetalhados = participante.UsarGastosDetalhados;
                existing.SobraMensal = participante.SobraMensal;
                existing.AporteMensal = participante.AporteMensal;
                existing.PatrimonioInicial = participante.PatrimonioInicial;

                _context.Participantes.Update(existing);
                await _context.SaveChangesAsync();
            }
        }

        public async Task DeleteAsync(string id)
        {
            var existing = await _context.Participantes.FirstOrDefaultAsync(p => p.Id == id);
            if (existing != null)
            {
                _context.Participantes.Remove(existing);
                await _context.SaveChangesAsync();
            }
        }
    }
}
