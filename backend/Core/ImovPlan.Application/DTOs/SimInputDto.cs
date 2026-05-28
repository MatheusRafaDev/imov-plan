using System;
using System.Collections.Generic;

namespace ImovPlan.Application.DTOs
{
    public class SimInputDto
    {
        public decimal ValorImovel { get; set; }
        public decimal PercentualEntrada { get; set; }
        public decimal PercentualCustosExtras { get; set; }
        public decimal ValorJaGuardado { get; set; }
        public decimal AporteMensalTotal { get; set; }
        public decimal TaxaCdiAnual { get; set; }
        public decimal PercentualCdi { get; set; }
        public List<AporteDto> AportesExtras { get; set; } = new();
        public int? PrazoMaxMeses { get; set; }
        public DateTime? DataInicio { get; set; }
    }

    public class AporteDto
    {
        public DateTime Data { get; set; }
        public decimal Valor { get; set; }
    }
}
