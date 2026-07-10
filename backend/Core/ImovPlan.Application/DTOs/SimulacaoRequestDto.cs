using System.Collections.Generic;

namespace ImovPlan.Application.DTOs
{
    public class SimulacaoRequestDto
    {
        public string ObjetivoId { get; set; } = string.Empty;
        public List<AporteMensalDto> AportesMensais { get; set; } = new();
        public List<AporteExtraDto> AportesExtras { get; set; } = new();
        public Dictionary<int, decimal>? AportesRegularesEditados { get; set; }
        public Dictionary<string, Dictionary<int, decimal>>? AportesRegularesEditadosPorPessoa { get; set; }
        public decimal TaxaCDI { get; set; }
        public decimal PercentualCdi { get; set; } = 100m;
        public string Cenario { get; set; } = "realista"; // "pessimista", "realista", "otimista"
    }

    public class AporteMensalDto
    {
        public string PessoaId { get; set; } = string.Empty;
        public decimal Valor { get; set; }
    }
}
