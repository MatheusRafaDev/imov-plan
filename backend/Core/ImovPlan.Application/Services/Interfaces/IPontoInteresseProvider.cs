using System.Collections.Generic;
using System.Threading.Tasks;
using ImovPlan.Domain.Entities;

using System.Threading;

namespace ImovPlan.Application.Services.Interfaces
{
    public interface IPontoInteresseProvider
    {
        Task<IEnumerable<PontoInteresse>> FetchAsync(double latitude, double longitude, double raioMetros, IEnumerable<string> categorias, CancellationToken cancellationToken = default);
    }
}
