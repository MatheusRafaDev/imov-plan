using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ImovPlan.Domain.Entities;
using ImovPlan.Domain.Interfaces;
using ImovPlan.Infrastructure.Data;

namespace ImovPlan.Infrastructure.Repositories
{
    public class ObjetivoRepository : IObjetivoRepository
    {
        private readonly AppDbContext _context;

        public ObjetivoRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ObjetivoImovel?> GetByIdAsync(string id)
        {
            return await _context.Objetivos.FirstOrDefaultAsync(o => o.Id == id);
        }

        public async Task<ObjetivoImovel> CreateAsync(ObjetivoImovel objetivo)
        {
            _context.Objetivos.Add(objetivo);
            await _context.SaveChangesAsync();
            return objetivo;
        }

        public async Task UpdateAsync(string id, ObjetivoImovel objetivo)
        {
            var existing = await _context.Objetivos.FirstOrDefaultAsync(o => o.Id == id);
            if (existing != null)
            {
                existing.NomePlano = objetivo.NomePlano;
                existing.ValorImovel = objetivo.ValorImovel;
                existing.PercentualEntrada = objetivo.PercentualEntrada;
                existing.PrazoMaxMeses = objetivo.PrazoMaxMeses;
                existing.ValorJaGuardado = objetivo.ValorJaGuardado;
                existing.TaxaCdiAnual = objetivo.TaxaCdiAnual;
                existing.PercentualCdi = objetivo.PercentualCdi;
                existing.DataInicio = objetivo.DataInicio;
                existing.BancoEscolhidoId = objetivo.BancoEscolhidoId;
                existing.BancoEscolhidoNome = objetivo.BancoEscolhidoNome;
                existing.BancoEscolhidoTaxa = objetivo.BancoEscolhidoTaxa;
                existing.PessoasIds = objetivo.PessoasIds;
                existing.MesesConcluidos = objetivo.MesesConcluidos;
                existing.Status = objetivo.Status;
                existing.UsuarioId = objetivo.UsuarioId;

                _context.Objetivos.Update(existing);
                await _context.SaveChangesAsync();
            }
        }

        public async Task DeleteAsync(string id)
        {
            var existing = await _context.Objetivos.FirstOrDefaultAsync(o => o.Id == id);
            if (existing != null)
            {
                _context.Objetivos.Remove(existing);
                await _context.SaveChangesAsync();
            }
        }
    }
}
