using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ImovPlan.Domain.Entities;
using ImovPlan.Domain.Interfaces;
using ImovPlan.Infrastructure.Data;

namespace ImovPlan.Infrastructure.Repositories
{
    public class SaldoInicialRepository : ISaldoInicialRepository
    {
        private readonly AppDbContext _context;

        public SaldoInicialRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<SaldoInicial>> GetByPessoaIdAsync(string pessoaId)
        {
            return await _context.SaldosIniciais
                .Where(s => s.PessoaId == pessoaId)
                .ToListAsync();
        }

        public async Task<IEnumerable<SaldoInicial>> GetByObjetivoIdAsync(string objetivoId)
        {
            return await _context.SaldosIniciais
                .Where(s => s.ObjetivoImovelId == objetivoId)
                .ToListAsync();
        }

        public async Task<SaldoInicial> AddAsync(SaldoInicial saldo)
        {
            _context.SaldosIniciais.Add(saldo);
            await _context.SaveChangesAsync();
            return saldo;
        }
    }
}
