using System;
using System.Collections.Generic;

namespace ImovPlan.Application.DTOs
{
    public class SimulacaoResultDto
    {
        public string Id { get; set; } = string.Empty;
        public string PlanejamentoId { get; set; } = string.Empty;
        public DateTime GeradoEm { get; set; }
        public string Origem { get; set; } = "auto";
        public int Versao { get; set; }

        // Inputs
        public decimal ValorImovel { get; set; }
        public decimal TotalNecessario { get; set; }
        public decimal ValorJaGuardado { get; set; }
        public decimal AporteMensalTotal { get; set; }
        public decimal TaxaCdiAnual { get; set; }
        public decimal PercentualCdi { get; set; }

        // Outputs
        public int MesesParaAtingir { get; set; }
        public DateTime DataPrevistaAlvo { get; set; }
        public decimal TotalInvestido { get; set; }
        public decimal TotalAcumulado { get; set; }
        public decimal LucroLiquido { get; set; }
        public bool AtingiuMeta { get; set; }
        public decimal Falta { get; set; }

        // Evolução mensal
        public List<DetalheMensalDto> DetalhesMensais { get; set; } = new();
        public List<ParticipanteSnapshotDto> ParticipantesSnapshot { get; set; } = new();
    }

    public class DetalheMensalDto
    {
        public int Mes { get; set; }
        public DateTime DataReferencia { get; set; }
        public decimal AporteMensal { get; set; }
        public decimal AportesExtras { get; set; }
        public decimal RendimentoBruto { get; set; }
        public decimal Imposto { get; set; }
        public decimal RendimentoLiquido { get; set; }
        public decimal TotalAcumulado { get; set; }
    }

    public class ParticipanteSnapshotDto
    {
        public string ParticipanteId { get; set; } = string.Empty;
        public string Nome { get; set; } = string.Empty;
        public decimal AporteMensal { get; set; }
        public decimal ValorInicial { get; set; }
        public decimal SobraMensal { get; set; }
    }
}