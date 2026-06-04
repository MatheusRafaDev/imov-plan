using System.Collections.Generic;
using System.Threading.Tasks;
using ImovPlan.Domain.Entities;

namespace ImovPlan.Domain.Interfaces
{
    public interface IRegistroSimulacaoRepository
    {
        Task<RegistroSimulacao?> GetUltimoByObjetivoIdAsync(string objetivoId);
        Task<IEnumerable<RegistroSimulacao>> GetAllByObjetivoIdAsync(string objetivoId);
        Task<RegistroSimulacao> AddAsync(RegistroSimulacao registro);
    }
}
