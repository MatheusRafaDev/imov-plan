using System.Collections.Generic;

namespace ImovPlan.Application.DTOs
{
    public class AvaliacaoRegiaoRequestDto
    {
        public int QuantidadeMercados { get; set; }
        public int QuantidadeFarmacias { get; set; }
        public int QuantidadeEscolas { get; set; }
        public int QuantidadeHospitais { get; set; }
        public int QuantidadeParques { get; set; }
        public List<string> PrincipaisLocais { get; set; } = new();
    }
}
