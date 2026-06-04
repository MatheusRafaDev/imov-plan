using System.Collections.Generic;
using System.Threading.Tasks;
using ImovPlan.Domain.Entities;

namespace ImovPlan.Domain.Interfaces
{
    public interface IAporteExtraRepository
    {
        Task<IEnumerable<AporteExtra>> GetByObjetivoIdAsync(string objetivoId);
        Task<IEnumerable<AporteExtra>> GetByPessoaIdAsync(string pessoaId);
        Task<AporteExtra> AddAsync(AporteExtra aporte);
    }
}
