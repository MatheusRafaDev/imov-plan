using System.Collections.Generic;
using System.Threading.Tasks;
using ImovPlan.Domain.Entities;

namespace ImovPlan.Domain.Interfaces
{
    public interface IParticipanteRepository
    {
        Task<Participante?> GetByIdAsync(string id);
        Task<IEnumerable<Participante>> GetByPlanejamentoIdAsync(string planejamentoId);
        Task<Participante> CreateAsync(Participante participante);
        Task UpdateAsync(string id, Participante participante);
        Task DeleteAsync(string id);
    }
}
