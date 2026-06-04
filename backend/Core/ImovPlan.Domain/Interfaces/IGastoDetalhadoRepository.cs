using System.Collections.Generic;
using System.Threading.Tasks;
using ImovPlan.Domain.Entities;

namespace ImovPlan.Domain.Interfaces
{
    public interface IGastoDetalhadoRepository
    {
        Task<IEnumerable<GastoDetalhado>> GetByPessoaIdAsync(string pessoaId);
        Task<GastoDetalhado> AddAsync(GastoDetalhado gasto);
        Task DeleteAsync(string id);
    }
}
