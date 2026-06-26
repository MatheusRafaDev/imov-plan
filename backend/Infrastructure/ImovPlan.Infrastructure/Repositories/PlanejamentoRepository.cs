using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ImovPlan.Domain.Entities;
using ImovPlan.Domain.Interfaces;
using ImovPlan.Infrastructure.Data;

namespace ImovPlan.Infrastructure.Repositories
{
    public class PlanejamentoRepository : IPlanejamentoRepository
    {
        private readonly AppDbContext _context;

        public PlanejamentoRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Planejamento?> GetByIdAsync(string id)
        {
            return await _context.Planejamentos.FirstOrDefaultAsync(o => o.Id == id);
        }

        public async Task<Planejamento?> GetBySessionIdAsync(string sessionId)
        {
            return await _context.Planejamentos.FirstOrDefaultAsync(o => o.SessionId == sessionId && o.Status == "Draft");
        }

        public async Task<Planejamento?> GetByUsuarioIdAsync(string usuarioId)
        {
            return await _context.Planejamentos.FirstOrDefaultAsync(o => o.UsuarioId == usuarioId);
        }

        public async Task<Planejamento> CreateAsync(Planejamento planejamento)
        {
            _context.Planejamentos.Add(planejamento);
            await _context.SaveChangesAsync();
            return planejamento;
        }

        public async Task UpdateAsync(string id, Planejamento planejamento)
        {
            var existing = await _context.Planejamentos.FirstOrDefaultAsync(o => o.Id == id);
            if (existing != null)
            {
                existing.NomePlano = planejamento.NomePlano;
                existing.ValorImovel = planejamento.ValorImovel;
                existing.PercentualEntrada = planejamento.PercentualEntrada;
                existing.PercentualCustosExtras = planejamento.PercentualCustosExtras;
                existing.PrazoMaxMeses = planejamento.PrazoMaxMeses;
                existing.TaxaCdiAnual = planejamento.TaxaCdiAnual;
                existing.PercentualCdi = planejamento.PercentualCdi;
                existing.DataInicio = planejamento.DataInicio;
                existing.BancoEscolhidoId = planejamento.BancoEscolhidoId;
                existing.BancoEscolhidoNome = planejamento.BancoEscolhidoNome;
                existing.BancoEscolhidoTaxa = planejamento.BancoEscolhidoTaxa;
                existing.ParticipantesIds = planejamento.ParticipantesIds;
                existing.MesesConcluidos = planejamento.MesesConcluidos;
                existing.TipoInvestimento = planejamento.TipoInvestimento;
                existing.Status = planejamento.Status;
                existing.UsuarioId = planejamento.UsuarioId;
                existing.CustosCompra = planejamento.CustosCompra;

                _context.Planejamentos.Update(existing);
                await _context.SaveChangesAsync();
            }
        }

        public async Task DeleteAsync(string id)
        {
            var existing = await _context.Planejamentos.FirstOrDefaultAsync(o => o.Id == id);
            if (existing != null)
            {
                _context.Planejamentos.Remove(existing);
                await _context.SaveChangesAsync();
            }
        }
    }
}
