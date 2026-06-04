using System.Collections.Generic;
using System.Threading.Tasks;
using ImovPlan.Domain.Entities;

namespace ImovPlan.Domain.Interfaces
{
    public interface ISaldoInicialRepository
    {
        Task<IEnumerable<SaldoInicial>> GetByPessoaIdAsync(string pessoaId);
        Task<IEnumerable<SaldoInicial>> GetByObjetivoIdAsync(string objetivoId);
        Task<SaldoInicial> AddAsync(SaldoInicial saldo);
    }
}
