using System.Threading.Tasks;
using ImovPlan.Domain.Entities;

namespace ImovPlan.Domain.Interfaces
{
    public interface ICustosImovelRepository
    {
        Task<CustosImovel?> GetByObjetivoIdAsync(string objetivoId);
        Task UpsertAsync(CustosImovel custos);
    }
}
