using System.Collections.Generic;
using System.Threading.Tasks;
using ImovPlan.Domain.Entities;

namespace ImovPlan.Domain.Interfaces
{
    public interface IAporteRegularEditRepository
    {
        Task<IEnumerable<AporteRegularEdit>> GetByObjetivoIdAsync(string objetivoId);
        Task<IEnumerable<AporteRegularEdit>> GetByObjetivoEPessoaAsync(string objetivoId, string pessoaId);
        Task UpsertByMesAsync(AporteRegularEdit aporte);
    }
}
