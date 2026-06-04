using System.Threading.Tasks;
using ImovPlan.Application.DTOs;

namespace ImovPlan.Application.Services.Interfaces
{
    public interface IPlanoService
    {
        Task<string> CreateDraftAsync(string sessionId);
        Task<bool> UpdateDraftAsync(string id, PlanoDraftDto draftDto);
        Task<PlanoDraftDto?> GetDraftAsync(string id, string sessionId);
        Task<PlanoDraftDto?> GetDraftBySessionIdAsync(string sessionId);
        Task<PlanoDraftDto?> GetDraftByUsuarioIdAsync(string usuarioId);
        Task<bool> LinkPlanToUserAsync(string id, string usuarioId);
        Task ConcluirPlanoAsync(string id);
    }
}
