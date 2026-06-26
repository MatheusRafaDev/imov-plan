using System;
using System.Collections.Generic;
using System.Linq;
using ImovPlan.Application.DTOs;
using ImovPlan.Domain.Entities;
using ImovPlan.Application.Services.Interfaces;

namespace ImovPlan.Application.Services
{
    public class CalculoFinanceiroService : ICalculoFinanceiroService
    {
        public decimal CalcularEntrada(decimal valorImovel, decimal percentual)
        {
            return valorImovel * (percentual / 100);
        }

        public (decimal CustoITBI, decimal CustoEscritura, decimal CustoRegistro) CalcularCustosExtras(decimal valorImovel)
        {
            return (
                valorImovel * 0.02m, // Valor padrão; cálculos persistidos usam parametrosFinanceiros.
                valorImovel * 0.01m,
                valorImovel * 0.005m
            );
        }

        public decimal CalcularSobraMensal(decimal renda, decimal gastos)
        {
            var sobra = renda - gastos;
            return sobra > 0 ? sobra : 0;
        }

        public DiagnosticoFinanceiroDto CalcularDiagnostico(
            List<Participante> participantes,
            decimal totalNecessario,
            decimal aportesExtrasTotal)
        {
            var dto = new DiagnosticoFinanceiroDto();

            if (participantes.Count > 0) dto.SobraPessoa1 = participantes[0].SobraMensal;
            if (participantes.Count > 1) dto.SobraPessoa2 = participantes[1].SobraMensal;

            dto.SobraCasal = participantes.Sum(p => p.SobraMensal);

            var falta = totalNecessario - aportesExtrasTotal;
            dto.ValorFaltante = falta > 0 ? falta : 0;

            return dto;
        }
    }
}
