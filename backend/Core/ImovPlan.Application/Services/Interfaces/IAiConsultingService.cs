using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using ImovPlan.Application.DTOs;

namespace ImovPlan.Application.Services.Interfaces
{
    public interface IAiConsultingService
    {
        Task<string> GetConsultoriaAsync(ConsultoriaRequestDto request);
        IAsyncEnumerable<string> GetConsultoriaStreamAsync(ConsultoriaRequestDto request, CancellationToken cancellationToken = default);
    }
}
