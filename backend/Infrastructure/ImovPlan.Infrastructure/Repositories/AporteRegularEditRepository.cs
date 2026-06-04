using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ImovPlan.Domain.Entities;
using ImovPlan.Domain.Interfaces;
using ImovPlan.Infrastructure.Data;

namespace ImovPlan.Infrastructure.Repositories
{
    public class AporteRegularEditRepository : IAporteRegularEditRepository
    {
        private readonly AppDbContext _context;

        public AporteRegularEditRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<AporteRegularEdit>> GetByObjetivoIdAsync(string objetivoId)
        {
            return await _context.AportesRegularesEdits
                .Where(a => a.ObjetivoImovelId == objetivoId)
                .ToListAsync();
        }

        public async Task<IEnumerable<AporteRegularEdit>> GetByObjetivoEPessoaAsync(string objetivoId, string pessoaId)
        {
            return await _context.AportesRegularesEdits
                .Where(a => a.ObjetivoImovelId == objetivoId && a.PessoaId == pessoaId)
                .ToListAsync();
        }

        public async Task UpsertByMesAsync(AporteRegularEdit aporte)
        {
            // Upsert keyed by (ObjetivoImovelId, PessoaId, Mes)
            var existing = await _context.AportesRegularesEdits
                .FirstOrDefaultAsync(a =>
                    a.ObjetivoImovelId == aporte.ObjetivoImovelId &&
                    a.PessoaId == aporte.PessoaId &&
                    a.Mes == aporte.Mes);

            if (existing != null)
            {
                _context.AportesRegularesEdits.Remove(existing);
                await _context.SaveChangesAsync();
            }

            _context.AportesRegularesEdits.Add(aporte);
            await _context.SaveChangesAsync();
        }
    }
}
