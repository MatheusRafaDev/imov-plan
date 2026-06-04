using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ImovPlan.Domain.Entities;
using ImovPlan.Domain.Interfaces;
using ImovPlan.Infrastructure.Data;

namespace ImovPlan.Infrastructure.Repositories
{
    public class RegistroSimulacaoRepository : IRegistroSimulacaoRepository
    {
        private readonly AppDbContext _context;

        public RegistroSimulacaoRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<RegistroSimulacao?> GetUltimoByObjetivoIdAsync(string objetivoId)
        {
            return await _context.RegistrosSimulacao
                .Where(s => s.ObjetivoImovelId == objetivoId)
                .OrderByDescending(s => s.GeradoEm)
                .FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<RegistroSimulacao>> GetAllByObjetivoIdAsync(string objetivoId)
        {
            return await _context.RegistrosSimulacao
                .Where(s => s.ObjetivoImovelId == objetivoId)
                .OrderByDescending(s => s.GeradoEm)
                .ToListAsync();
        }

        public async Task<RegistroSimulacao> AddAsync(RegistroSimulacao registro)
        {
            _context.RegistrosSimulacao.Add(registro);
            await _context.SaveChangesAsync();
            return registro;
        }
    }
}
