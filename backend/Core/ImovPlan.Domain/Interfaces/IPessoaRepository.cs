using System.Collections.Generic;
using System.Threading.Tasks;
using ImovPlan.Domain.Entities;

namespace ImovPlan.Domain.Interfaces
{
    public interface IPessoaRepository
    {
        Task<Pessoa?> GetByIdAsync(string id);
        Task<IEnumerable<Pessoa>> GetAllAsync();
        Task<IEnumerable<Pessoa>> GetByObjetivoIdAsync(string objetivoId);
        Task<Pessoa> CreateAsync(Pessoa pessoa);
        Task UpdateAsync(string id, Pessoa pessoa);
        Task DeleteAsync(string id);
    }
}
