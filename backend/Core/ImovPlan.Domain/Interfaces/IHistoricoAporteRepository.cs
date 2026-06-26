using System.Collections.Generic;
using System.Threading.Tasks;
using ImovPlan.Domain.Entities;

namespace ImovPlan.Domain.Interfaces
{
    public interface IHistoricoAporteRepository
    {
        Task<IEnumerable<HistoricoAporte>> GetByPlanejamentoIdAsync(string planejamentoId);
        Task<IEnumerable<HistoricoAporte>> GetByPlanejamentoEParticipanteAsync(string planejamentoId, string participanteId);
        Task UpsertByMesAsync(HistoricoAporte aporte);
        Task DeleteByPlanejamentoIdAsync(string planejamentoId);
    }
}
