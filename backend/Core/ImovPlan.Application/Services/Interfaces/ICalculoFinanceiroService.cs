using System.Collections.Generic;
using ImovPlan.Application.DTOs;
using ImovPlan.Domain.Entities;

namespace ImovPlan.Application.Services.Interfaces
{
    public interface ICalculoFinanceiroService
    {
        decimal CalcularEntrada(decimal valorImovel, decimal percentual);
        (decimal CustoITBI, decimal CustoEscritura, decimal CustoRegistro) CalcularCustosExtras(decimal valorImovel);
        decimal CalcularSobraMensal(decimal renda, decimal gastos);

        /// <summary>
        /// Calcula o diagnóstico financeiro. totalNecessario e aportesExtrasTotal
        /// são passados diretamente pois não constam mais na entidade Planejamento.
        /// </summary>
        DiagnosticoFinanceiroDto CalcularDiagnostico(
            List<Participante> participantes,
            decimal totalNecessario,
            decimal aportesExtrasTotal);
    }
}
