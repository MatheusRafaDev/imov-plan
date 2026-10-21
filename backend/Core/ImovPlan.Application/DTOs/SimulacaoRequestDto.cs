using System.Collections.Generic;

namespace ImovPlan.Application.DTOs
{
    public class SimulacaoRequestDto
    {
        public string ObjetivoId { get; set; } = string.Empty;
        public decimal? ValorJaGuardado { get; set; }
        public decimal? ValorImovel { get; set; }
        public decimal? PercentualEntrada { get; set; }
        public decimal? PercentualCustosExtras { get; set; }
        public int? PrazoMaxMeses { get; set; }
        public string? DataInicio { get; set; }
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
        public string? PessoaNome { get; set; }
        public decimal Valor { get; set; }
        public decimal? ValorAtual { get; set; }
        public string? DataValorAtual { get; set; }
    }
}
