using System.Collections.Generic;
using System.Threading.Tasks;
using ImovPlan.Domain.Entities;

namespace ImovPlan.Domain.Interfaces
{
    public interface IUsuarioRepository
    {
        Task<Usuario?> GetByIdAsync(string id);
        Task<Usuario?> GetByEmailAsync(string email);
        Task<Usuario> CreateAsync(Usuario usuario);
        Task UpdateAsync(string id, Usuario usuario);
        Task DeleteAsync(string id);
    }
}
