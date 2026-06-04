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
                valorImovel * 0.02m, // ITBI ~2%
                valorImovel * 0.01m, // Escritura ~1%
                valorImovel * 0.005m // Registro ~0.5%
            );
        }

        public decimal CalcularSobraMensal(decimal renda, decimal gastos)
        {
            var sobra = renda - gastos;
            return sobra > 0 ? sobra : 0;
        }

        public DiagnosticoFinanceiroDto CalcularDiagnostico(
            List<Pessoa> pessoas,
            decimal totalNecessario,
            decimal aportesExtrasTotal)
        {
            var dto = new DiagnosticoFinanceiroDto();

            if (pessoas.Count > 0) dto.SobraPessoa1 = pessoas[0].SobraMensal;
            if (pessoas.Count > 1) dto.SobraPessoa2 = pessoas[1].SobraMensal;

            dto.SobraCasal = pessoas.Sum(p => p.SobraMensal);

            var falta = totalNecessario - aportesExtrasTotal;
            dto.ValorFaltante = falta > 0 ? falta : 0;

            return dto;
        }
    }
}
