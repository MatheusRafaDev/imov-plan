using ImovPlan.Application.DTOs;
using ImovPlan.Domain.Entities;

namespace ImovPlan.Application.Services.Interfaces
{
    public interface ISimulacaoService
    {
        SimulacaoResultado ExecutarSimulacao(SimulacaoRequestDto request, ObjetivoImovel objetivo);
        decimal CalcularIR(int meses, decimal rendimento);
        decimal AplicarJurosCompostos(decimal capital, decimal taxaMensal, int meses);
    }
}
