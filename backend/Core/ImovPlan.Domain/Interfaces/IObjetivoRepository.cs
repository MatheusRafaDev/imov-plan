using System.Threading.Tasks;
using ImovPlan.Domain.Entities;

namespace ImovPlan.Domain.Interfaces
{
    public interface IObjetivoRepository
    {
        Task<ObjetivoImovel?> GetByIdAsync(string id);
        Task<ObjetivoImovel> CreateAsync(ObjetivoImovel objetivo);
        Task UpdateAsync(string id, ObjetivoImovel objetivo);
        Task DeleteAsync(string id);
    }
}
