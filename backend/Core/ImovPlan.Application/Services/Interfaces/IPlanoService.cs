using System.Collections.Generic;
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

        /// <summary>Lista todos os planos do usuário (resumo), do mais recente para o mais antigo.</summary>
        Task<List<PlanoResumoDto>> GetTodosResumosByUsuarioIdAsync(string usuarioId);

        /// <summary>Sempre cria um novo plano (draft) para o usuário, sem reaproveitar um existente.</summary>
        Task<PlanoDraftDto> CreateNewDraftForUserAsync(string usuarioId);

        /// <summary>Remove um plano específico (e todos os dados associados) do usuário autenticado.</summary>
        Task<bool> DeletePlanoAsync(string id, string usuarioIdAutenticado);

        /// <summary>Vincula um plano ainda sem dono (criado como convidado) à conta recém-criada/logada.</summary>
        Task<bool> LinkPlanoToUserAsync(string id, string usuarioId);
    }
}