using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ImovPlan.Domain.Entities;
using ImovPlan.Domain.Interfaces;
using ImovPlan.Infrastructure.Data;

namespace ImovPlan.Infrastructure.Repositories
{
    public class PessoaRepository : IPessoaRepository
    {
        private readonly AppDbContext _context;

        public PessoaRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Pessoa?> GetByIdAsync(string id)
        {
            return await _context.Pessoas.FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<IEnumerable<Pessoa>> GetAllAsync()
        {
            return await _context.Pessoas.ToListAsync();
        }

        public async Task<Pessoa> CreateAsync(Pessoa pessoa)
        {
            _context.Pessoas.Add(pessoa);
            await _context.SaveChangesAsync();
            return pessoa;
        }

        public async Task UpdateAsync(string id, Pessoa pessoa)
        {
            var existing = await _context.Pessoas.FirstOrDefaultAsync(p => p.Id == id);
            if (existing != null)
            {
                existing.Nome = pessoa.Nome;
                existing.RendaMensal = pessoa.RendaMensal;
                existing.GastosMensais = pessoa.GastosMensais;
                existing.SobraMensal = pessoa.SobraMensal;
                existing.AporteMensal = pessoa.AporteMensal;
                
                _context.Pessoas.Update(existing);
                await _context.SaveChangesAsync();
            }
        }

        public async Task DeleteAsync(string id)
        {
            var existing = await _context.Pessoas.FirstOrDefaultAsync(p => p.Id == id);
            if (existing != null)
            {
                _context.Pessoas.Remove(existing);
                await _context.SaveChangesAsync();
            }
        }
    }
}
