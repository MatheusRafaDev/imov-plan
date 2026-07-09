using System;
using System.Collections.Generic;

namespace ImovPlan.Domain.Entities
{
    public class SimulacaoResultado
    {
        public DateTime DataPrevistaAlvo { get; set; }
        public int MesesParaAtingir { get; set; }
        public decimal TotalInvestido { get; set; }
        public decimal TotalAcumulado { get; set; }
        public decimal LucroLiquido { get; set; }
        public List<DetalheMensal> DetalhesMensais { get; set; } = new();
    }

    public class DetalheMensal
    {
        public int Mes { get; set; }
        public DateTime DataReferencia { get; set; }
        public decimal AporteMensal { get; set; }
        public decimal AportesExtras { get; set; }
        public decimal RendimentoBruto { get; set; }
        public decimal Imposto { get; set; }
        public decimal RendimentoLiquido { get; set; }
        public decimal TotalAcumulado { get; set; }
        public List<EvolucaoMensalParticipante> Participantes { get; set; } = new();
    }
}
