using System.Collections.Generic;
using System.Threading.Tasks;
using ImovPlan.Domain.Entities;

namespace ImovPlan.Domain.Interfaces
{
    public interface IGastoDetalhadoRepository
    {
        Task<IEnumerable<GastoDetalhado>> GetByParticipanteIdAsync(string participanteId);
        Task<IEnumerable<GastoDetalhado>> GetByPlanejamentoIdAsync(string planejamentoId);
        Task<GastoDetalhado> AddAsync(GastoDetalhado gasto);
        Task DeleteAsync(string id);
        Task DeleteByParticipanteIdAsync(string participanteId);
        Task DeleteByPlanejamentoIdAsync(string planejamentoId);
    }
}
