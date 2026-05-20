using System.Collections.Generic;

namespace ImovPlan.Application.DTOs
{
    public class ObjetivoImovelDto
    {
        public string? Id { get; set; }
        public decimal ValorImovel { get; set; }
        public decimal PercentualEntrada { get; set; }
        public int PrazoMeses { get; set; }
        public decimal ValorEntrada { get; set; }
        public decimal CustoITBI { get; set; }
        public decimal CustoEscritura { get; set; }
        public decimal CustoRegistro { get; set; }
        public decimal TotalNecessario { get; set; }
        public decimal ValorJaGuardado { get; set; }
        public decimal TaxaCDI { get; set; }
        public List<string> PessoasIds { get; set; } = new();
        public List<AporteExtraDto> AportesExtras { get; set; } = new();
    }
}
