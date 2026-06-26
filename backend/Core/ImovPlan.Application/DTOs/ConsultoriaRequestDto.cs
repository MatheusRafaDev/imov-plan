using System.Collections.Generic;
using ImovPlan.Domain.Entities; // Needed for the 'imovel' property definition

namespace ImovPlan.Application.DTOs
{
    public class ConsultoriaRequestDto
    {
        public List<PessoaConsultoriaDto> Pessoas { get; set; } = new();
        public decimal Renda_Total_Bruta { get; set; }
        
        // We can reuse the Domain entity Planejamento to simplify, or map it dynamically
        public Planejamento? Imovel { get; set; }
    }

    public class PessoaConsultoriaDto
    {
        public string Nome { get; set; } = string.Empty;
        public decimal Renda_Mensal { get; set; }
        public decimal Renda_Complementar { get; set; }
        public decimal Gastos_Totais_Calculados { get; set; }
        public bool Usa_Gastos_Detalhados { get; set; }
    }
}
