using System.Threading.Tasks;
using ImovPlan.Domain.Entities;

namespace ImovPlan.Domain.Interfaces
{
    public interface IParametrosFinanceirosRepository
    {
        Task<ParametrosFinanceiros> GetAtivoAsync();
        Task<ParametrosFinanceiros> UpsertAsync(ParametrosFinanceiros parametros);
    }
}
