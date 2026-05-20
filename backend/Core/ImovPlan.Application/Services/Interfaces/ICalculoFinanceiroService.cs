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
        DiagnosticoFinanceiroDto CalcularDiagnostico(List<Pessoa> pessoas, ObjetivoImovel objetivo);
    }
}
