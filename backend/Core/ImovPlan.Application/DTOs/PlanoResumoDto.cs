using System;

namespace ImovPlan.Application.DTOs
{
    /// <summary>
    /// Resumo leve de um plano, usado para listar todos os planos de um usuário
    /// (tela "Meus Planos") sem precisar carregar pessoas, aportes, etc.
    /// </summary>
    public class PlanoResumoDto
    {
        public string Id { get; set; } = string.Empty;
        public string NomePlano { get; set; } = "Imóvel";
        public decimal ValorImovel { get; set; }
        public decimal PercentualEntrada { get; set; }
        public int? PrazoMaxMeses { get; set; }
        public string? Estado { get; set; }
        public string? Cidade { get; set; }
        public string Status { get; set; } = "Draft";
        public DateTime CreatedAt { get; set; }
    }
}
