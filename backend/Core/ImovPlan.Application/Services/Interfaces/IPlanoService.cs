using System.Threading.Tasks;
using ImovPlan.Application.DTOs;

namespace ImovPlan.Application.Services.Interfaces
{
    public interface IPlanoService
    {
        Task<bool> UpdateDraftAsync(string id, PlanoDraftDto draftDto, string usuarioIdAutenticado);
        Task<PlanoDraftDto?> GetDraftAsync(string id, string usuarioIdAutenticado);
        Task<PlanoDraftDto?> GetDraftByUsuarioIdAsync(string usuarioId);
        Task<PlanoDraftDto> GetOrCreateDraftForUserAsync(string usuarioId);
        Task<bool> ConcluirPlanoAsync(string id, string usuarioId);
        Task DeleteAllUserDataAsync(string usuarioId);
    }
}