using System;

namespace ImovPlan.Domain.Entities
{
    public class AporteExtra
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public DateTime Data { get; set; }
        public decimal Valor { get; set; }
        public string Origem { get; set; } = string.Empty; // FGTS, Bônus, Freelance, etc.
        public string PessoaId { get; set; } = string.Empty;
        public string PessoaNome { get; set; } = string.Empty;
    }
}
