using System.Collections.Generic;
using System.Threading.Tasks;
using ImovPlan.Domain.Entities;

namespace ImovPlan.Domain.Interfaces
{
    public interface IHistoricoSimulacaoRepository
    {
        Task<HistoricoSimulacao?> GetUltimoByPlanejamentoIdAsync(string planejamentoId);
        Task<IEnumerable<HistoricoSimulacao>> GetAllByPlanejamentoIdAsync(string planejamentoId);
        Task<HistoricoSimulacao> AddAsync(HistoricoSimulacao registro);
        Task DeleteAsync(string id);
        Task DeleteAllByPlanejamentoIdAsync(string planejamentoId);
        Task<IEnumerable<EvolucaoMensalSimulacao>> GetEvolucaoBySimulacaoIdAsync(string simulacaoId);
        Task AddEvolucaoAsync(IEnumerable<EvolucaoMensalSimulacao> evolucao);
    }
}
