using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ImovPlan.Domain.Entities;
using ImovPlan.Domain.Interfaces;
using ImovPlan.Infrastructure.Data;

namespace ImovPlan.Infrastructure.Repositories
{
    public class CustosImovelRepository : ICustosImovelRepository
    {
        private readonly AppDbContext _context;

        public CustosImovelRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<CustosImovel?> GetByObjetivoIdAsync(string objetivoId)
        {
            return await _context.CustosImoveis
                .FirstOrDefaultAsync(c => c.ObjetivoImovelId == objetivoId);
        }

        public async Task UpsertAsync(CustosImovel custos)
        {
            // EF Core MongoDB provider does not support native upsert — remove existing and insert new
            var existing = await _context.CustosImoveis
                .FirstOrDefaultAsync(c => c.ObjetivoImovelId == custos.ObjetivoImovelId);

            if (existing != null)
            {
                existing.ValorEntrada = custos.ValorEntrada;
                existing.TotalNecessario = custos.TotalNecessario;
                existing.PercentualCustosExtras = custos.PercentualCustosExtras;
                existing.CustoITBI = custos.CustoITBI;
                existing.CustoEscritura = custos.CustoEscritura;
                existing.CustoRegistro = custos.CustoRegistro;
                existing.CalculadoEm = custos.CalculadoEm;
                _context.CustosImoveis.Update(existing);
            }
            else
            {
                _context.CustosImoveis.Add(custos);
            }

            await _context.SaveChangesAsync();
        }
    }
}
