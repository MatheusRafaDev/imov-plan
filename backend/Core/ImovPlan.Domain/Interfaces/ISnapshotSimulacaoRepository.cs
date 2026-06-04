using System.Collections.Generic;
using System.Threading.Tasks;
using ImovPlan.Domain.Entities;

namespace ImovPlan.Domain.Interfaces
{
    public interface ISnapshotSimulacaoRepository
    {
        Task<SnapshotSimulacao?> GetUltimoByObjetivoIdAsync(string objetivoId);
        Task<IEnumerable<SnapshotSimulacao>> GetAllByObjetivoIdAsync(string objetivoId);
        Task<SnapshotSimulacao> AddAsync(SnapshotSimulacao snapshot);
    }
}
