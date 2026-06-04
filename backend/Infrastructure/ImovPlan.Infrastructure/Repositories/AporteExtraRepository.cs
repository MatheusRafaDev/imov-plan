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

        public async Task<IEnumerable<AporteExtra>> GetByObjetivoIdAsync(string objetivoId)
        {
            return await _context.AportesExtras
                .Where(a => a.ObjetivoImovelId == objetivoId)
                .ToListAsync();
        }

        public async Task<IEnumerable<AporteExtra>> GetByPessoaIdAsync(string pessoaId)
        {
            return await _context.AportesExtras
                .Where(a => a.PessoaId == pessoaId)
                .ToListAsync();
        }

        public async Task<AporteExtra> AddAsync(AporteExtra aporte)
        {
            _context.AportesExtras.Add(aporte);
            await _context.SaveChangesAsync();
            return aporte;
        }

        public async Task DeleteByObjetivoIdAsync(string objetivoId)
        {
            var aportes = await _context.AportesExtras
                .Where(a => a.ObjetivoImovelId == objetivoId)
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
