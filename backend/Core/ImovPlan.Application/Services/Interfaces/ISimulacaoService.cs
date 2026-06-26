using System.Threading.Tasks;
using ImovPlan.Application.DTOs;
using ImovPlan.Domain.Entities;

namespace ImovPlan.Application.Services.Interfaces
{
    public interface ISimulacaoService
    {
        Task<SimulacaoResultado> ExecutarSimulacaoAsync(
            SimulacaoRequestDto request,
            Planejamento planejamento,
            decimal totalNecessario,
            string origem = "auto",
            int stepAtual = 0);

        decimal CalcularIR(int meses, decimal rendimento);
        decimal AplicarJurosCompostos(decimal capital, decimal taxaMensal, int meses);
    }
}
