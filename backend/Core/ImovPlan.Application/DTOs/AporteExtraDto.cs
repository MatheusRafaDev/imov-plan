using System;

namespace ImovPlan.Application.DTOs
{
    public class AporteExtraDto
    {
        public string? Id { get; set; }
        public DateTime Data { get; set; }
        public decimal Valor { get; set; }
        public string Origem { get; set; } = string.Empty;
        public string PessoaId { get; set; } = string.Empty;
        public string PessoaNome { get; set; } = string.Empty;
        public string Tipo { get; set; } = "Aporte"; // "Aporte" ou "Retirada"
        public string? Motivo { get; set; }
        public bool Revertido { get; set; } = false;
        public DateTime? RevertidoEm { get; set; }
    }
}
