using System.Collections.Generic;
using System.Threading.Tasks;
using ImovPlan.Domain.Entities;

namespace ImovPlan.Application.Services.Interfaces
{
    public interface IPontoInteresseService
    {
        Task<IEnumerable<PontoInteresse>> BuscarPontosInteresseAsync(double latitude, double longitude, double raioMetros, IEnumerable<string> categorias);
    }
}
