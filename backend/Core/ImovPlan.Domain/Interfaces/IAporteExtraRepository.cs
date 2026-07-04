using System.Collections.Generic;
using System.Threading.Tasks;
using ImovPlan.Domain.Entities;

namespace ImovPlan.Domain.Interfaces
{
    public interface IAporteExtraRepository
    {
        Task<IEnumerable<AporteExtra>> GetByPlanejamentoIdAsync(string planejamentoId);
        Task<IEnumerable<AporteExtra>> GetByParticipanteIdAsync(string participanteId);
        Task<AporteExtra> AddAsync(AporteExtra aporte);
        Task AddRangeAsync(IEnumerable<AporteExtra> aportes);
        Task DeleteByPlanejamentoIdAsync(string planejamentoId);
    }
}
