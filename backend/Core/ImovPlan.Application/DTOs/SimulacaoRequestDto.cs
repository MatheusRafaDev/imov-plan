using System.Collections.Generic;

namespace ImovPlan.Application.DTOs
{
    public class SimulacaoRequestDto
    {
        public string ObjetivoId { get; set; } = string.Empty;
        public List<AporteMensalDto> AportesMensais { get; set; } = new();
        public List<AporteExtraDto> AportesExtras { get; set; } = new();
        public decimal TaxaCDI { get; set; }
    }

    public class AporteMensalDto
    {
        public string PessoaId { get; set; } = string.Empty;
        public decimal Valor { get; set; }
    }
}
