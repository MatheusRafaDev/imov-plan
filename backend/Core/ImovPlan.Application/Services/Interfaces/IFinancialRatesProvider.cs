using System.Threading.Tasks;

namespace ImovPlan.Application.Services.Interfaces
{
    public interface IFinancialRatesProvider
    {
        Task<decimal> GetCurrentSelicAsync();
        Task<decimal> GetCurrentCdiAsync();
        Task<decimal> GetCurrentIpcaAsync();
    }
}
