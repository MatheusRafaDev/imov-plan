using System.Threading.Tasks;
using ImovPlan.Domain.Entities;

namespace ImovPlan.Domain.Interfaces
{
    public interface IPlanejamentoRepository
    {
        Task<Planejamento?> GetByIdAsync(string id);
        Task<Planejamento?> GetBySessionIdAsync(string sessionId);
        Task<Planejamento?> GetByUsuarioIdAsync(string usuarioId);
        Task<Planejamento> CreateAsync(Planejamento planejamento);
        Task UpdateAsync(string id, Planejamento planejamento);
        Task DeleteAsync(string id);
    }
}
