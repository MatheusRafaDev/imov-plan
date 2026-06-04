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

        public async Task<IEnumerable<GastoDetalhado>> GetByPessoaIdAsync(string pessoaId)
        {
            return await _context.GastosDetalhados
                .Where(g => g.PessoaId == pessoaId)
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
    }
}
