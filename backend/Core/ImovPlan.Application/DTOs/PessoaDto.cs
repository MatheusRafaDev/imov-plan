using System;

namespace ImovPlan.Application.DTOs
{
    public class PessoaDto
    {
        public string? Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public decimal RendaMensal { get; set; }
        public decimal GastosMensais { get; set; }
        public decimal SobraMensal { get; set; }
        public decimal AporteMensal { get; set; }
    }
}
